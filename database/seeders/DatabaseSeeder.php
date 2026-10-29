<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * The free-exercise-db catalog is imported separately with `php artisan exercises:import`.
     */
    public function run(): void
    {
        $this->call([
            MuscleGroupSeeder::class,
            HyroxExerciseSeeder::class,
            MotivationalQuoteSeeder::class,
        ]);

        if (app()->isLocal()) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
