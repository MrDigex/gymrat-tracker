<?php

use App\Enums\BodyZone;
use App\Enums\TrackingType;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\RoutineExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use App\Services\Progression\ProgressionSuggester;
use App\Services\Progression\SuggestionReason;

/**
 * @param  list<array<string, mixed>>  $sets
 */
function logSession(User $user, Exercise $exercise, array $sets, string $daysAgo = '1'): WorkoutSession
{
    $session = WorkoutSession::factory()->for($user)->create(['started_at' => now()->subDays((int) $daysAgo)]);

    foreach ($sets as $index => $set) {
        WorkoutSet::factory()->for($session)->for($exercise)->create(['set_number' => $index + 1, ...$set]);
    }

    return $session;
}

function suggester(): ProgressionSuggester
{
    return app(ProgressionSuggester::class);
}

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('first time suggestion when the user never performed the exercise', function () {
    $exercise = Exercise::factory()->create();

    $suggestion = suggester()->suggest($this->user, $exercise);

    expect($suggestion->reason)->toBe(SuggestionReason::FirstTime)
        ->and($suggestion->hasHistory())->toBeFalse()
        ->and($suggestion->message)->toContain('Primera vez');
});

test('history from other users is ignored', function () {
    $exercise = Exercise::factory()->create();
    logSession(User::factory()->create(), $exercise, [['reps' => 12, 'weight_kg' => 50]]);

    expect(suggester()->suggest($this->user, $exercise)->reason)->toBe(SuggestionReason::FirstTime);
});

test('suggests one more rep at the same weight while below the top of the range', function () {
    $exercise = Exercise::factory()->create();
    logSession($this->user, $exercise, [
        ['reps' => 10, 'weight_kg' => 60],
        ['reps' => 9, 'weight_kg' => 60],
        ['reps' => 8, 'weight_kg' => 60],
    ]);

    $suggestion = suggester()->suggest($this->user, $exercise);

    expect($suggestion->reason)->toBe(SuggestionReason::IncreaseReps)
        ->and($suggestion->weightKg)->toBe(60.0)
        ->and($suggestion->reps)->toBe(9)
        ->and($suggestion->lastPerformance)->toBe('3×9 @ 60 kg');
});

test('suggests more weight once every set reached the top of the range', function () {
    $exercise = Exercise::factory()->create(['equipment' => 'barbell']);
    logSession($this->user, $exercise, [
        ['reps' => 12, 'weight_kg' => 60],
        ['reps' => 12, 'weight_kg' => 60],
        ['reps' => 12, 'weight_kg' => 60],
    ]);

    $suggestion = suggester()->suggest($this->user, $exercise);

    expect($suggestion->reason)->toBe(SuggestionReason::IncreaseWeight)
        ->and($suggestion->weightKg)->toBe(62.5)
        ->and($suggestion->reps)->toBe(ProgressionSuggester::DEFAULT_REPS_MIN)
        ->and($suggestion->message)->toContain('62,5 kg');
});

test('lower body compound lifts progress in 5 kg jumps', function () {
    $exercise = Exercise::factory()->create(['equipment' => 'barbell', 'mechanic' => 'compound']);
    $exercise->muscleGroups()->attach(MuscleGroup::factory()->zone(BodyZone::Lower)->create(), ['is_primary' => true]);
    logSession($this->user, $exercise, [['reps' => 12, 'weight_kg' => 100], ['reps' => 12, 'weight_kg' => 100]]);

    expect(suggester()->suggest($this->user, $exercise)->weightKg)->toBe(105.0);
});

test('respects the rep range configured in the routine', function () {
    $exercise = Exercise::factory()->create();
    $target = RoutineExercise::factory()->for($exercise)->create(['target_sets' => 4, 'target_reps_min' => 5, 'target_reps_max' => 6]);
    logSession($this->user, $exercise, [['reps' => 6, 'weight_kg' => 80], ['reps' => 6, 'weight_kg' => 80]]);

    $suggestion = suggester()->suggest($this->user, $exercise, $target);

    expect($suggestion->reason)->toBe(SuggestionReason::IncreaseWeight)
        ->and($suggestion->sets)->toBe(4)
        ->and($suggestion->reps)->toBe(5);
});

test('ignores warm-up sets', function () {
    $exercise = Exercise::factory()->create();
    logSession($this->user, $exercise, [
        ['reps' => 15, 'weight_kg' => 100, 'is_warmup' => true],
        ['reps' => 8, 'weight_kg' => 50],
    ]);

    expect(suggester()->suggest($this->user, $exercise)->weightKg)->toBe(50.0);
});

test('suggests a deload after two consecutive regressions', function () {
    $exercise = Exercise::factory()->create();
    logSession($this->user, $exercise, [['reps' => 10, 'weight_kg' => 80]], daysAgo: '7');
    logSession($this->user, $exercise, [['reps' => 8, 'weight_kg' => 80]], daysAgo: '4');
    logSession($this->user, $exercise, [['reps' => 6, 'weight_kg' => 80]], daysAgo: '1');

    $suggestion = suggester()->suggest($this->user, $exercise);

    expect($suggestion->reason)->toBe(SuggestionReason::Deload)
        ->and($suggestion->weightKg)->toBe(72.5);
});

test('excludes the session currently being logged', function () {
    $exercise = Exercise::factory()->create();
    $current = logSession($this->user, $exercise, [['reps' => 12, 'weight_kg' => 60]], daysAgo: '0');

    expect(suggester()->suggest($this->user, $exercise, excludeSessionId: $current->id)->reason)->toBe(SuggestionReason::FirstTime);
});

test('bodyweight exercises add reps and then load', function (int $bestReps, SuggestionReason $reason, ?int $reps) {
    $exercise = Exercise::factory()->tracking(TrackingType::Reps)->create();
    logSession($this->user, $exercise, [['reps' => $bestReps, 'weight_kg' => null]]);

    $suggestion = suggester()->suggest($this->user, $exercise);

    expect($suggestion->reason)->toBe($reason)
        ->and($suggestion->reps)->toBe($reps);
})->with([
    'few reps' => [6, SuggestionReason::IncreaseReps, 7],
    'many reps' => [14, SuggestionReason::IncreaseReps, 16],
    'ceiling reached' => [20, SuggestionReason::AddLoad, ProgressionSuggester::DEFAULT_REPS_MIN],
]);

test('timed exercises ask to hold a bit longer', function () {
    $exercise = Exercise::factory()->tracking(TrackingType::Time)->create();
    logSession($this->user, $exercise, [['reps' => null, 'weight_kg' => null, 'duration_seconds' => 45]]);

    $suggestion = suggester()->suggest($this->user, $exercise);

    expect($suggestion->reason)->toBe(SuggestionReason::IncreaseTime)
        ->and($suggestion->durationSeconds)->toBe(50);
});

test('distance exercises ask for a 3% faster time over the same distance', function () {
    $exercise = Exercise::factory()->hyrox()->create();
    logSession($this->user, $exercise, [['reps' => null, 'weight_kg' => null, 'distance_m' => 1000, 'duration_seconds' => 240]]);

    $suggestion = suggester()->suggest($this->user, $exercise);

    expect($suggestion->reason)->toBe(SuggestionReason::DecreaseTime)
        ->and($suggestion->distanceM)->toBe(1000)
        ->and($suggestion->durationSeconds)->toBe(232);
});
