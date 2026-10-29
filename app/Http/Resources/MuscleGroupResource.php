<?php

namespace App\Http\Resources;

use App\Models\MuscleGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MuscleGroup
 */
class MuscleGroupResource extends JsonResource
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
            'slug' => $this->slug,
            'body_zone' => $this->body_zone->value,
            'body_zone_label' => $this->body_zone->label(),
        ];
    }
}
