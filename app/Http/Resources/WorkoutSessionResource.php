<?php

namespace App\Http\Resources;

use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WorkoutSession
 */
class WorkoutSessionResource extends JsonResource
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
            'name' => $this->name ?? $this->routine->name ?? 'Entrenamiento libre',
            'routine_id' => $this->routine_id,
            'started_at' => $this->started_at->toIso8601String(),
            'finished_at' => $this->finished_at?->toIso8601String(),
            'duration_minutes' => $this->finished_at ? (int) $this->started_at->diffInMinutes($this->finished_at) : null,
            'notes' => $this->notes,
            'share_url' => $this->share_token ? route('share.workout', $this->share_token) : null,
            'sets_count' => $this->whenCounted('sets'),
            'exercises_count' => $this->whenLoaded('sets', fn () => $this->sets->pluck('exercise_id')->unique()->count()),
            'volume_kg' => $this->whenLoaded('sets', fn () => round($this->sets->where('is_warmup', false)
                ->sum(fn (WorkoutSet $set) => ($set->weight_kg ?? 0) * ($set->reps ?? 0)), 1)),
            'sets' => WorkoutSetResource::collection($this->whenLoaded('sets')),
        ];
    }
}
