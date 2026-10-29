<?php

namespace Database\Seeders;

use App\Enums\ExerciseCategory;
use App\Enums\ExerciseSource;
use App\Enums\TrackingType;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class HyroxExerciseSeeder extends Seeder
{
    /**
     * The eight Hyrox stations plus the 1 km run between them, in race order.
     *
     * @var list<array{id: string, name: string, equipment: string, tracking: TrackingType, distance_m: int|null, reps: int|null, primary: list<string>, secondary: list<string>, instructions: list<string>}>
     */
    public const array STATIONS = [
        [
            'id' => 'hyrox-run-1km', 'name' => 'Carrera 1 km (Hyrox)', 'equipment' => 'body only', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 1000, 'reps' => null,
            'primary' => ['quadriceps', 'calves'], 'secondary' => ['hamstrings', 'glutes'],
            'instructions' => ['Corre 1 km entre cada estación a un ritmo que puedas sostener durante toda la prueba.', 'Mantén una cadencia alta y los hombros relajados.', 'Usa la carrera para recuperar el pulso antes de la siguiente estación.'],
        ],
        [
            'id' => 'hyrox-skierg', 'name' => 'SkiErg 1000 m', 'equipment' => 'ski erg', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 1000, 'reps' => null,
            'primary' => ['lats', 'triceps'], 'secondary' => ['abdominals', 'shoulders'],
            'instructions' => ['Colócate frente al SkiErg con los pies a la anchura de las caderas y agarra ambas asas por encima de la cabeza.', 'Tira hacia abajo con los brazos extendidos flexionando la cadera y contrayendo el abdomen.', 'Vuelve a la posición inicial de forma controlada y repite hasta completar 1000 m.'],
        ],
        [
            'id' => 'hyrox-sled-push', 'name' => 'Sled Push 50 m', 'equipment' => 'sled', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 50, 'reps' => null,
            'primary' => ['quadriceps', 'glutes'], 'secondary' => ['calves', 'shoulders', 'triceps'],
            'instructions' => ['Agarra los postes del trineo con los brazos extendidos o semiflexionados.', 'Inclina el torso hacia delante manteniendo la espalda neutra.', 'Empuja con pasos cortos y potentes impulsándote con la parte delantera del pie hasta completar 4 × 12,5 m.'],
        ],
        [
            'id' => 'hyrox-sled-pull', 'name' => 'Sled Pull 50 m', 'equipment' => 'sled', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 50, 'reps' => null,
            'primary' => ['lats', 'middle back'], 'secondary' => ['hamstrings', 'biceps', 'forearms'],
            'instructions' => ['Colócate detrás de la línea con la cuerda del trineo en las manos.', 'Tira de la cuerda mano sobre mano usando la espalda y las piernas, con una base estable.', 'Recoge la cuerda detrás de ti y repite hasta arrastrar el trineo 4 × 12,5 m.'],
        ],
        [
            'id' => 'hyrox-burpee-broad-jump', 'name' => 'Burpee Broad Jumps 80 m', 'equipment' => 'body only', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 80, 'reps' => null,
            'primary' => ['quadriceps', 'chest'], 'secondary' => ['glutes', 'triceps', 'shoulders'],
            'instructions' => ['Baja a una posición de flexión con el pecho tocando el suelo.', 'Lleva los pies hacia las manos y salta hacia delante con ambos pies a la vez.', 'Aterriza con suavidad y repite hasta cubrir 80 m.'],
        ],
        [
            'id' => 'hyrox-rowing', 'name' => 'Remo 1000 m', 'equipment' => 'rower', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 1000, 'reps' => null,
            'primary' => ['lats', 'middle back'], 'secondary' => ['quadriceps', 'biceps', 'hamstrings'],
            'instructions' => ['Siéntate en el remoergómetro con los pies sujetos y agarra el maneral.', 'Empuja primero con las piernas, luego inclina el torso y finalmente tira con los brazos hacia el abdomen.', 'Regresa en orden inverso: brazos, torso y piernas. Completa 1000 m.'],
        ],
        [
            'id' => 'hyrox-farmers-carry', 'name' => 'Farmers Carry 200 m', 'equipment' => 'kettlebells', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 200, 'reps' => null,
            'primary' => ['forearms', 'traps'], 'secondary' => ['abdominals', 'quadriceps', 'glutes'],
            'instructions' => ['Levanta dos kettlebells desde el suelo con la espalda neutra.', 'Camina con pasos rápidos y cortos, hombros atrás y abdomen firme.', 'Si necesitas soltar, deja las kettlebells en el suelo de forma controlada y continúa hasta 200 m.'],
        ],
        [
            'id' => 'hyrox-sandbag-lunges', 'name' => 'Sandbag Lunges 100 m', 'equipment' => 'sandbag', 'tracking' => TrackingType::DistanceTime, 'distance_m' => 100, 'reps' => null,
            'primary' => ['quadriceps', 'glutes'], 'secondary' => ['hamstrings', 'abdominals'],
            'instructions' => ['Coloca el saco de arena sobre los hombros, detrás del cuello.', 'Da un paso largo y baja hasta que la rodilla trasera toque el suelo.', 'Empuja con la pierna delantera para avanzar y alterna piernas hasta completar 100 m.'],
        ],
        [
            'id' => 'hyrox-wall-balls', 'name' => 'Wall Balls (100 repeticiones)', 'equipment' => 'wall ball', 'tracking' => TrackingType::Reps, 'distance_m' => null, 'reps' => 100,
            'primary' => ['quadriceps', 'shoulders'], 'secondary' => ['glutes', 'triceps', 'abdominals'],
            'instructions' => ['Sujeta el balón a la altura del pecho frente a la diana.', 'Haz una sentadilla profunda manteniendo el pecho erguido.', 'Al subir, lanza el balón a la diana usando el impulso de las piernas y recíbelo para encadenar la siguiente repetición.'],
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $muscleGroupIds = MuscleGroup::query()->pluck('id', 'slug');

        foreach (self::STATIONS as $station) {
            $exercise = Exercise::query()->updateOrCreate(
                ['source' => ExerciseSource::Hyrox, 'source_id' => $station['id']],
                [
                    'name' => $station['name'],
                    'slug' => $station['id'],
                    'instructions' => $station['instructions'],
                    'category' => ExerciseCategory::Hyrox,
                    'equipment' => $station['equipment'],
                    'level' => 'intermediate',
                    'mechanic' => 'compound',
                    'tracking_type' => $station['tracking'],
                    'image_path' => '/images/hyrox/'.$station['id'].'.svg',
                ],
            );

            $primary = collect($station['primary'])->mapWithKeys(fn (string $muscle) => [$muscleGroupIds[Str::slug($muscle)] => ['is_primary' => true]]);
            $secondary = collect($station['secondary'])->mapWithKeys(fn (string $muscle) => [$muscleGroupIds[Str::slug($muscle)] => ['is_primary' => false]]);

            $exercise->muscleGroups()->sync($primary->union($secondary)->all());
        }
    }

    /**
     * Default race distance for a Hyrox station, used to prefill routine targets.
     */
    public static function defaultDistanceFor(?string $sourceId): ?int
    {
        return collect(self::STATIONS)->firstWhere('id', $sourceId)['distance_m'] ?? null;
    }
}
