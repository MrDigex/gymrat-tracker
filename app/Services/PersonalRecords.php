<?php

namespace App\Services;

use App\Enums\TrackingType;
use App\Models\Activity;
use App\Models\Exercise;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

/**
 * Detects the personal records beaten in a workout, compared with every earlier session of the same user.
 * Doing an exercise for the first time is not a record: there is nothing to beat yet.
 */
class PersonalRecords
{
    /**
     * @return list<array{exercise_id: int, exercise: string, set_id: int, type: string, label: string, value: float, previous: float, summary: string}>
     */
    public function forSession(WorkoutSession $session): array
    {
        $session->loadMissing('sets.exercise');

        /** @var Collection<int, EloquentCollection<int, WorkoutSet>> $setsByExercise */
        $setsByExercise = $session->sets->where('is_warmup', false)->groupBy('exercise_id');

        $records = [];

        foreach ($setsByExercise as $sets) {
            $exercise = $sets->first()?->exercise;

            if (! $exercise) {
                continue;
            }

            $history = $this->previousSets($session, $exercise);

            if ($history->isEmpty()) {
                continue;
            }

            $record = $this->compare($exercise, $sets, $history);

            if ($record !== null) {
                $records[] = $record;
            }
        }

        return $records;
    }

    /**
     * @return EloquentCollection<int, WorkoutSet>
     */
    private function previousSets(WorkoutSession $session, Exercise $exercise): EloquentCollection
    {
        return WorkoutSet::query()
            ->where('exercise_id', $exercise->id)
            ->where('is_warmup', false)
            ->whereHas('workoutSession', fn (Builder $query) => $query
                ->where('user_id', $session->user_id)
                ->whereKeyNot($session->id)
                ->where('started_at', '<', $session->started_at))
            ->get();
    }

    /**
     * @param  Collection<int, WorkoutSet>  $sets
     * @param  EloquentCollection<int, WorkoutSet>  $history
     * @return array{exercise_id: int, exercise: string, set_id: int, type: string, label: string, value: float, previous: float, summary: string}|null
     */
    private function compare(Exercise $exercise, Collection $sets, EloquentCollection $history): ?array
    {
        $record = fn (WorkoutSet $set, string $type, string $label, float $value, float $previous) => [
            'exercise_id' => $exercise->id,
            'exercise' => $exercise->name,
            'set_id' => $set->id,
            'type' => $type,
            'label' => $label,
            'value' => round($value, 1),
            'previous' => round($previous, 1),
            'summary' => $this->summary($set, $exercise->tracking_type),
        ];

        $best = fn (callable $metric, Collection $candidates) => $candidates
            ->filter(fn (WorkoutSet $set) => $metric($set) !== null)
            ->sortByDesc($metric)
            ->first();

        switch ($exercise->tracking_type) {
            case TrackingType::WeightReps:
                $oneRepMax = fn (WorkoutSet $set) => $set->estimatedOneRepMax();
                $weight = fn (WorkoutSet $set) => $set->weight_kg ?: null;
                $bestSet = $best($oneRepMax, $sets);
                $previous = (float) $history->map($oneRepMax)->max();

                if ($bestSet && $previous > 0 && $oneRepMax($bestSet) > $previous) {
                    return $record($bestSet, 'one_rep_max', '1RM estimado', (float) $oneRepMax($bestSet), $previous);
                }

                $heaviest = $best($weight, $sets);
                $previous = (float) $history->max('weight_kg');

                if ($heaviest && $previous > 0 && $heaviest->weight_kg > $previous) {
                    return $record($heaviest, 'weight', 'Peso máximo', (float) $heaviest->weight_kg, $previous);
                }

                return null;
            case TrackingType::Reps:
                $bestSet = $best(fn (WorkoutSet $set) => $set->reps, $sets);
                $previous = (float) $history->max('reps');

                return $bestSet && $previous > 0 && $bestSet->reps > $previous
                    ? $record($bestSet, 'reps', 'Repeticiones', (float) $bestSet->reps, $previous)
                    : null;
            case TrackingType::Time:
                $bestSet = $best(fn (WorkoutSet $set) => $set->duration_seconds, $sets);
                $previous = (float) $history->max('duration_seconds');

                return $bestSet && $previous > 0 && $bestSet->duration_seconds > $previous
                    ? $record($bestSet, 'duration', 'Tiempo', (float) $bestSet->duration_seconds, $previous)
                    : null;
            case TrackingType::DistanceTime:
                $speed = fn (WorkoutSet $set) => $set->distance_m && $set->duration_seconds ? $set->distance_m / $set->duration_seconds : null;
                $bestSet = $best($speed, $sets);
                $previousBest = $best($speed, $history);

                if (! $bestSet || ! $previousBest || $speed($bestSet) <= $speed($previousBest)) {
                    return null;
                }

                return $record(
                    $bestSet,
                    'pace',
                    'Ritmo',
                    $bestSet->duration_seconds / ($bestSet->distance_m / 1000),
                    $previousBest->duration_seconds / ($previousBest->distance_m / 1000),
                );
        }
    }

    private function summary(WorkoutSet $set, TrackingType $trackingType): string
    {
        return match ($trackingType) {
            TrackingType::WeightReps => rtrim(rtrim(number_format((float) $set->weight_kg, 2, ',', '.'), '0'), ',').' × '.$set->reps,
            TrackingType::Reps => $set->reps.' reps',
            TrackingType::Time => Activity::formatDuration((int) $set->duration_seconds),
            TrackingType::DistanceTime => $set->distance_m.' m en '.Activity::formatDuration((int) $set->duration_seconds),
        };
    }
}
