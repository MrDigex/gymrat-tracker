<?php

use App\Models\Exercise;
use App\Models\Routine;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('starting a workout from a routine creates a session named after it', function () {
    $routine = Routine::factory()->for($this->user)->create(['name' => 'Pierna']);

    $this->actingAs($this->user)->post(route('workouts.store'), ['routine_id' => $routine->id]);

    $session = $this->user->workoutSessions()->firstOrFail();

    expect($session->routine_id)->toBe($routine->id)
        ->and($session->name)->toBe('Pierna')
        ->and($session->isFinished())->toBeFalse();
});

test('a workout cannot be started from another users routine', function () {
    $this->actingAs($this->user)
        ->post(route('workouts.store'), ['routine_id' => Routine::factory()->create()->id])
        ->assertForbidden();
});

test('sets are numbered per exercise', function () {
    $session = WorkoutSession::factory()->for($this->user)->inProgress()->create();
    $exercise = Exercise::factory()->create();

    $this->actingAs($this->user)->post(route('workouts.sets.store', $session), ['exercise_id' => $exercise->id, 'reps' => 10, 'weight_kg' => 50]);
    $this->actingAs($this->user)->post(route('workouts.sets.store', $session), ['exercise_id' => $exercise->id, 'reps' => 9, 'weight_kg' => 50]);

    expect($session->sets()->pluck('set_number')->all())->toBe([1, 2]);
});

test('a set needs reps, time or distance', function () {
    $session = WorkoutSession::factory()->for($this->user)->inProgress()->create();

    $this->actingAs($this->user)
        ->post(route('workouts.sets.store', $session), ['exercise_id' => Exercise::factory()->create()->id, 'weight_kg' => 50])
        ->assertSessionHasErrors('reps');
});

test('users cannot log sets in other users workouts', function () {
    $session = WorkoutSession::factory()->inProgress()->create();
    $set = WorkoutSet::factory()->for($session)->create();

    $this->actingAs($this->user)
        ->post(route('workouts.sets.store', $session), ['exercise_id' => Exercise::factory()->create()->id, 'reps' => 5])
        ->assertForbidden();
    $this->actingAs($this->user)->delete(route('workouts.sets.destroy', [$session, $set]))->assertForbidden();
    $this->actingAs($this->user)->get(route('workouts.show', $session))->assertForbidden();
});

test('finishing a workout keeps the original finish time', function () {
    $session = WorkoutSession::factory()->for($this->user)->inProgress()->create();

    $this->actingAs($this->user)->post(route('workouts.finish', $session));
    $finishedAt = $session->fresh()->finished_at;

    $this->travel(1)->hours();
    $this->actingAs($this->user)->post(route('workouts.finish', $session));

    expect($session->fresh()->finished_at->equalTo($finishedAt))->toBeTrue();
});

test('a shared workout has a public page', function () {
    $session = WorkoutSession::factory()->for($this->user)->create();
    WorkoutSet::factory()->for($session)->create();

    $this->actingAs($this->user)->post(route('workouts.share', $session));
    auth()->logout();

    $this->get(route('share.workout', $session->fresh()->share_token))->assertOk();
    $this->get(route('share.workout.image', $session->fresh()->share_token))->assertHeader('Content-Type', 'image/png');
});

test('a finished workout includes the current streak', function () {
    $session = WorkoutSession::factory()->for($this->user)->create(['started_at' => now()->subHour(), 'finished_at' => now()]);
    WorkoutSession::factory()->for($this->user)->create(['started_at' => now()->subDay()]);

    $this->actingAs($this->user)
        ->get(route('workouts.show', $session))
        ->assertInertia(fn (Assert $page) => $page->where('streakDays', 2));
});
