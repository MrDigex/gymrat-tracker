<?php

namespace App\Http\Controllers;

use App\Jobs\ImportStravaActivity;
use App\Services\Strava\StravaActivityMapper;
use App\Services\Strava\StravaClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class StravaController extends Controller
{
    public function connect(Request $request, StravaClient $strava): Response
    {
        abort_unless($strava->isConfigured(), 404);

        $state = Str::random(40);
        $request->session()->put('strava_state', $state);

        return Inertia::location($strava->authorizeUrl(route('integrations.strava.callback'), $state));
    }

    public function callback(Request $request, StravaClient $strava): RedirectResponse
    {
        $expectedState = $request->session()->pull('strava_state');

        if ($request->filled('error') || ! $expectedState || ! hash_equals($expectedState, (string) $request->query('state'))) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'No se pudo conectar con Strava.']);

            return to_route('integrations.index');
        }

        if (! str_contains((string) $request->query('scope'), 'activity:read')) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Necesitamos permiso para leer tus actividades de Strava.']);

            return to_route('integrations.index');
        }

        $tokens = $strava->exchangeCode((string) $request->query('code'));

        $request->user()->stravaAccount()->updateOrCreate([], [
            'athlete_id' => $tokens['athlete']['id'],
            'athlete_name' => trim(($tokens['athlete']['firstname'] ?? '').' '.($tokens['athlete']['lastname'] ?? '')) ?: null,
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'expires_at' => now()->setTimestamp($tokens['expires_at']),
            'scopes' => $request->query('scope'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Strava conectado. Tus nuevas carreras se importarán automáticamente.']);

        return to_route('integrations.index');
    }

    /**
     * Queue the import of the last 30 days of runs.
     */
    public function backfill(Request $request, StravaClient $strava, StravaActivityMapper $mapper): RedirectResponse
    {
        $account = $request->user()->stravaAccount;
        abort_unless($account !== null, 404);

        $runs = collect($strava->activitiesSince($account, now()->subDays(30)->getTimestamp()))->filter(fn (array $activity) => $mapper->isRun($activity));

        $runs->each(fn (array $activity) => ImportStravaActivity::dispatch($account, (int) $activity['id']));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Importando {$runs->count()} carreras de Strava…"]);

        return back();
    }

    public function disconnect(Request $request, StravaClient $strava): RedirectResponse
    {
        $account = $request->user()->stravaAccount;

        if ($account) {
            rescue(fn () => $strava->deauthorize($account), report: false);
            $account->delete();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Strava desconectado.']);

        return back();
    }
}
