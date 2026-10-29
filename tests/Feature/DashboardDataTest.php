<?php

use App\Models\Activity;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use Inertia\Testing\AssertableInertia as Assert;

test('the dashboard suggests the next routine and lists recent training days', function () {
    $this->travelTo(now()->setTime(12, 0));
    $user = User::factory()->create();
    $done = Routine::factory()->for($user)->create(['name' => 'Torso']);
    $next = Routine::factory()->for($user)->create(['name' => 'Pierna']);
    RoutineExercise::factory()->for($done)->create();
    RoutineExercise::factory()->for($next)->count(2)->create();
    WorkoutSession::factory()->for($user)->create([
        'routine_id' => $done->id,
        'started_at' => now()->subDay()->setTime(18, 0),
        'finished_at' => now()->subDay()->setTime(18, 55),
    ]);
    Activity::factory()->for($user)->create(['started_at' => now()->subDays(3)]);
    Activity::factory()->for($user)->create(['started_at' => now()->subDays(10)]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('nextRoutine', ['id' => $next->id, 'name' => 'Pierna', 'exercises_count' => 2])
            ->where('activeDays', [now()->subDays(3)->toDateString(), now()->subDay()->toDateString()])
            ->where('recentWorkouts.0.duration_minutes', 55));
});

test('without routines there is no next routine', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('nextRoutine', null)->where('activeDays', []));
});
