<?php

use App\Models\Activity;
use App\Models\ActivitySplit;
use App\Models\Exercise;
use App\Models\MotivationalQuote;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;

test('every authenticated page renders with data', function () {
    $user = User::factory()->create();
    MotivationalQuote::factory()->count(3)->create();
    $exercise = Exercise::factory()->create();
    $routine = Routine::factory()->for($user)->shared()->create();
    RoutineExercise::factory()->for($routine)->for($exercise)->create();
    $session = WorkoutSession::factory()->for($user)->create(['routine_id' => $routine->id]);
    WorkoutSet::factory()->for($session)->for($exercise)->create();
    $activity = Activity::factory()->for($user)->create();
    ActivitySplit::factory()->for($activity)->create();

    $this->actingAs($user);

    foreach ([
        route('dashboard'),
        route('stats.index'),
        route('exercises.index'),
        route('exercises.create'),
        route('exercises.show', $exercise),
        route('routines.index'),
        route('routines.show', $routine),
        route('workouts.index'),
        route('workouts.show', $session),
        route('activities.index'),
        route('activities.create'),
        route('activities.show', $activity),
        route('activities.edit', $activity),
        route('integrations.index'),
    ] as $url) {
        $this->get($url)->assertOk();
    }
});

test('public share pages render for guests', function () {
    $routine = Routine::factory()->shared()->create();
    $session = WorkoutSession::factory()->create(['share_token' => 'workout-token']);
    WorkoutSet::factory()->for($session)->create();
    $activity = Activity::factory()->create(['share_token' => 'activity-token']);

    $this->get(route('share.routine', $routine->share_token))->assertOk();
    $this->get(route('share.workout', 'workout-token'))->assertOk();
    $this->get(route('share.activity', 'activity-token'))->assertOk();
    $this->get(route('share.activity.image', 'activity-token'))->assertHeader('Content-Type', 'image/png');
    $this->get(route('home'))->assertOk();
});
