<?php

use App\Enums\ActivitySource;
use App\Enums\ActivityType;
use App\Jobs\ImportStravaActivity;
use App\Models\Activity;
use App\Models\StravaAccount;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    config([
        'services.strava.client_id' => '123',
        'services.strava.client_secret' => 'secret',
        'services.strava.webhook_verify_token' => 'verify-me',
    ]);
});

test('the webhook subscription handshake echoes the challenge', function () {
    $this->getJson(route('webhooks.strava.verify', ['hub.mode' => 'subscribe', 'hub.verify_token' => 'verify-me', 'hub.challenge' => 'abc']))
        ->assertOk()
        ->assertExactJson(['hub.challenge' => 'abc']);
});

test('the webhook handshake rejects a wrong verify token', function () {
    $this->getJson(route('webhooks.strava.verify', ['hub.mode' => 'subscribe', 'hub.verify_token' => 'nope', 'hub.challenge' => 'abc']))
        ->assertForbidden();
});

test('new activity events queue an import for the connected athlete', function () {
    Queue::fake();
    $account = StravaAccount::factory()->create();

    $this->postJson(route('webhooks.strava.handle'), [
        'object_type' => 'activity', 'aspect_type' => 'create', 'object_id' => 999, 'owner_id' => $account->athlete_id,
    ])->assertOk();

    Queue::assertPushed(ImportStravaActivity::class, fn (ImportStravaActivity $job) => $job->stravaActivityId === 999 && $job->account->is($account));
});

test('events for unknown athletes are ignored', function () {
    Queue::fake();

    $this->postJson(route('webhooks.strava.handle'), [
        'object_type' => 'activity', 'aspect_type' => 'create', 'object_id' => 1, 'owner_id' => 42,
    ])->assertOk();

    Queue::assertNothingPushed();
});

test('deleted strava activities are removed', function () {
    $account = StravaAccount::factory()->create();
    Activity::factory()->for($account->user)->create(['source' => ActivitySource::Strava, 'external_id' => '555']);

    $this->postJson(route('webhooks.strava.handle'), [
        'object_type' => 'activity', 'aspect_type' => 'delete', 'object_id' => 555, 'owner_id' => $account->athlete_id,
    ]);

    expect($account->user->activities()->count())->toBe(0);
});

test('deauthorization removes the connection', function () {
    $account = StravaAccount::factory()->create();

    $this->postJson(route('webhooks.strava.handle'), [
        'object_type' => 'athlete', 'aspect_type' => 'update', 'object_id' => $account->athlete_id,
        'owner_id' => $account->athlete_id, 'updates' => ['authorized' => 'false'],
    ]);

    expect($account->fresh())->toBeNull();
});

test('the import job stores runs with their kilometre splits once', function () {
    $account = StravaAccount::factory()->create();
    Http::fake(['www.strava.com/api/v3/activities/777' => Http::response([
        'id' => 777, 'name' => 'Morning Run', 'sport_type' => 'TrailRun', 'start_date' => '2026-10-20T07:00:00Z',
        'distance' => 2000.4, 'moving_time' => 600, 'elapsed_time' => 630, 'total_elevation_gain' => 35.6,
        'average_heartrate' => 151.4, 'max_heartrate' => 172,
        'splits_metric' => [
            ['split' => 1, 'distance' => 1000, 'moving_time' => 295, 'elapsed_time' => 300],
            ['split' => 2, 'distance' => 1000.4, 'moving_time' => 305, 'elapsed_time' => 330],
        ],
    ])]);

    ImportStravaActivity::dispatchSync($account, 777);
    ImportStravaActivity::dispatchSync($account, 777);

    $activity = $account->user->activities()->with('splits')->sole();

    expect($activity->type)->toBe(ActivityType::TrailRun)
        ->and($activity->distance_m)->toBe(2000)
        ->and($activity->moving_seconds)->toBe(600)
        ->and($activity->avg_hr)->toBe(151)
        ->and($activity->splits->pluck('duration_seconds')->all())->toBe([295, 305]);
});

test('non running strava activities are skipped', function () {
    $account = StravaAccount::factory()->create();
    Http::fake(['www.strava.com/api/v3/activities/*' => Http::response([
        'id' => 1, 'sport_type' => 'Ride', 'start_date' => '2026-10-20T07:00:00Z', 'distance' => 30000, 'elapsed_time' => 3600,
    ])]);

    ImportStravaActivity::dispatchSync($account, 1);

    expect($account->user->activities()->count())->toBe(0);
});

test('expired tokens are refreshed before calling the api', function () {
    $account = StravaAccount::factory()->create(['expires_at' => now()->subHour()]);
    Http::fake([
        'www.strava.com/oauth/token' => Http::response(['access_token' => 'new-access', 'refresh_token' => 'new-refresh', 'expires_at' => now()->addHours(6)->timestamp]),
        'www.strava.com/api/v3/activities/*' => Http::response(['id' => 1, 'sport_type' => 'Ride', 'start_date' => '2026-10-20T07:00:00Z']),
    ]);

    ImportStravaActivity::dispatchSync($account, 1);

    expect($account->fresh()->access_token)->toBe('new-access');
    Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer new-access'));
});

test('the oauth callback rejects a mismatched state', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['strava_state' => 'expected'])
        ->get(route('integrations.strava.callback', ['state' => 'forged', 'code' => 'x', 'scope' => 'read,activity:read_all']))
        ->assertRedirect(route('integrations.index'));

    expect($user->stravaAccount)->toBeNull();
});

test('the oauth callback stores the connection', function () {
    $user = User::factory()->create();
    Http::fake(['www.strava.com/oauth/token' => Http::response([
        'access_token' => 'a', 'refresh_token' => 'r', 'expires_at' => now()->addHours(6)->timestamp, 'athlete' => ['id' => 4242, 'firstname' => 'Lucía', 'lastname' => 'Martín'],
    ])]);

    $this->actingAs($user)
        ->withSession(['strava_state' => 'expected'])
        ->get(route('integrations.strava.callback', ['state' => 'expected', 'code' => 'x', 'scope' => 'read,activity:read_all']))
        ->assertRedirect(route('integrations.index'));

    expect($user->stravaAccount)
        ->athlete_id->toBe(4242)
        ->athlete_name->toBe('Lucía Martín');
});
