<?php

namespace Database\Factories;

use App\Enums\ExerciseCategory;
use App\Enums\ExerciseSource;
use App\Enums\TrackingType;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Exercise>
 */
class ExerciseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'user_id' => null,
            'name' => ucfirst($name),
            'slug' => Exercise::uniqueSlug($name),
            'instructions' => [fake()->sentence(), fake()->sentence()],
            'category' => ExerciseCategory::Strength,
            'equipment' => 'barbell',
            'level' => 'beginner',
            'mechanic' => 'compound',
            'tracking_type' => TrackingType::WeightReps,
            'image_path' => null,
            'image_alt_path' => null,
            'source' => ExerciseSource::FreeExerciseDb,
            'source_id' => fake()->unique()->slug(3),
        ];
    }

    public function custom(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
            'source' => ExerciseSource::User,
            'source_id' => null,
        ]);
    }

    public function tracking(TrackingType $trackingType): static
    {
        return $this->state(fn (array $attributes) => [
            'tracking_type' => $trackingType,
        ]);
    }

    public function hyrox(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => ExerciseCategory::Hyrox,
            'tracking_type' => TrackingType::DistanceTime,
            'source' => ExerciseSource::Hyrox,
        ]);
    }
}
