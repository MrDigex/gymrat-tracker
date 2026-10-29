<?php

namespace App\Http\Resources;

use App\Models\Activity;
use App\Models\ActivitySplit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Activity
 */
class ActivityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'name' => $this->name,
            'started_at' => $this->started_at->toIso8601String(),
            'distance_m' => $this->distance_m,
            'distance_km' => round($this->distance_m / 1000, 2),
            'duration_seconds' => $this->duration_seconds,
            'duration_label' => Activity::formatDuration($this->duration_seconds),
            'moving_seconds' => $this->moving_seconds,
            'pace_seconds_per_km' => $this->pace_seconds_per_km,
            'pace_label' => Activity::formatPace($this->pace_seconds_per_km),
            'elevation_gain_m' => $this->elevation_gain_m,
            'avg_hr' => $this->avg_hr,
            'max_hr' => $this->max_hr,
            'calories' => $this->calories,
            'source' => $this->source->value,
            'source_label' => $this->source->label(),
            'share_url' => $this->share_token ? route('share.activity', $this->share_token) : null,
            'splits_count' => $this->whenCounted('splits'),
            'splits' => $this->whenLoaded('splits', fn () => $this->splits->map(fn (ActivitySplit $split) => [
                'id' => $split->id,
                'position' => $split->position,
                'label' => $split->label,
                'distance_m' => $split->distance_m,
                'duration_seconds' => $split->duration_seconds,
                'duration_label' => Activity::formatDuration($split->duration_seconds),
                'pace_seconds_per_km' => $split->distance_m ? (int) round($split->duration_seconds / ($split->distance_m / 1000)) : null,
            ])),
        ];
    }
}
