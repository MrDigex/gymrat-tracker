<?php

namespace Database\Factories;

use App\Enums\ActivitySource;
use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $distance = fake()->randomElement([5000, 8000, 10000, 12000, 21097]);
        $paceSecondsPerKm = fake()->numberBetween(270, 390);

        return [
            'user_id' => User::factory(),
            'type' => ActivityType::Run,
            'name' => 'Carrera matutina',
            'started_at' => fake()->dateTimeBetween('-2 months'),
            'distance_m' => $distance,
            'duration_seconds' => (int) round($distance / 1000 * $paceSecondsPerKm),
            'moving_seconds' => null,
            'elevation_gain_m' => fake()->numberBetween(0, 150),
            'avg_hr' => fake()->numberBetween(135, 170),
            'max_hr' => fake()->numberBetween(170, 190),
            'calories' => fake()->numberBetween(300, 1200),
            'source' => ActivitySource::Manual,
            'external_id' => null,
        ];
    }
}
