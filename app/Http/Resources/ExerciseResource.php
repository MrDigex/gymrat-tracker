<?php

namespace App\Http\Resources;

use App\Enums\ExerciseCategory;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Support\ExerciseTranslations;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Exercise
 */
class ExerciseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $bodyZone = $this->relationLoaded('muscleGroups') ? $this->bodyZone() : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'equipment' => $this->equipment,
            'equipment_label' => ExerciseTranslations::EQUIPMENT[$this->equipment] ?? $this->equipment,
            'level_label' => ExerciseTranslations::LEVELS[$this->level] ?? $this->level,
            'mechanic_label' => ExerciseTranslations::MECHANICS[$this->mechanic] ?? $this->mechanic,
            'tracking_type' => $this->tracking_type->value,
            'image_url' => $this->image_url,
            'image_alt_url' => $this->image_alt_url,
            'is_custom' => $this->isCustom(),
            'is_hyrox' => $this->category === ExerciseCategory::Hyrox,
            'can_edit' => $request->user()?->can('update', $this->resource) ?? false,
            'body_zone' => $bodyZone?->value,
            'body_zone_label' => $bodyZone?->label(),
            'primary_muscles' => $this->whenLoaded('muscleGroups', fn () => $this->muscleGroups
                ->filter(fn (MuscleGroup $muscle) => $muscle->pivot->is_primary)
                ->map(fn (MuscleGroup $muscle) => ['id' => $muscle->id, 'name' => $muscle->name, 'body_zone' => $muscle->body_zone->value])
                ->values()),
            'secondary_muscles' => $this->whenLoaded('muscleGroups', fn () => $this->muscleGroups
                ->reject(fn (MuscleGroup $muscle) => $muscle->pivot->is_primary)
                ->map(fn (MuscleGroup $muscle) => ['id' => $muscle->id, 'name' => $muscle->name, 'body_zone' => $muscle->body_zone->value])
                ->values()),
            'instructions' => $this->when($request->routeIs('exercises.show', 'exercises.edit'), fn () => $this->instructions ?? []),
        ];
    }
}
