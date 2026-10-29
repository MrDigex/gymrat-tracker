<?php

namespace App\Services\Strava;

use App\Enums\ActivitySource;
use App\Enums\ActivityType;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * Maps Strava activity payloads to our activity attributes. Only running activities are imported.
 */
class StravaActivityMapper
{
    /**
     * @var list<string>
     */
    public const array RUNNING_SPORTS = ['Run', 'TrailRun', 'VirtualRun'];

    /**
     * @param  array<string, mixed>  $payload
     */
    public function isRun(array $payload): bool
    {
        return in_array($payload['sport_type'] ?? $payload['type'] ?? null, self::RUNNING_SPORTS, true);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function attributes(array $payload): array
    {
        $sport = $payload['sport_type'] ?? $payload['type'] ?? 'Run';

        return [
            'type' => match (true) {
                $sport === 'TrailRun' => ActivityType::TrailRun,
                $sport === 'VirtualRun' || ($payload['trainer'] ?? false) => ActivityType::Treadmill,
                default => ActivityType::Run,
            },
            'name' => $payload['name'] ?? 'Carrera',
            'started_at' => Carbon::parse($payload['start_date']),
            'distance_m' => (int) round($payload['distance'] ?? 0),
            'duration_seconds' => (int) ($payload['elapsed_time'] ?? $payload['moving_time'] ?? 0),
            'moving_seconds' => isset($payload['moving_time']) ? (int) $payload['moving_time'] : null,
            'elevation_gain_m' => isset($payload['total_elevation_gain']) ? (int) round($payload['total_elevation_gain']) : null,
            'avg_hr' => isset($payload['average_heartrate']) ? (int) round($payload['average_heartrate']) : null,
            'max_hr' => isset($payload['max_heartrate']) ? (int) round($payload['max_heartrate']) : null,
            'calories' => isset($payload['calories']) ? (int) round($payload['calories']) : null,
            'source' => ActivitySource::Strava,
            'external_id' => (string) $payload['id'],
            'raw' => collect($payload)->except(['map', 'segment_efforts', 'laps', 'splits_standard', 'best_efforts'])->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return list<array{label: string, distance_m: int, duration_seconds: int}>|null
     */
    public function splits(array $payload): ?array
    {
        if (! isset($payload['splits_metric'])) {
            return null;
        }

        return array_values(collect(Arr::array($payload, 'splits_metric'))->map(fn (array $split, int $index) => [
            'label' => 'Km '.($split['split'] ?? $index + 1),
            'distance_m' => (int) round($split['distance']),
            'duration_seconds' => (int) ($split['moving_time'] ?? $split['elapsed_time']),
        ])->filter(fn (array $split) => $split['distance_m'] > 0 && $split['duration_seconds'] > 0)->all());
    }
}
