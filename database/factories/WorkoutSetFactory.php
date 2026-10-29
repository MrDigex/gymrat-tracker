<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkoutSet>
 */
class WorkoutSetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workout_session_id' => WorkoutSession::factory(),
            'exercise_id' => Exercise::factory(),
            'set_number' => 1,
            'reps' => fake()->numberBetween(6, 12),
            'weight_kg' => fake()->randomElement([20, 30, 40, 50, 60]),
            'duration_seconds' => null,
            'distance_m' => null,
            'rpe' => null,
            'is_warmup' => false,
        ];
    }

    public function warmup(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_warmup' => true,
        ]);
    }
}
