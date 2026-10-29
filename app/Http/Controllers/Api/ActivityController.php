<?php

namespace App\Http\Controllers\Api;

use App\Actions\SaveActivity;
use App\Enums\ActivitySource;
use App\Enums\ActivityType;
use App\Http\Controllers\Controller;
use App\Http\Controllers\IntegrationController;
use App\Http\Resources\ActivityResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Endpoint used by the iOS Shortcut to push Apple Watch workouts.
 */
class ActivityController extends Controller
{
    public function store(Request $request, SaveActivity $saveActivity): JsonResponse
    {
        abort_unless($request->user()->tokenCan(IntegrationController::SHORTCUT_ABILITY), 403);

        $validated = $request->validate([
            'started_at' => ['required', 'date'],
            'distance_m' => ['required_without:distance_km', 'nullable', 'numeric', 'min:1'],
            'distance_km' => ['required_without:distance_m', 'nullable', 'numeric', 'min:0.001'],
            'duration_seconds' => ['required_without:duration_minutes', 'nullable', 'numeric', 'min:1'],
            'duration_minutes' => ['required_without:duration_seconds', 'nullable', 'numeric', 'min:0.01'],
            'type' => ['nullable', Rule::enum(ActivityType::class)],
            'name' => ['nullable', 'string', 'max:120'],
            'avg_hr' => ['nullable', 'numeric', 'min:30', 'max:250'],
            'max_hr' => ['nullable', 'numeric', 'min:30', 'max:250'],
            'calories' => ['nullable', 'numeric', 'min:0'],
            'elevation_gain_m' => ['nullable', 'numeric', 'min:0'],
            'external_id' => ['nullable', 'string', 'max:120'],
        ]);

        $startedAt = Carbon::parse($validated['started_at']);
        $round = fn (string $key) => isset($validated[$key]) ? (int) round((float) $validated[$key]) : null;

        $activity = $saveActivity->handle($request->user(), [
            'type' => $validated['type'] ?? ActivityType::Run,
            'name' => $validated['name'] ?? 'Carrera con Apple Watch',
            'started_at' => $startedAt,
            'distance_m' => isset($validated['distance_m']) ? $round('distance_m') : (int) round($validated['distance_km'] * 1000),
            'duration_seconds' => isset($validated['duration_seconds']) ? $round('duration_seconds') : (int) round($validated['duration_minutes'] * 60),
            'avg_hr' => $round('avg_hr'),
            'max_hr' => $round('max_hr'),
            'calories' => $round('calories'),
            'elevation_gain_m' => $round('elevation_gain_m'),
            'source' => ActivitySource::Shortcut,
            'external_id' => $validated['external_id'] ?? (string) $startedAt->timestamp,
        ]);

        return ActivityResource::make($activity)
            ->response()
            ->setStatusCode($activity->wasRecentlyCreated ? 201 : 200);
    }
}
