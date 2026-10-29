<?php

use App\Enums\TrackingType;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use App\Services\PersonalRecords;

beforeEach(function () {
    $this->user = User::factory()->create();
});

/**
 * @param  list<array<string, mixed>>  $sets
 */
function sessionWith(User $user, Exercise $exercise, array $sets, int $daysAgo): WorkoutSession
{
    $session = WorkoutSession::factory()->for($user)->create(['started_at' => now()->subDays($daysAgo)]);

    foreach ($sets as $index => $set) {
        WorkoutSet::factory()->for($session)->for($exercise)->create(['set_number' => $index + 1, ...$set]);
    }

    return $session;
}

test('a better estimated 1RM than any earlier session is a record', function () {
    $exercise = Exercise::factory()->create();
    sessionWith($this->user, $exercise, [['weight_kg' => 65, 'reps' => 10]], 7);
    $today = sessionWith($this->user, $exercise, [['weight_kg' => 67.5, 'reps' => 9], ['weight_kg' => 67.5, 'reps' => 10]], 0);

    $records = app(PersonalRecords::class)->forSession($today);

    expect($records)->toHaveCount(1)
        ->and($records[0])->toMatchArray(['type' => 'one_rep_max', 'summary' => '67,5 × 10', 'value' => 90.0, 'previous' => 86.7])
        ->and($records[0]['set_id'])->toBe($today->sets()->where('reps', 10)->value('id'));
});

test('the first time an exercise is done is not a record', function () {
    $exercise = Exercise::factory()->create();
    $today = sessionWith($this->user, $exercise, [['weight_kg' => 100, 'reps' => 5]], 0);

    expect(app(PersonalRecords::class)->forSession($today))->toBe([]);
});

test('later sessions and other users do not count as history', function () {
    $exercise = Exercise::factory()->create();
    sessionWith($this->user, $exercise, [['weight_kg' => 50, 'reps' => 10]], 10);
    $past = sessionWith($this->user, $exercise, [['weight_kg' => 60, 'reps' => 10]], 5);
    sessionWith($this->user, $exercise, [['weight_kg' => 90, 'reps' => 10]], 1);
    sessionWith(User::factory()->create(), $exercise, [['weight_kg' => 200, 'reps' => 10]], 20);

    expect(app(PersonalRecords::class)->forSession($past))->toHaveCount(1);
});

test('warm-up sets are ignored', function () {
    $exercise = Exercise::factory()->create();
    sessionWith($this->user, $exercise, [['weight_kg' => 60, 'reps' => 10]], 7);
    $today = sessionWith($this->user, $exercise, [['weight_kg' => 100, 'reps' => 10, 'is_warmup' => true], ['weight_kg' => 50, 'reps' => 10]], 0);

    expect(app(PersonalRecords::class)->forSession($today))->toBe([]);
});

test('records for bodyweight, timed and distance exercises', function (TrackingType $type, array $before, array $after, string $recordType) {
    $exercise = Exercise::factory()->tracking($type)->create();
    sessionWith($this->user, $exercise, [$before], 7);
    $today = sessionWith($this->user, $exercise, [$after], 0);

    expect(app(PersonalRecords::class)->forSession($today)[0]['type'] ?? null)->toBe($recordType);
})->with([
    'reps' => [TrackingType::Reps, ['reps' => 12, 'weight_kg' => null], ['reps' => 15, 'weight_kg' => null], 'reps'],
    'time' => [TrackingType::Time, ['reps' => null, 'weight_kg' => null, 'duration_seconds' => 60], ['reps' => null, 'weight_kg' => null, 'duration_seconds' => 75], 'duration'],
    'pace' => [TrackingType::DistanceTime, ['reps' => null, 'weight_kg' => null, 'distance_m' => 1000, 'duration_seconds' => 250], ['reps' => null, 'weight_kg' => null, 'distance_m' => 1000, 'duration_seconds' => 240], 'pace'],
]);
