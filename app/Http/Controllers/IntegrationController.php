<?php

namespace App\Http\Controllers;

use App\Services\Strava\StravaClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

class IntegrationController extends Controller
{
    public const string SHORTCUT_ABILITY = 'activities:write';

    public function index(Request $request, StravaClient $strava): Response
    {
        $account = $request->user()->stravaAccount;

        return Inertia::render('integrations/index', [
            'strava' => [
                'configured' => $strava->isConfigured(),
                'connected' => $account !== null,
                'athlete_id' => $account?->athlete_id,
                'connected_at' => $account?->created_at?->toIso8601String(),
                'imported_count' => $request->user()->activities()->where('source', 'strava')->count(),
            ],
            'tokens' => $request->user()->tokens()->latest()->get()->map(fn (PersonalAccessToken $token) => [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at?->toIso8601String(),
                'created_at' => $token->created_at?->toIso8601String(),
            ]),
            'apiEndpoint' => route('api.activities.store'),
            'shortcutImported' => $request->user()->activities()->where('source', 'shortcut')->count(),
        ]);
    }

    /**
     * Create a personal access token for the iOS Shortcut. The plain-text token is only shown once.
     */
    public function storeToken(Request $request): RedirectResponse
    {
        $validated = $request->validate(['name' => ['required', 'string', 'max:60']], attributes: ['name' => 'nombre']);

        $token = $request->user()->createToken($validated['name'], [self::SHORTCUT_ABILITY]);

        Inertia::flash('plainTextToken', $token->plainTextToken);

        return back();
    }

    public function destroyToken(Request $request, int $token): RedirectResponse
    {
        $request->user()->tokens()->whereKey($token)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Token revocado.']);

        return back();
    }
}
