<?php

namespace Database\Seeders;

use App\Actions\SaveActivity;
use App\Enums\ActivitySource;
use App\Enums\ActivityType;
use App\Enums\ExerciseSource;
use App\Enums\TrackingType;
use App\Models\Exercise;
use App\Models\Routine;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Local demo account with eight weeks of progressive training and runs.
 */
class DemoDataSeeder extends Seeder
{
    /**
     * Routine name => [catalog source id, sets, reps min, reps max, starting weight kg, weekly increase kg].
     *
     * @var array<string, list<array{0: string, 1: int, 2: int, 3: int, 4: float|null, 5: float}>>
     */
    private const array ROUTINES = [
        'Torso' => [
            ['Barbell_Bench_Press_-_Medium_Grip', 4, 6, 10, 60, 2.5],
            ['Wide-Grip_Lat_Pulldown', 3, 8, 12, 50, 2.5],
            ['Standing_Military_Press', 3, 6, 10, 35, 1.25],
            ['Seated_Cable_Rows', 3, 8, 12, 45, 2.5],
            ['Dumbbell_Bicep_Curl', 3, 10, 12, 12, 0.5],
            ['Triceps_Pushdown', 3, 10, 12, 25, 1],
        ],
        'Pierna' => [
            ['Barbell_Squat', 4, 5, 8, 80, 2.5],
            ['Romanian_Deadlift', 3, 8, 10, 70, 2.5],
            ['Leg_Press', 3, 10, 12, 120, 5],
            ['Lying_Leg_Curls', 3, 10, 12, 35, 1],
            ['Standing_Calf_Raises', 3, 12, 15, 60, 2.5],
            ['Plank', 3, 1, 1, null, 0],
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::query()->firstOrCreate(
            ['email' => 'demo@gymrat.test'],
            ['name' => 'Demo GymRat', 'password' => 'password', 'email_verified_at' => now()],
        );

        if ($user->routines()->exists()) {
            return;
        }

        foreach (self::ROUTINES as $name => $items) {
            $routine = $user->routines()->create([
                'name' => $name,
                'description' => $name === 'Torso' ? 'Pecho, espalda, hombro y brazos.' : 'Cuádriceps, isquios, glúteos y core.',
            ]);

            foreach ($items as $position => [$sourceId, $sets, $repsMin, $repsMax, $weight]) {
                $exercise = $this->exercise($sourceId);

                $routine->routineExercises()->create([
                    'exercise_id' => $exercise->id,
                    'position' => $position + 1,
                    'target_sets' => $sets,
                    'target_reps_min' => $exercise->tracking_type === TrackingType::Time ? null : $repsMin,
                    'target_reps_max' => $exercise->tracking_type === TrackingType::Time ? null : $repsMax,
                    'target_weight_kg' => $weight,
                    'target_seconds' => $exercise->tracking_type === TrackingType::Time ? 45 : null,
                    'rest_seconds' => $weight && $weight >= 60 ? 150 : 90,
                ]);
            }

            $this->logHistory($user, $routine, $items);
        }

        $this->seedRuns($user);
    }

    private function exercise(string $sourceId): Exercise
    {
        return Exercise::query()->where('source', ExerciseSource::FreeExerciseDb)->where('source_id', $sourceId)->first()
            ?? Exercise::factory()->create([
                'name' => str_replace('_', ' ', $sourceId),
                'source_id' => $sourceId,
                'tracking_type' => $sourceId === 'Plank' ? TrackingType::Time : TrackingType::WeightReps,
            ]);
    }

    /**
     * Two sessions per routine per week for eight weeks, with double progression.
     *
     * @param  list<array{0: string, 1: int, 2: int, 3: int, 4: float|null, 5: float}>  $items
     */
    private function logHistory(User $user, Routine $routine, array $items): void
    {
        $offsetDays = $routine->name === 'Torso' ? 0 : 1;

        for ($week = 8; $week >= 1; $week--) {
            foreach ([0, 3] as $day) {
                $startedAt = Carbon::now()->subWeeks($week)->startOfWeek()->addDays($day + $offsetDays)->setTime(18, 30);
                $session = $user->workoutSessions()->create([
                    'routine_id' => $routine->id,
                    'name' => $routine->name,
                    'started_at' => $startedAt,
                    'finished_at' => $startedAt->copy()->addMinutes(rand(50, 75)),
                ]);
                $progress = 8 - $week;

                foreach ($items as [$sourceId, $sets, $repsMin, $repsMax, $weight, $increase]) {
                    $exercise = $this->exercise($sourceId);

                    for ($set = 1; $set <= $sets; $set++) {
                        $session->sets()->create([
                            'exercise_id' => $exercise->id,
                            'set_number' => $set,
                            'reps' => $weight ? min($repsMax, $repsMin + ($progress % 2) * 2 + intdiv($day, 3)) - ($set === $sets ? 1 : 0) : null,
                            'weight_kg' => $weight ? $weight + $increase * intdiv($progress, 2) : null,
                            'duration_seconds' => $weight ? null : 40 + $progress * 5,
                        ]);
                    }
                }
            }
        }
    }

    private function seedRuns(User $user): void
    {
        $saveActivity = app(SaveActivity::class);

        for ($week = 8; $week >= 0; $week--) {
            foreach ([[5000, 330], [10000, 345]] as $index => [$distance, $pace]) {
                $pace -= (8 - $week) * 2;
                $startedAt = Carbon::now()->subWeeks($week)->startOfWeek()->addDays(2 + $index * 3)->setTime(7, 15);

                if ($startedAt->isFuture()) {
                    continue;
                }

                $saveActivity->handle($user, [
                    'type' => ActivityType::Run,
                    'name' => $distance === 5000 ? 'Rodaje 5K' : 'Tirada 10K',
                    'started_at' => $startedAt,
                    'distance_m' => $distance,
                    'duration_seconds' => (int) ($distance / 1000 * $pace),
                    'avg_hr' => rand(145, 160),
                    'max_hr' => rand(170, 185),
                    'elevation_gain_m' => rand(20, 80),
                    'calories' => (int) ($distance / 1000 * 70),
                    'source' => ActivitySource::Manual,
                ], array_map(fn (int $km) => [
                    'label' => 'Km '.$km,
                    'distance_m' => 1000,
                    'duration_seconds' => $pace + rand(-8, 8),
                ], range(1, $distance / 1000)));
            }
        }

        $hyroxSplits = array_values(collect(HyroxExerciseSeeder::STATIONS)
            ->reject(fn (array $station) => $station['id'] === 'hyrox-run-1km')
            ->values()
            ->flatMap(fn (array $station, int $index) => [
                ['label' => 'Carrera '.($index + 1), 'distance_m' => 1000, 'duration_seconds' => rand(290, 340)],
                ['label' => $station['name'], 'distance_m' => $station['distance_m'], 'duration_seconds' => rand(180, 420)],
            ])
            ->all());

        $saveActivity->handle($user, [
            'type' => ActivityType::Hyrox,
            'name' => 'Hyrox Madrid',
            'started_at' => Carbon::now()->subWeeks(3)->startOfWeek()->addDays(5)->setTime(10, 0),
            'distance_m' => 8000,
            'duration_seconds' => array_sum(array_column($hyroxSplits, 'duration_seconds')),
            'avg_hr' => 168,
            'max_hr' => 189,
            'source' => ActivitySource::Manual,
        ], $hyroxSplits);
    }
}
