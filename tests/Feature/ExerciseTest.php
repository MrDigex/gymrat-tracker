<?php

use App\Enums\ExerciseSource;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\User;
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
