<?php

use App\Enums\ActivitySource;
use App\Models\Activity;
use App\Models\User;
use App\Services\StatsService;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('users can register a race with splits', function () {
    $this->actingAs($this->user)
        ->post(route('activities.store'), [
            'type' => 'carrera',
            'name' => '10K San Silvestre',
            'started_at' => now()->subDay()->toDateTimeString(),
            'distance_m' => 10000,
            'duration_seconds' => 3000,
            'splits' => [
                ['label' => 'Km 1', 'distance_m' => 1000, 'duration_seconds' => 290],
                ['label' => 'Km 2', 'distance_m' => 1000, 'duration_seconds' => 310],
            ],
        ])
        ->assertRedirect();

    $activity = $this->user->activities()->with('splits')->firstOrFail();

    expect($activity->source)->toBe(ActivitySource::Manual)
        ->and($activity->pace_seconds_per_km)->toBe(300)
        ->and(Activity::formatPace($activity->pace_seconds_per_km))->toBe('5:00 /km')
        ->and($activity->splits->pluck('label')->all())->toBe(['Km 1', 'Km 2']);
});

test('races cannot be in the future', function () {
    $this->actingAs($this->user)
        ->post(route('activities.store'), [
            'type' => 'carrera', 'name' => 'Futuro', 'started_at' => now()->addDay()->toDateTimeString(),
            'distance_m' => 5000, 'duration_seconds' => 1500,
        ])
        ->assertSessionHasErrors('started_at');
});

test('users cannot see or change other users races', function () {
    $activity = Activity::factory()->create();

    $this->actingAs($this->user)->get(route('activities.show', $activity))->assertForbidden();
    $this->actingAs($this->user)->delete(route('activities.destroy', $activity))->assertForbidden();
    $this->actingAs($this->user)->post(route('activities.share', $activity))->assertForbidden();
});

test('running records pick the fastest race close to each distance', function () {
    Activity::factory()->for($this->user)->create(['distance_m' => 5000, 'duration_seconds' => 1500]);
    Activity::factory()->for($this->user)->create(['distance_m' => 5050, 'duration_seconds' => 1400, 'moving_seconds' => null]);
    Activity::factory()->for($this->user)->create(['distance_m' => 8000, 'duration_seconds' => 2000]);

    $records = collect(app(StatsService::class)->runningRecords($this->user))->keyBy('label');

    expect($records['5K']['duration_label'])->toBe('23:05')
        ->and($records['10K']['duration_seconds'])->toBeNull();
});

test('the streak counts consecutive days ending yesterday or today', function () {
    Activity::factory()->for($this->user)->create(['started_at' => now()->subDay()]);
    Activity::factory()->for($this->user)->create(['started_at' => now()->subDays(2)]);
    Activity::factory()->for($this->user)->create(['started_at' => now()->subDays(4)]);

    expect(app(StatsService::class)->streak($this->user))->toBe(2);
});
