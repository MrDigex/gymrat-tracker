<?php

use App\Enums\ExerciseSource;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('the library shows catalog and own exercises but not other users custom exercises', function () {
    $catalog = Exercise::factory()->create(['name' => 'Press de banca']);
    $mine = Exercise::factory()->custom($this->user)->create(['name' => 'Mi ejercicio']);
    Exercise::factory()->custom(User::factory()->create())->create(['name' => 'Ajeno']);

    $this->actingAs($this->user)
        ->get(route('exercises.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('exercises/index')
            ->has('exercises.data', 2)
            ->where('exercises.data', fn ($data) => collect($data)->pluck('id')->sort()->values()->all() === collect([$catalog->id, $mine->id])->sort()->values()->all()));
});

test('the library can be filtered by body zone', function () {
    $legs = Exercise::factory()->create();
    $legs->muscleGroups()->attach(MuscleGroup::factory()->create(['body_zone' => 'inferior']), ['is_primary' => true]);
    $chest = Exercise::factory()->create();
    $chest->muscleGroups()->attach(MuscleGroup::factory()->create(['body_zone' => 'superior']), ['is_primary' => true]);

    $this->actingAs($this->user)
        ->get(route('exercises.index', ['zone' => 'inferior']))
        ->assertInertia(fn (Assert $page) => $page->has('exercises.data', 1)->where('exercises.data.0.id', $legs->id));
});

test('the full body zone matches exercises whose main muscles span several zones', function () {
    $upper = MuscleGroup::factory()->create(['body_zone' => 'superior']);
    $lower = MuscleGroup::factory()->create(['body_zone' => 'inferior']);
    $thruster = Exercise::factory()->create();
    $thruster->muscleGroups()->attach([$upper->id => ['is_primary' => true], $lower->id => ['is_primary' => true]]);
    $squat = Exercise::factory()->create();
    $squat->muscleGroups()->attach([$lower->id => ['is_primary' => true], $upper->id => ['is_primary' => false]]);
    $untaggedHyrox = Exercise::factory()->hyrox()->create();

    $this->actingAs($this->user)
        ->getJson(route('exercises.search', ['zone' => 'cuerpo_completo']))
        ->assertOk()
        ->assertJsonCount(2)
        ->assertJsonFragment(['id' => $thruster->id])
        ->assertJsonFragment(['id' => $untaggedHyrox->id]);

    $this->actingAs($this->user)
        ->getJson(route('exercises.search', ['zone' => 'inferior']))
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $squat->id);
});

test('search returns matching visible exercises as json', function () {
    Exercise::factory()->create(['name' => 'Sentadilla con barra']);
    Exercise::factory()->create(['name' => 'Remo con barra']);
    Exercise::factory()->custom(User::factory()->create())->create(['name' => 'Sentadilla secreta']);

    $this->actingAs($this->user)
        ->getJson(route('exercises.search', ['search' => 'Sentadilla']))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.name', 'Sentadilla con barra');
});

test('search can be narrowed to a muscle group', function () {
    $chest = MuscleGroup::factory()->create();
    $benchPress = Exercise::factory()->create();
    $benchPress->muscleGroups()->attach($chest, ['is_primary' => true]);
    $assisted = Exercise::factory()->create();
    $assisted->muscleGroups()->attach($chest, ['is_primary' => false]);
    Exercise::factory()->create();

    $this->actingAs($this->user)
        ->getJson(route('exercises.search', ['muscle' => $chest->id]))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $benchPress->id);
});

test('authenticated pages share the muscle groups for the exercise picker', function () {
    MuscleGroup::factory()->count(2)->create();

    $this->actingAs($this->user)
        ->get(route('routines.index'))
        ->assertInertia(fn (Assert $page) => $page->has('muscleGroups', 2));
});

test('users can create a custom exercise with an image', function () {
    Storage::fake('public');
    $muscle = MuscleGroup::factory()->create();

    $this->actingAs($this->user)
        ->post(route('exercises.store'), [
            'name' => 'Press Landmine',
            'category' => 'fuerza',
            'tracking_type' => 'weight_reps',
            'equipment' => 'barbell',
            'instructions' => ['Coloca la barra en la esquina.', ''],
            'primary_muscles' => [$muscle->id],
            'image' => UploadedFile::fake()->image('landmine.jpg'),
        ])
        ->assertRedirect();

    $exercise = Exercise::query()->where('name', 'Press Landmine')->firstOrFail();

    expect($exercise->user_id)->toBe($this->user->id)
        ->and($exercise->source)->toBe(ExerciseSource::User)
        ->and($exercise->instructions)->toBe(['Coloca la barra en la esquina.'])
        ->and($exercise->primaryMuscleGroups->pluck('id')->all())->toBe([$muscle->id]);
    Storage::disk('public')->assertExists($exercise->image_path);
});

test('creating an exercise requires a name and a primary muscle', function () {
    $this->actingAs($this->user)
        ->post(route('exercises.store'), ['category' => 'fuerza', 'tracking_type' => 'reps'])
        ->assertSessionHasErrors(['name', 'primary_muscles']);
});

test('catalog and other users exercises cannot be edited or deleted', function (string $owner) {
    $exercise = $owner === 'catalog'
        ? Exercise::factory()->create()
        : Exercise::factory()->custom(User::factory()->create())->create();

    $this->actingAs($this->user)->delete(route('exercises.destroy', $exercise))->assertForbidden();
    $this->actingAs($this->user)->get(route('exercises.edit', $exercise))->assertForbidden();

    expect($exercise->fresh())->not->toBeNull();
})->with(['catalog', 'other user']);

test('other users custom exercises cannot be viewed', function () {
    $exercise = Exercise::factory()->custom(User::factory()->create())->create();

    $this->actingAs($this->user)->get(route('exercises.show', $exercise))->assertForbidden();
    $this->actingAs($this->user)->getJson(route('exercises.suggestion', $exercise))->assertForbidden();
});

test('the suggestion endpoint returns the next target', function () {
    $exercise = Exercise::factory()->create();

    $this->actingAs($this->user)
        ->getJson(route('exercises.suggestion', $exercise))
        ->assertOk()
        ->assertJsonPath('reason', 'first_time')
        ->assertJsonPath('has_history', false);
});

test('the exercise history reports the best set of each session', function () {
    $exercise = Exercise::factory()->create();
    $session = WorkoutSession::factory()->for($this->user)->create();
    WorkoutSet::factory()->for($session)->for($exercise)->create(['weight_kg' => 70, 'reps' => 5]);
    WorkoutSet::factory()->for($session)->for($exercise)->create(['weight_kg' => 67.5, 'reps' => 10]);

    $this->actingAs($this->user)
        ->get(route('exercises.show', $exercise))
        ->assertInertia(fn (Assert $page) => $page
            ->where('history.0.best_set', ['weight_kg' => 67.5, 'reps' => 10])
            ->where('history.0.max_weight_kg', 70));
});
