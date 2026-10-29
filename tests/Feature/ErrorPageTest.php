<?php

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['app.debug' => false]);
});

test('a missing page renders the branded error page', function () {
    $this->get('/esta-pagina-no-existe')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page
            ->component('errors/error')
            ->where('status', 404)
        );
});

test('a server error renders the branded error page when not debugging', function () {
    Route::middleware('web')->get('/_test/boom', fn () => throw new RuntimeException('Boom'));

    $this->get('/_test/boom')
        ->assertInternalServerError()
        ->assertInertia(fn (Assert $page) => $page
            ->component('errors/error')
            ->where('status', 500)
        );
});

test('json requests keep the json error response', function () {
    $this->getJson('/esta-pagina-no-existe')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});
