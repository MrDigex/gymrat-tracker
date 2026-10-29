<?php

namespace App\Http\Controllers;

use App\Enums\ActivitySource;
use App\Jobs\ImportStravaActivity;
use App\Models\Activity;
use App\Models\StravaAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Receives Strava push subscription events.
 *
 * @see https://developers.strava.com/docs/webhooks/
 */
class StravaWebhookController extends Controller
{
    /**
     * Subscription validation handshake.
     */
    public function verify(Request $request): JsonResponse
    {
        $verifyToken = (string) config('services.strava.webhook_verify_token');

        abort_unless(
            $request->query('hub_mode') === 'subscribe' && $verifyToken !== '' && hash_equals($verifyToken, (string) $request->query('hub_verify_token')),
            403,
        );

        return response()->json(['hub.challenge' => $request->query('hub_challenge')]);
    }

    public function handle(Request $request): JsonResponse
    {
        $account = StravaAccount::query()->where('athlete_id', $request->integer('owner_id'))->first();

        if (! $account) {
            return response()->json(['ok' => true]);
        }

        $objectType = $request->input('object_type');
        $aspectType = $request->input('aspect_type');

        if ($objectType === 'athlete' && $request->input('updates.authorized') === 'false') {
            $account->delete();
        } elseif ($objectType === 'activity' && in_array($aspectType, ['create', 'update'], true)) {
            ImportStravaActivity::dispatch($account, $request->integer('object_id'));
        } elseif ($objectType === 'activity' && $aspectType === 'delete') {
            Activity::query()
                ->whereBelongsTo($account->user)
                ->where('source', ActivitySource::Strava)
                ->where('external_id', (string) $request->input('object_id'))
                ->delete();
        }

        return response()->json(['ok' => true]);
    }
}
