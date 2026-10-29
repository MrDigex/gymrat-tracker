<?php

use App\Models\Exercise;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('users can create a routine', function () {
    $this->actingAs($this->user)
        ->post(route('routines.store'), ['name' => 'Torso'])
        ->assertRedirect(route('routines.show', Routine::query()->firstOrFail()));

    expect($this->user->routines()->pluck('name')->all())->toBe(['Torso']);
});

test('adding an exercise prefills targets from the progression suggestion', function () {
    $routine = Routine::factory()->for($this->user)->create();
    $exercise = Exercise::factory()->create();
    $session = WorkoutSession::factory()->for($this->user)->create();
    WorkoutSet::factory()->for($session)->for($exercise)->count(3)->create(['reps' => 12, 'weight_kg' => 40]);

    $this->actingAs($this->user)
        ->post(route('routines.exercises.store', $routine), ['exercise_id' => $exercise->id])
        ->assertRedirect()
        ->assertInertiaFlash('toast.message', $exercise->name.' añadido. ¡Completaste 12 repeticiones en todas las series! Sube a 42,5 kg y vuelve a 8 repeticiones.');

    $item = $routine->routineExercises()->firstOrFail();

    expect($item->target_weight_kg)->toBe(42.5)
        ->and($item->target_reps_min)->toBe(8)
        ->and($item->target_sets)->toBe(3)
        ->and($item->position)->toBe(1);
});

test('explicit targets override the suggestion', function () {
    $routine = Routine::factory()->for($this->user)->create();
    $exercise = Exercise::factory()->create();

    $this->actingAs($this->user)->post(route('routines.exercises.store', $routine), [
        'exercise_id' => $exercise->id,
        'target_sets' => 5,
        'target_reps_min' => 5,
        'target_reps_max' => 5,
        'target_weight_kg' => 100,
    ]);

    expect($routine->routineExercises()->firstOrFail())
        ->target_sets->toBe(5)
        ->target_weight_kg->toBe(100.0);
});

test('other users custom exercises cannot be added to a routine', function () {
    $routine = Routine::factory()->for($this->user)->create();
    $exercise = Exercise::factory()->custom(User::factory()->create())->create();

    $this->actingAs($this->user)
        ->post(route('routines.exercises.store', $routine), ['exercise_id' => $exercise->id])
        ->assertForbidden();
});

test('users cannot see or modify other users routines', function () {
    $routine = Routine::factory()->create();
    $item = RoutineExercise::factory()->for($routine)->create();

    $this->actingAs($this->user)->get(route('routines.show', $routine))->assertForbidden();
    $this->actingAs($this->user)->put(route('routines.update', $routine), ['name' => 'Hack'])->assertForbidden();
    $this->actingAs($this->user)->delete(route('routines.exercises.destroy', [$routine, $item]))->assertForbidden();
    $this->actingAs($this->user)->post(route('routines.share', $routine))->assertForbidden();
});

test('routine exercises from another routine cannot be edited through a routine the user owns', function () {
    $routine = Routine::factory()->for($this->user)->create();
    $foreignItem = RoutineExercise::factory()->create();

    $this->actingAs($this->user)
        ->put(route('routines.exercises.update', [$routine, $foreignItem]), ['target_sets' => 9])
        ->assertNotFound();
});

test('exercises can be reordered', function () {
    $routine = Routine::factory()->for($this->user)->create();
    [$first, $second] = RoutineExercise::factory()->for($routine)->count(2)->sequence(['position' => 1], ['position' => 2])->create();

    $this->actingAs($this->user)
        ->put(route('routines.exercises.reorder', $routine), ['ids' => [$second->id, $first->id]])
        ->assertRedirect();

    expect($routine->routineExercises()->pluck('id')->all())->toBe([$second->id, $first->id]);
});

test('a shared routine is public until sharing is disabled', function () {
    $routine = Routine::factory()->for($this->user)->create();

    $this->actingAs($this->user)->post(route('routines.share', $routine))->assertRedirect();
    $token = $routine->fresh()->share_token;

    auth()->logout();
    $this->get(route('share.routine', $token))
        ->assertOk()
        ->assertSee('og:image', false)
        ->assertSee(route('share.routine.image', $token), false);

    $this->actingAs($this->user)->delete(route('routines.unshare', $routine));
    auth()->logout();

    $this->get(route('share.routine', $token))->assertNotFound();
});

test('the open graph image of a shared routine is a png', function () {
    $routine = Routine::factory()->for($this->user)->shared()->create();
    RoutineExercise::factory()->for($routine)->create();

    $this->get(route('share.routine.image', $routine->share_token))
        ->assertOk()
        ->assertHeader('Content-Type', 'image/png');
});

test('routine exercises reach the page as a plain list', function () {
    $routine = Routine::factory()->for($this->user)->create();
    $empty = Routine::factory()->for($this->user)->create();
    RoutineExercise::factory()->for($routine)->create();

    $this->actingAs($this->user)
        ->get(route('routines.show', $routine))
        ->assertInertia(fn (Assert $page) => $page
            ->has('routine.exercises', 1)
            ->has('routine.exercises.0.exercise.name'));

    $this->actingAs($this->user)
        ->get(route('routines.show', $empty))
        ->assertInertia(fn (Assert $page) => $page->where('routine.exercises', []));
});
