<?php

namespace Database\Factories;

use App\Models\StravaAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<StravaAccount>
 */
class StravaAccountFactory extends Factory
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
            'athlete_id' => fake()->unique()->numberBetween(1000, 99999999),
            'access_token' => Str::random(40),
            'refresh_token' => Str::random(40),
            'expires_at' => now()->addHours(6),
            'scopes' => 'read,activity:read_all',
        ];
    }
}
