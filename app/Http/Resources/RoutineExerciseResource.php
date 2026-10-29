<?php

namespace App\Http\Resources;

use App\Models\RoutineExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin RoutineExercise
 */
class RoutineExerciseResource extends JsonResource
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
            'position' => $this->position,
            'target_sets' => $this->target_sets,
            'target_reps_min' => $this->target_reps_min,
            'target_reps_max' => $this->target_reps_max,
            'target_weight_kg' => $this->target_weight_kg,
            'target_seconds' => $this->target_seconds,
            'target_distance_m' => $this->target_distance_m,
            'rest_seconds' => $this->rest_seconds,
            'notes' => $this->notes,
            'exercise' => ExerciseResource::make($this->whenLoaded('exercise')),
        ];
    }
}
