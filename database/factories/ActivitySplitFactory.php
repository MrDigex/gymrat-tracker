<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\ActivitySplit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivitySplit>
 */
class ActivitySplitFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'activity_id' => Activity::factory(),
            'position' => 1,
            'label' => 'Km 1',
            'distance_m' => 1000,
            'duration_seconds' => fake()->numberBetween(270, 390),
        ];
    }
}
