<?php

namespace Database\Factories;

use App\Models\MotivationalQuote;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MotivationalQuote>
 */
class MotivationalQuoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'text' => fake()->sentence(),
            'author' => fake()->optional()->name(),
        ];
    }
}
