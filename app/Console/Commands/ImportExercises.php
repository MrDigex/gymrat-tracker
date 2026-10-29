<?php

namespace App\Console\Commands;

use App\Enums\ExerciseSource;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Support\ExerciseTranslations;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @phpstan-type ExerciseData array{id: string, name: string, force: string|null, level: string, mechanic: string|null, equipment: string|null, primaryMuscles: list<string>, secondaryMuscles: list<string>, instructions: list<string>, category: string, images?: list<string>}
 */
#[Signature('exercises:import {--skip-images : Do not download exercise images} {--source= : Local path to exercises.json instead of downloading it}')]
#[Description('Import the free-exercise-db catalog with Spanish translations and images')]
class ImportExercises extends Command
{
    public const string DATASET_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

    public const string IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $exercises = $this->loadDataset();

        if ($exercises === null) {
            $this->error('No se pudo descargar el catálogo de ejercicios.');

            return self::FAILURE;
        }

        $translations = $this->loadTranslations();
        $muscleGroupIds = MuscleGroup::query()->pluck('id', 'slug');

        if ($muscleGroupIds->isEmpty()) {
            $this->error('Ejecuta primero el MuscleGroupSeeder.');

            return self::FAILURE;
        }

        $this->withProgressBar($exercises, function (array $data) use ($translations, $muscleGroupIds): void {
            $this->importExercise($data, $translations[$data['id']] ?? null, $muscleGroupIds->all());
        });

        $this->newLine();
        $this->info(sprintf('Importados %d ejercicios (%d traducidos).', count($exercises), count(array_intersect_key($translations, array_flip(array_column($exercises, 'id'))))));

        return self::SUCCESS;
    }

    /**
     * @return list<ExerciseData>|null
     */
    private function loadDataset(): ?array
    {
        if ($path = $this->option('source')) {
            return json_decode(File::get($path), true);
        }

        $response = Http::timeout(60)->get(self::DATASET_URL);

        return $response->successful() ? $response->json() : null;
    }

    /**
     * @return array<string, array{name: string, instructions: list<string>}>
     */
    private function loadTranslations(): array
    {
        return collect(File::glob(database_path('data/exercises_es/*.json')))
            ->flatMap(
                /** @return array<string, array{name: string, instructions: list<string>}> */
                fn (string $file): array => json_decode(File::get($file), true) ?? []
            )
            ->all();
    }

    /**
     * @param  ExerciseData  $data
     * @param  array{name: string, instructions: list<string>}|null  $translation
     * @param  array<string, int>  $muscleGroupIds
     */
    private function importExercise(array $data, ?array $translation, array $muscleGroupIds): void
    {
        $category = ExerciseTranslations::category($data['category']);
        $images = $this->option('skip-images') ? [] : $this->downloadImages($data['id'], $data['images'] ?? []);
        $name = $translation['name'] ?? $data['name'];

        $exercise = Exercise::query()->updateOrCreate(
            ['source' => ExerciseSource::FreeExerciseDb, 'source_id' => $data['id']],
            [
                'name' => $name,
                'slug' => Str::slug($data['id']),
                'instructions' => array_values(array_filter($translation['instructions'] ?? $data['instructions'], fn (string $step) => trim($step) !== '')),
                'category' => $category,
                'equipment' => $data['equipment'],
                'level' => $data['level'],
                'mechanic' => $data['mechanic'],
                'tracking_type' => ExerciseTranslations::trackingType($category, $data['equipment'], $data['force']),
                ...($images === [] ? [] : ['image_path' => $images[0], 'image_alt_path' => $images[1] ?? null]),
            ],
        );

        $muscles = collect($data['primaryMuscles'])->mapWithKeys(fn (string $muscle) => [$muscle => true])
            ->union(collect($data['secondaryMuscles'])->mapWithKeys(fn (string $muscle) => [$muscle => false]));

        $exercise->muscleGroups()->sync(
            $muscles->mapWithKeys(fn (bool $isPrimary, string $muscle) => isset($muscleGroupIds[Str::slug($muscle)])
                ? [$muscleGroupIds[Str::slug($muscle)] => ['is_primary' => $isPrimary]]
                : [])->all(),
        );
    }

    /**
     * @param  list<string>  $images
     * @return list<string>
     */
    private function downloadImages(string $id, array $images): array
    {
        $disk = Storage::disk('public');

        return array_values(collect($images)->take(2)->map(function (string $image) use ($disk, $id): ?string {
            $path = 'exercises/'.Str::slug($id).'/'.basename($image);

            if (! $disk->exists($path)) {
                $response = Http::timeout(30)->retry(2, 500, throw: false)->get(self::IMAGE_BASE_URL.$image);

                if (! $response->successful()) {
                    return null;
                }

                $disk->put($path, $response->body());
            }

            return $path;
        })->filter()->all());
    }
}
