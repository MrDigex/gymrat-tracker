<?php

namespace App\Http\Resources;

use App\Models\Routine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Date;

/**
 * @mixin Routine
 */
class RoutineResource extends JsonResource
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
            'name' => $this->name,
            'description' => $this->description,
            'is_public' => $this->is_public,
            'share_url' => $this->is_public && $this->share_token ? route('share.routine', $this->share_token) : null,
            'exercises_count' => $this->whenCounted('routineExercises'),
            'total_sets' => $this->whenLoaded('routineExercises', fn () => (int) $this->routineExercises->sum('target_sets')),
            'estimated_minutes' => $this->whenLoaded('routineExercises', fn () => $this->estimatedMinutes()),
            'last_performed_at' => $this->whenHas('workout_sessions_max_started_at', fn ($date) => $date ? Date::parse($date)->toIso8601String() : null),
            'exercises' => RoutineExerciseResource::collection($this->whenLoaded('routineExercises')),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
