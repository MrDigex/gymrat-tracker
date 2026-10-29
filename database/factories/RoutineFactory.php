<?php

namespace Database\Factories;

use App\Models\Routine;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Routine>
 */
class RoutineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Pecho y tríceps', 'Espalda y bíceps', 'Pierna', 'Full body', 'Torso']),
            'description' => fake()->optional()->sentence(),
            'share_token' => null,
            'is_public' => false,
        ];
    }

    public function shared(): static
    {
        return $this->state(fn (array $attributes) => [
            'share_token' => Str::lower((string) Str::ulid()),
            'is_public' => true,
        ]);
    }
}
