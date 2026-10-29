<?php

namespace App\Actions;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creates or updates an activity together with its splits, deduplicating imported activities by external id.
 */
class SaveActivity
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<array{label: string, distance_m?: int|null, duration_seconds: int}>|null  $splits
     */
    public function handle(User $user, array $attributes, ?array $splits = null, ?Activity $activity = null): Activity
    {
        return DB::transaction(function () use ($user, $attributes, $splits, $activity): Activity {
            if ($activity === null && isset($attributes['external_id'], $attributes['source'])) {
                $activity = $user->activities()
                    ->where('source', $attributes['source'])
                    ->where('external_id', $attributes['external_id'])
                    ->first();
            }

            $activity ??= $user->activities()->make();
            $activity->fill($attributes)->save();

            if ($splits !== null) {
                $activity->splits()->delete();
                $activity->splits()->createMany(collect($splits)->values()->map(fn (array $split, int $index) => [
                    'position' => $index + 1,
                    'label' => $split['label'],
                    'distance_m' => $split['distance_m'] ?? null,
                    'duration_seconds' => $split['duration_seconds'],
                ])->all());
            }

            return $activity;
        });
    }
}
