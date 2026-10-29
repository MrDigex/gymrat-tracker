<?php

namespace App\Services;

use App\Enums\ActivityType;
use App\Enums\BodyZone;
use App\Enums\ExerciseCategory;
use App\Models\Activity;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\Routine;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * Aggregated training statistics for a single user.
 */
class StatsService
{
    /**
     * @var array<string, int>
     */
    public const array RACE_DISTANCES = [
        '5K' => 5000,
        '10K' => 10000,
        'Media maratón' => 21097,
        'Maratón' => 42195,
    ];

    /**
     * @return array<string, mixed>
     */
    public function kpis(User $user): array
    {
        $startOfWeek = now()->startOfWeek();
        $startOfLastWeek = $startOfWeek->subWeek();
        $sets = $this->workingSets($user, $startOfLastWeek, now());
        $activities = $user->activities()->where('started_at', '>=', now()->subMonthNoOverflow()->startOfMonth())->get();

        $volume = fn (CarbonInterface $from, CarbonInterface $to) => round($sets
            ->filter(fn (WorkoutSet $set) => $set->workoutSession->started_at->between($from, $to))
            ->sum(fn (WorkoutSet $set) => $this->volume($set)), 1);

        $km = fn (CarbonInterface $from, CarbonInterface $to) => round($activities
            ->filter(fn (Activity $activity) => $activity->started_at->between($from, $to))
            ->sum('distance_m') / 1000, 1);

        return [
            'workouts_this_week' => $user->workoutSessions()->where('started_at', '>=', $startOfWeek)->count(),
            'workouts_last_week' => $user->workoutSessions()->whereBetween('started_at', [$startOfLastWeek, $startOfWeek])->count(),
            'volume_this_week' => $volume($startOfWeek, now()),
            'volume_last_week' => $volume($startOfLastWeek, $startOfWeek),
            'km_this_month' => $km(now()->startOfMonth(), now()),
            'km_last_month' => $km(now()->subMonthNoOverflow()->startOfMonth(), now()->startOfMonth()),
            'streak_days' => $this->streak($user),
        ];
    }

    /**
     * Consecutive days with a workout or a run, ending today (or yesterday if nothing logged yet today).
     */
    public function streak(User $user): int
    {
        $days = $this->trainingDays($user, now()->subYear())->flip();

        $day = CarbonImmutable::today();

        if (! $days->has($day->toDateString())) {
            $day = $day->subDay();
        }

        $streak = 0;

        while ($days->has($day->toDateString())) {
            $streak++;
            $day = $day->subDay();
        }

        return $streak;
    }

    /**
     * Dates (Y-m-d) of the last `$days` days with a workout or a run, oldest first.
     *
     * @return list<string>
     */
    public function activeDays(User $user, int $days = 7): array
    {
        return array_values($this->trainingDays($user, CarbonImmutable::today()->subDays($days - 1))->sort()->all());
    }

    /**
     * The routine to suggest next: the one with exercises that was done least recently (or never).
     */
    public function nextRoutine(User $user): ?Routine
    {
        return $user->routines()
            ->withCount('routineExercises')
            ->withMax('workoutSessions', 'started_at')
            ->get()
            ->filter(fn (Routine $routine) => $routine->routine_exercises_count > 0)
            ->sortBy(fn (Routine $routine) => $routine->workout_sessions_max_started_at ?? '')
            ->first();
    }

    /**
     * @return Collection<int, string>
     */
    private function trainingDays(User $user, CarbonInterface $from): Collection
    {
        return $user->workoutSessions()->where('started_at', '>=', $from)->pluck('started_at')
            ->concat($user->activities()->where('started_at', '>=', $from)->pluck('started_at'))
            ->map(fn (CarbonInterface $date) => $date->toDateString())
            ->unique()
            ->values();
    }

    /**
     * Weekly training volume (kg) split by body zone. Exercises whose main muscles span several zones split their volume evenly.
     *
     * @return list<array<string, mixed>>
     */
    public function weeklyVolumeByZone(User $user, CarbonInterface $from, CarbonInterface $to, ?BodyZone $zone = null): array
    {
        $weeks = $this->emptyWeeks($from, $to, collect(BodyZone::filterable())->mapWithKeys(fn (BodyZone $case) => [$case->value => 0])->all());

        foreach ($this->workingSets($user, $from, $to, $zone) as $set) {
            $week = $set->workoutSession->started_at->startOfWeek()->toDateString();
            $setZones = $set->exercise->primaryMuscleGroups->pluck('body_zone')->unique(fn (BodyZone $zone) => $zone->value);

            if ($setZones->isEmpty() || ! isset($weeks[$week])) {
                continue;
            }

            foreach ($setZones as $setZone) {
                $weeks[$week][$setZone->value] = round($weeks[$week][$setZone->value] + $this->volume($set) / $setZones->count(), 1);
            }
        }

        return array_values($weeks);
    }

    /**
     * Number of working sets and volume per primary muscle group.
     *
     * @return list<array{muscle: string, zone: string, sets: int, volume_kg: float}>
     */
    public function muscleDistribution(User $user, CarbonInterface $from, CarbonInterface $to, ?BodyZone $zone = null): array
    {
        return array_values($this->workingSets($user, $from, $to, $zone)
            ->flatMap(fn (WorkoutSet $set) => $set->exercise->primaryMuscleGroups->map(fn (MuscleGroup $muscle) => [$muscle, $set]))
            ->groupBy(fn (array $pair) => $pair[0]->id)
            ->map(fn (Collection $pairs) => [
                'muscle' => $pairs->first()[0]->name,
                'zone' => $pairs->first()[0]->body_zone->value,
                'sets' => $pairs->count(),
                'volume_kg' => round($pairs->sum(fn (array $pair) => $this->volume($pair[1])), 1),
            ])
            ->sortByDesc('sets')
            ->all());
    }

    /**
     * Best weight, reps and estimated 1RM per session for one exercise.
     *
     * @return list<array<string, mixed>>
     */
    public function exerciseProgress(User $user, Exercise $exercise, CarbonInterface $from, CarbonInterface $to): array
    {
        return array_values($this->workingSets($user, $from, $to)
            ->where('exercise_id', $exercise->id)
            ->groupBy('workout_session_id')
            ->map(fn (Collection $sets) => [
                'date' => $sets->first()->workoutSession->started_at->toDateString(),
                'max_weight_kg' => $sets->max('weight_kg'),
                'max_reps' => $sets->max('reps'),
                'total_reps' => $sets->sum('reps'),
                'volume_kg' => round($sets->sum(fn (WorkoutSet $set) => $this->volume($set)), 1),
                'estimated_1rm' => $sets->map(fn (WorkoutSet $set) => $set->estimatedOneRepMax())->max(),
                'best_duration_seconds' => $sets->max('duration_seconds'),
            ])
            ->sortBy('date')
            ->all());
    }

    /**
     * Exercises the user has logged, most frequent first, for the progress selector.
     *
     * @return list<array{id: int, name: string, sessions: int}>
     */
    public function loggedExercises(User $user): array
    {
        return array_values($this->workingSets($user, now()->subYears(5), now())
            ->groupBy('exercise_id')
            ->map(fn (Collection $sets) => [
                'id' => $sets->first()->exercise_id,
                'name' => $sets->first()->exercise->name,
                'sessions' => $sets->pluck('workout_session_id')->unique()->count(),
            ])
            ->sortByDesc('sessions')
            ->all());
    }

    /**
     * Heaviest weight and best estimated 1RM per exercise.
     *
     * @return list<array<string, mixed>>
     */
    public function personalRecords(User $user, int $limit = 10): array
    {
        return array_values($this->workingSets($user, now()->subYears(5), now())
            ->filter(fn (WorkoutSet $set) => $set->weight_kg > 0 && $set->reps > 0)
            ->groupBy('exercise_id')
            ->map(function (Collection $sets) {
                /** @var WorkoutSet $best */
                $best = $sets->sortByDesc(fn (WorkoutSet $set) => $set->estimatedOneRepMax())->first();

                return [
                    'exercise_id' => $best->exercise_id,
                    'exercise' => $best->exercise->name,
                    'weight_kg' => $best->weight_kg,
                    'reps' => $best->reps,
                    'estimated_1rm' => $best->estimatedOneRepMax(),
                    'max_weight_kg' => $sets->max('weight_kg'),
                    'date' => $best->workoutSession->started_at->toDateString(),
                ];
            })
            ->sortByDesc('date')
            ->take($limit)
            ->all());
    }

    /**
     * Best time per Hyrox station logged in workouts.
     *
     * @return list<array{exercise: string, distance_m: int|null, best_seconds: int, date: string}>
     */
    public function hyroxBests(User $user): array
    {
        return array_values($this->workingSets($user, now()->subYears(5), now())
            ->filter(fn (WorkoutSet $set) => $set->exercise->category === ExerciseCategory::Hyrox && $set->duration_seconds)
            ->groupBy('exercise_id')
            ->map(function (Collection $sets) {
                /** @var WorkoutSet $best */
                $best = $sets->sortBy('duration_seconds')->first();

                return [
                    'exercise' => $best->exercise->name,
                    'distance_m' => $best->distance_m,
                    'best_seconds' => $best->duration_seconds,
                    'date' => $best->workoutSession->started_at->toDateString(),
                ];
            })
            ->all());
    }

    /**
     * Weekly running distance and average pace.
     *
     * @return list<array{week: string, label: string, km: float, runs: int, pace_seconds_per_km: int|null}>
     */
    public function weeklyRunning(User $user, CarbonInterface $from, CarbonInterface $to): array
    {
        $weeks = $this->emptyWeeks($from, $to, ['km' => 0.0, 'runs' => 0, 'seconds' => 0, 'meters' => 0]);

        $this->runs($user)->whereBetween('started_at', [$from, $to])->get()
            ->each(function (Activity $activity) use (&$weeks) {
                $week = $activity->started_at->startOfWeek()->toDateString();

                if (! isset($weeks[$week])) {
                    return;
                }

                $weeks[$week]['km'] = round($weeks[$week]['km'] + $activity->distance_m / 1000, 2);
                $weeks[$week]['runs']++;
                $weeks[$week]['seconds'] += $activity->moving_seconds ?? $activity->duration_seconds;
                $weeks[$week]['meters'] += $activity->distance_m;
            });

        return array_values(array_map(fn (array $week) => [
            'week' => $week['week'],
            'label' => $week['label'],
            'km' => $week['km'],
            'runs' => $week['runs'],
            'pace_seconds_per_km' => $week['meters'] > 0 ? (int) round($week['seconds'] / ($week['meters'] / 1000)) : null,
        ], $weeks));
    }

    /**
     * Fastest activity for each classic race distance (within 2% under / 5% over the distance).
     *
     * @return list<array{label: string, distance_m: int, activity_id: int|null, duration_seconds: int|null, duration_label: string|null, pace_label: string|null, date: string|null}>
     */
    public function runningRecords(User $user): array
    {
        $runs = $this->runs($user)->get();

        return array_values(collect(self::RACE_DISTANCES)->map(function (int $distance, string $label) use ($runs) {
            /** @var Activity|null $best */
            $best = $runs
                ->filter(fn (Activity $activity) => $activity->distance_m >= $distance * 0.98 && $activity->distance_m <= $distance * 1.05)
                ->sortBy('pace_seconds_per_km')
                ->first();

            $duration = $best ? (int) round($best->pace_seconds_per_km * $distance / 1000) : null;

            return [
                'label' => $label,
                'distance_m' => $distance,
                'activity_id' => $best?->id,
                'duration_seconds' => $duration,
                'duration_label' => $duration ? Activity::formatDuration($duration) : null,
                'pace_label' => Activity::formatPace($best?->pace_seconds_per_km),
                'date' => $best?->started_at->toDateString(),
            ];
        })->all());
    }

    /**
     * The classic-distance record this activity holds, if any.
     *
     * @return array{label: string, distance_m: int, activity_id: int|null, duration_seconds: int|null, duration_label: string|null, pace_label: string|null, date: string|null}|null
     */
    public function runningRecordFor(Activity $activity): ?array
    {
        return collect($this->runningRecords($activity->user))->firstWhere('activity_id', $activity->id);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recentWorkouts(User $user, int $limit = 5): array
    {
        return array_values($user->workoutSessions()
            ->with(['routine:id,name', 'sets'])
            ->latest('started_at')
            ->limit($limit)
            ->get()
            ->map(fn (WorkoutSession $session) => [
                'id' => $session->id,
                'name' => $session->name ?? $session->routine->name ?? 'Entrenamiento libre',
                'started_at' => $session->started_at->toIso8601String(),
                'sets' => $session->sets->count(),
                'duration_minutes' => $session->finished_at ? (int) $session->started_at->diffInMinutes($session->finished_at) : null,
                'volume_kg' => round($session->sets->where('is_warmup', false)->sum(fn (WorkoutSet $set) => $this->volume($set)), 1),
            ])
            ->all());
    }

    /**
     * @return Collection<int, WorkoutSet>
     */
    private function workingSets(User $user, CarbonInterface $from, CarbonInterface $to, ?BodyZone $zone = null): Collection
    {
        return WorkoutSet::query()
            ->where('is_warmup', false)
            ->whereHas('workoutSession', fn (Builder $query) => $query->whereBelongsTo($user)->whereBetween('started_at', [$from, $to]))
            ->when($zone, fn (Builder $query, BodyZone $zone) => $query->whereHas(
                'exercise', fn (Builder $query) => $query->inBodyZone($zone)
            ))
            ->with(['workoutSession:id,started_at', 'exercise.primaryMuscleGroups'])
            ->get();
    }

    /**
     * @return HasMany<Activity, User>
     */
    private function runs(User $user): HasMany
    {
        return $user->activities()->whereIn('type', [ActivityType::Run, ActivityType::TrailRun, ActivityType::Treadmill]);
    }

    private function volume(WorkoutSet $set): float
    {
        return ($set->weight_kg ?? 0) * ($set->reps ?? 0);
    }

    /**
     * @param  array<string, mixed>  $defaults
     * @return array<string, array<string, mixed>>
     */
    private function emptyWeeks(CarbonInterface $from, CarbonInterface $to, array $defaults): array
    {
        $weeks = [];

        for ($week = CarbonImmutable::instance($from)->startOfWeek(); $week->lte($to); $week = $week->addWeek()) {
            $weeks[$week->toDateString()] = [
                'week' => $week->toDateString(),
                'label' => $week->settings(['locale' => 'es'])->isoFormat('D MMM'),
                ...$defaults,
            ];
        }

        return $weeks;
    }
}
