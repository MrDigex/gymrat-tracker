<?php

namespace Database\Factories;

use App\Enums\BodyZone;
use App\Models\MuscleGroup;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MuscleGroup>
 */
class MuscleGroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => Str::ucfirst($name),
            'slug' => Str::slug($name),
            'body_zone' => fake()->randomElement([BodyZone::Upper, BodyZone::Lower, BodyZone::Core]),
        ];
    }

    public function zone(BodyZone $zone): static
    {
        return $this->state(fn (array $attributes) => [
            'body_zone' => $zone,
        ]);
    }
}
