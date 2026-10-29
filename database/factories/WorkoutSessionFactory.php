<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkoutSession>
 */
class WorkoutSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-2 months');

        return [
            'user_id' => User::factory(),
            'routine_id' => null,
            'name' => null,
            'started_at' => $startedAt,
            'finished_at' => (clone $startedAt)->modify('+1 hour'),
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'started_at' => now(),
            'finished_at' => null,
        ]);
    }
}
