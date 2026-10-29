<?php

namespace App\Http\Resources;

use App\Models\WorkoutSet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WorkoutSet
 */
class WorkoutSetResource extends JsonResource
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
            'exercise_id' => $this->exercise_id,
            'set_number' => $this->set_number,
            'reps' => $this->reps,
            'weight_kg' => $this->weight_kg,
            'duration_seconds' => $this->duration_seconds,
            'distance_m' => $this->distance_m,
            'rpe' => $this->rpe,
            'is_warmup' => $this->is_warmup,
        ];
    }
}
