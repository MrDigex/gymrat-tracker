<?php

namespace Database\Seeders;

use App\Models\MuscleGroup;
use App\Support\ExerciseTranslations;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MuscleGroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (ExerciseTranslations::MUSCLES as $key => $muscle) {
            MuscleGroup::query()->updateOrCreate(
                ['slug' => Str::slug($key)],
                ['name' => $muscle['name'], 'body_zone' => $muscle['zone']],
            );
        }
    }
}
