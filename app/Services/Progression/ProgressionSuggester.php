<?php

namespace App\Services\Progression;

use App\Enums\TrackingType;
use App\Models\Activity;
use App\Models\Exercise;
use App\Models\RoutineExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * Suggests the next target for an exercise using double progression:
 * add reps inside the target range, then add weight and start again from the bottom of the range.
 */
class ProgressionSuggester
{
    public const int DEFAULT_REPS_MIN = 8;

    public const int DEFAULT_REPS_MAX = 12;

    public const int DEFAULT_SETS = 3;

    public const int BODYWEIGHT_REPS_CEILING = 20;

    private const int SESSIONS_TO_ANALYSE = 3;

    public function suggest(User $user, Exercise $exercise, ?RoutineExercise $target = null, ?int $excludeSessionId = null): Suggestion
    {
        $history = $this->recentSets($user, $exercise, $excludeSessionId);

        if ($history->isEmpty()) {
            return $this->firstTime($exercise, $target);
        }

        /** @var Collection<int, WorkoutSet> $lastSets */
        $lastSets = $history->first();
        $sets = $target->target_sets ?? max($lastSets->count(), 1);
        $lastPerformedAt = $lastSets->first()?->workoutSession?->started_at?->toDateString();

        $usesWeight = $exercise->tracking_type === TrackingType::WeightReps && $lastSets->max('weight_kg') > 0;

        return match (true) {
            $usesWeight => $this->forWeightAndReps($exercise, $history, $sets, $target, $lastPerformedAt),
            $exercise->tracking_type === TrackingType::Time => $this->forTime($lastSets, $sets, $lastPerformedAt),
            $exercise->tracking_type === TrackingType::DistanceTime && $lastSets->contains(fn (WorkoutSet $set) => $set->distance_m && $set->duration_seconds) => $this->forDistanceAndTime($lastSets, $sets, $lastPerformedAt),
            default => $this->forReps($lastSets, $sets, $lastPerformedAt),
        };
    }

    /**
     * Working sets of the last sessions in which the exercise was performed, newest first.
     *
     * @return Collection<int, EloquentCollection<int, WorkoutSet>>
     */
    private function recentSets(User $user, Exercise $exercise, ?int $excludeSessionId): Collection
    {
        $workingSets = fn (Builder|HasMany $query) => $query->where('exercise_id', $exercise->id)->where('is_warmup', false);

        return WorkoutSession::query()
            ->whereBelongsTo($user)
            ->when($excludeSessionId, fn (Builder $query) => $query->whereKeyNot($excludeSessionId))
            ->whereHas('sets', $workingSets)
            ->with(['sets' => $workingSets])
            ->latest('started_at')
            ->limit(self::SESSIONS_TO_ANALYSE)
            ->get()
            ->map(fn (WorkoutSession $session) => $session->sets->each->setRelation('workoutSession', $session));
    }

    private function firstTime(Exercise $exercise, ?RoutineExercise $target): Suggestion
    {
        $message = match ($exercise->tracking_type) {
            TrackingType::WeightReps => 'Primera vez: elige un peso con el que completes 3×10 con buena técnica.',
            TrackingType::Reps => 'Primera vez: haz 3 series dejando 2 repeticiones en reserva.',
            TrackingType::Time => 'Primera vez: aguanta 3 series de 30 segundos con buena técnica.',
            TrackingType::DistanceTime => 'Primera vez: completa la distancia a un ritmo cómodo y registra tu tiempo.',
        };

        return new Suggestion(
            reason: SuggestionReason::FirstTime,
            message: $message,
            sets: $target->target_sets ?? self::DEFAULT_SETS,
            reps: $exercise->tracking_type === TrackingType::WeightReps || $exercise->tracking_type === TrackingType::Reps ? 10 : null,
            repsMin: $target->target_reps_min ?? self::DEFAULT_REPS_MIN,
            repsMax: $target->target_reps_max ?? self::DEFAULT_REPS_MAX,
            weightKg: $target?->target_weight_kg,
            durationSeconds: $exercise->tracking_type === TrackingType::Time ? 30 : null,
            distanceM: $target?->target_distance_m,
        );
    }

    /**
     * @param  Collection<int, EloquentCollection<int, WorkoutSet>>  $history
     */
    private function forWeightAndReps(Exercise $exercise, Collection $history, int $sets, ?RoutineExercise $target, ?string $lastPerformedAt): Suggestion
    {
        $repsMin = $target->target_reps_min ?? self::DEFAULT_REPS_MIN;
        $repsMax = max($target->target_reps_max ?? self::DEFAULT_REPS_MAX, $repsMin);

        /** @var Collection<int, WorkoutSet> $lastSets */
        $lastSets = $history->first();
        $workingWeight = (float) $lastSets->max('weight_kg');
        $setsAtWorkingWeight = $lastSets->filter(fn (WorkoutSet $set) => (float) $set->weight_kg === $workingWeight);
        $lowestReps = (int) $setsAtWorkingWeight->min('reps');
        $lastPerformance = sprintf('%d×%d @ %s', $setsAtWorkingWeight->count(), (int) round($setsAtWorkingWeight->avg('reps')), self::formatKg($workingWeight));

        if ($this->isRegressing($history)) {
            $deloadWeight = self::roundToPlate($workingWeight * 0.9);

            return new Suggestion(
                reason: SuggestionReason::Deload,
                message: sprintf('Tu rendimiento ha bajado dos sesiones seguidas. Semana de descarga: %s a %d repeticiones para recuperar.', self::formatKg($deloadWeight), $repsMin),
                sets: $sets, reps: $repsMin, repsMin: $repsMin, repsMax: $repsMax, weightKg: $deloadWeight,
                lastPerformance: $lastPerformance, lastPerformedAt: $lastPerformedAt,
            );
        }

        if ($lowestReps >= $repsMax && $setsAtWorkingWeight->count() >= min($sets, $lastSets->count())) {
            $newWeight = $workingWeight + $this->weightIncrement($exercise);

            return new Suggestion(
                reason: SuggestionReason::IncreaseWeight,
                message: sprintf('¡Completaste %d repeticiones en todas las series! Sube a %s y vuelve a %d repeticiones.', $repsMax, self::formatKg($newWeight), $repsMin),
                sets: $sets, reps: $repsMin, repsMin: $repsMin, repsMax: $repsMax, weightKg: $newWeight,
                lastPerformance: $lastPerformance, lastPerformedAt: $lastPerformedAt,
            );
        }

        $targetReps = min($repsMax, max($lowestReps + 1, $repsMin));

        return new Suggestion(
            reason: SuggestionReason::IncreaseReps,
            message: sprintf('Mantén %s y busca %d repeticiones en cada serie. Al llegar a %d, sube de peso.', self::formatKg($workingWeight), $targetReps, $repsMax),
            sets: $sets, reps: $targetReps, repsMin: $repsMin, repsMax: $repsMax, weightKg: $workingWeight,
            lastPerformance: $lastPerformance, lastPerformedAt: $lastPerformedAt,
        );
    }

    /**
     * True when the best estimated 1RM dropped in each of the last two sessions.
     *
     * @param  Collection<int, EloquentCollection<int, WorkoutSet>>  $history
     */
    private function isRegressing(Collection $history): bool
    {
        if ($history->count() < self::SESSIONS_TO_ANALYSE) {
            return false;
        }

        [$latest, $previous, $oldest] = $history->map(
            fn (Collection $sets) => (float) $sets->map(fn (WorkoutSet $set) => $set->estimatedOneRepMax())->max()
        )->all();

        return $latest < $previous && $previous < $oldest;
    }

    /**
     * @param  Collection<int, WorkoutSet>  $lastSets
     */
    private function forReps(Collection $lastSets, int $sets, ?string $lastPerformedAt): Suggestion
    {
        $bestReps = (int) $lastSets->max('reps');
        $lastPerformance = sprintf('%d series · máx. %d repeticiones', $lastSets->count(), $bestReps);

        if ($bestReps >= self::BODYWEIGHT_REPS_CEILING) {
            return new Suggestion(
                reason: SuggestionReason::AddLoad,
                message: sprintf('Ya superas %d repeticiones: añade lastre (5 kg) o pasa a una variante más difícil y trabaja entre %d y %d.', self::BODYWEIGHT_REPS_CEILING, self::DEFAULT_REPS_MIN, self::DEFAULT_REPS_MAX),
                sets: $sets, reps: self::DEFAULT_REPS_MIN, repsMin: self::DEFAULT_REPS_MIN, repsMax: self::DEFAULT_REPS_MAX, weightKg: 5.0,
                lastPerformance: $lastPerformance, lastPerformedAt: $lastPerformedAt,
            );
        }

        $targetReps = $bestReps + ($bestReps < 10 ? 1 : 2);

        return new Suggestion(
            reason: SuggestionReason::IncreaseReps,
            message: sprintf('La última vez llegaste a %d repeticiones. Hoy intenta %d.', $bestReps, $targetReps),
            sets: $sets, reps: $targetReps,
            lastPerformance: $lastPerformance, lastPerformedAt: $lastPerformedAt,
        );
    }

    /**
     * @param  Collection<int, WorkoutSet>  $lastSets
     */
    private function forTime(Collection $lastSets, int $sets, ?string $lastPerformedAt): Suggestion
    {
        $bestSeconds = (int) $lastSets->max('duration_seconds');
        $targetSeconds = $bestSeconds + ($bestSeconds >= 60 ? 10 : 5);

        return new Suggestion(
            reason: SuggestionReason::IncreaseTime,
            message: sprintf('Tu mejor serie fue de %s. Hoy intenta aguantar %s.', Activity::formatDuration($bestSeconds), Activity::formatDuration($targetSeconds)),
            sets: $sets, durationSeconds: $targetSeconds,
            lastPerformance: sprintf('%d series · máx. %s', $lastSets->count(), Activity::formatDuration($bestSeconds)),
            lastPerformedAt: $lastPerformedAt,
        );
    }

    /**
     * @param  Collection<int, WorkoutSet>  $lastSets
     */
    private function forDistanceAndTime(Collection $lastSets, int $sets, ?string $lastPerformedAt): Suggestion
    {
        /** @var WorkoutSet $best */
        $best = $lastSets
            ->filter(fn (WorkoutSet $set) => $set->distance_m && $set->duration_seconds)
            ->sortBy(fn (WorkoutSet $set) => $set->duration_seconds / $set->distance_m)
            ->first();

        $targetSeconds = (int) floor($best->duration_seconds * 0.97);

        return new Suggestion(
            reason: SuggestionReason::DecreaseTime,
            message: sprintf('Hiciste %d m en %s. Objetivo de hoy: %s (−3 %%).', $best->distance_m, Activity::formatDuration($best->duration_seconds), Activity::formatDuration($targetSeconds)),
            sets: $sets, durationSeconds: $targetSeconds, distanceM: $best->distance_m,
            lastPerformance: sprintf('%d m en %s', $best->distance_m, Activity::formatDuration($best->duration_seconds)),
            lastPerformedAt: $lastPerformedAt,
        );
    }

    /**
     * Lower-body compound lifts progress faster than upper-body or isolation work.
     */
    private function weightIncrement(Exercise $exercise): float
    {
        if ($exercise->equipment === 'dumbbell') {
            return 2.0;
        }

        $exercise->loadMissing('primaryMuscleGroups');

        return $exercise->isLowerBody() && $exercise->mechanic !== 'isolation' ? 5.0 : 2.5;
    }

    /**
     * Round to loads that can actually be built: 2.5 kg steps for heavier loads, 0.5 kg for light ones.
     */
    public static function roundToPlate(float $weight): float
    {
        return $weight >= 20 ? round($weight / 2.5) * 2.5 : round($weight * 2) / 2;
    }

    public static function formatKg(float $weight): string
    {
        return rtrim(rtrim(number_format($weight, 2, ',', '.'), '0'), ',').' kg';
    }
}
