<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('changing the password records when it happened', function () {
    $user = User::factory()->create(['password_changed_at' => null]);
    $this->travelTo(now()->setTime(10, 0));

    $this->actingAs($user)
        ->from(route('security.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->password_changed_at->equalTo(now()))->toBeTrue();
});

test('saving the user without a new password keeps the date', function () {
    $user = User::factory()->create();
    $changedAt = $user->password_changed_at;

    $this->travel(1)->days();
    $user->update(['name' => 'Otro nombre']);

    expect($user->fresh()->password_changed_at->equalTo($changedAt))->toBeTrue();
});

test('the security page shows when the password was changed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->get(route('security.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('passwordChangedAt', $user->password_changed_at->toIso8601String()));
});

test('the profile page includes a security summary', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('security.password_changed_at', $user->password_changed_at->toIso8601String())
            ->where('security.two_factor_enabled', false)
            ->where('security.passkeys_count', 0));
});
