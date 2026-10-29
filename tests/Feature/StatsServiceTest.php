<?php

use App\Enums\BodyZone;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use App\Services\StatsService;

beforeEach(function () {
    $this->travelTo(now()->startOfWeek()->addDays(2)->setTime(12, 0));
    $this->user = User::factory()->create();
    $this->chest = MuscleGroup::factory()->zone(BodyZone::Upper)->create(['name' => 'Pecho']);
    $this->quads = MuscleGroup::factory()->zone(BodyZone::Lower)->create(['name' => 'Cuádriceps']);
    $this->bench = Exercise::factory()->create();
    $this->bench->muscleGroups()->attach($this->chest, ['is_primary' => true]);
    $this->squat = Exercise::factory()->create();
    $this->squat->muscleGroups()->attach($this->quads, ['is_primary' => true]);
});

test('weekly volume is split by body zone and ignores warm-ups', function () {
    $session = WorkoutSession::factory()->for($this->user)->create(['started_at' => now()->subDay()]);
    WorkoutSet::factory()->for($session)->for($this->bench)->create(['reps' => 10, 'weight_kg' => 50]);
    WorkoutSet::factory()->for($session)->for($this->squat)->create(['reps' => 5, 'weight_kg' => 100]);
    WorkoutSet::factory()->for($session)->for($this->squat)->warmup()->create(['reps' => 10, 'weight_kg' => 40]);

    $weeks = app(StatsService::class)->weeklyVolumeByZone($this->user, now()->subWeeks(3), now());

    expect($weeks)->toHaveCount(4)
        ->and(end($weeks))->toMatchArray(['superior' => 500, 'inferior' => 500, 'core' => 0]);
});

test('muscle distribution counts working sets per primary muscle', function () {
    $session = WorkoutSession::factory()->for($this->user)->create(['started_at' => now()->subDay()]);
    WorkoutSet::factory()->for($session)->for($this->bench)->count(3)->create(['reps' => 10, 'weight_kg' => 50]);
    WorkoutSet::factory()->for($session)->for($this->squat)->create(['reps' => 5, 'weight_kg' => 100]);
    WorkoutSet::factory()->for(WorkoutSession::factory()->create(['started_at' => now()->subDay()]))->for($this->squat)->count(5)->create();

    $distribution = app(StatsService::class)->muscleDistribution($this->user, now()->subWeek(), now());

    expect($distribution)->toBe([
        ['muscle' => 'Pecho', 'zone' => 'superior', 'sets' => 3, 'volume_kg' => 1500.0],
        ['muscle' => 'Cuádriceps', 'zone' => 'inferior', 'sets' => 1, 'volume_kg' => 500.0],
    ]);
});

test('kpis compare this week with last week', function () {
    $thisWeek = WorkoutSession::factory()->for($this->user)->create(['started_at' => now()->subDay()]);
    WorkoutSet::factory()->for($thisWeek)->for($this->bench)->create(['reps' => 10, 'weight_kg' => 60]);
    $lastWeek = WorkoutSession::factory()->for($this->user)->create(['started_at' => now()->subWeek()]);
    WorkoutSet::factory()->for($lastWeek)->for($this->bench)->create(['reps' => 10, 'weight_kg' => 50]);

    expect(app(StatsService::class)->kpis($this->user))->toMatchArray([
        'workouts_this_week' => 1,
        'workouts_last_week' => 1,
        'volume_this_week' => 600.0,
        'volume_last_week' => 500.0,
    ]);
});
