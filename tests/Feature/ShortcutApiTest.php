<?php

use App\Enums\ActivitySource;
use App\Http\Controllers\IntegrationController;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('the shortcut can push a run in kilometres and minutes', function () {
    Sanctum::actingAs($this->user, [IntegrationController::SHORTCUT_ABILITY]);

    $this->postJson(route('api.activities.store'), [
        'started_at' => '2026-10-28T07:30:00+01:00',
        'distance_km' => 5.02,
        'duration_minutes' => 25.5,
        'avg_hr' => 152.6,
    ])
        ->assertCreated()
        ->assertJsonPath('distance_m', 5020)
        ->assertJsonPath('duration_seconds', 1530)
        ->assertJsonPath('source', 'shortcut');

    expect($this->user->activities()->sole())
        ->source->toBe(ActivitySource::Shortcut)
        ->avg_hr->toBe(153);
});

test('pushing the same workout twice does not duplicate it', function () {
    Sanctum::actingAs($this->user, [IntegrationController::SHORTCUT_ABILITY]);
    $payload = ['started_at' => '2026-10-28T07:30:00Z', 'distance_m' => 8000, 'duration_seconds' => 2400];

    $this->postJson(route('api.activities.store'), $payload)->assertCreated();
    $this->postJson(route('api.activities.store'), $payload)->assertOk();

    expect($this->user->activities()->count())->toBe(1);
});

test('a token without the activities ability is rejected', function () {
    Sanctum::actingAs($this->user, ['other']);

    $this->postJson(route('api.activities.store'), ['started_at' => now(), 'distance_m' => 1000, 'duration_seconds' => 300])
        ->assertForbidden();
});

test('unauthenticated requests are rejected', function () {
    $this->postJson(route('api.activities.store'), [])->assertUnauthorized();
});

test('distance and duration are required', function () {
    Sanctum::actingAs($this->user, [IntegrationController::SHORTCUT_ABILITY]);

    $this->postJson(route('api.activities.store'), ['started_at' => now()->toIso8601String()])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['distance_m', 'duration_seconds']);
});

test('users can create and revoke shortcut tokens', function () {
    $this->actingAs($this->user)
        ->post(route('integrations.tokens.store'), ['name' => 'iPhone'])
        ->assertInertiaFlash('plainTextToken');

    $token = $this->user->tokens()->sole();
    expect($token->can(IntegrationController::SHORTCUT_ABILITY))->toBeTrue();

    $this->actingAs($this->user)->delete(route('integrations.tokens.destroy', $token->id));

    expect($this->user->tokens()->count())->toBe(0);
});

test('users cannot revoke other users tokens', function () {
    $other = User::factory()->create();
    $token = $other->createToken('iPhone')->accessToken;

    $this->actingAs($this->user)->delete(route('integrations.tokens.destroy', $token->id));

    expect($other->tokens()->count())->toBe(1);
});
