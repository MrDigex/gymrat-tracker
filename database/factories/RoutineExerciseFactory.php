<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\Routine;
use App\Models\RoutineExercise;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RoutineExercise>
 */
class RoutineExerciseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'routine_id' => Routine::factory(),
            'exercise_id' => Exercise::factory(),
            'position' => 0,
            'target_sets' => 3,
            'target_reps_min' => 8,
            'target_reps_max' => 12,
            'target_weight_kg' => fake()->randomElement([20, 30, 40, 50, 60]),
            'rest_seconds' => 90,
        ];
    }
}
