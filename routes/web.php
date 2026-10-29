<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\RoutineController;
use App\Http\Controllers\RoutineExerciseController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\StravaController;
use App\Http\Controllers\StravaWebhookController;
use App\Http\Controllers\WorkoutSessionController;
use App\Http\Controllers\WorkoutSetController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('estadisticas', StatsController::class)->name('stats.index');

    Route::get('ejercicios/buscar', [ExerciseController::class, 'search'])->name('exercises.search');
    Route::get('ejercicios/crear', [ExerciseController::class, 'create'])->name('exercises.create');
    Route::get('ejercicios/{exercise}/sugerencia', [ExerciseController::class, 'suggestion'])->name('exercises.suggestion');
    Route::resource('ejercicios', ExerciseController::class)
        ->names('exercises')
        ->parameters(['ejercicios' => 'exercise'])
        ->except(['create', 'edit']);
    Route::get('ejercicios/{exercise}/editar', [ExerciseController::class, 'edit'])->name('exercises.edit');

    Route::resource('rutinas', RoutineController::class)
        ->names('routines')
        ->parameters(['rutinas' => 'routine'])
        ->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::post('rutinas/{routine}/compartir', [RoutineController::class, 'share'])->name('routines.share');
    Route::delete('rutinas/{routine}/compartir', [RoutineController::class, 'unshare'])->name('routines.unshare');
    Route::post('rutinas/{routine}/ejercicios', [RoutineExerciseController::class, 'store'])->name('routines.exercises.store');
    Route::put('rutinas/{routine}/ejercicios/orden', [RoutineExerciseController::class, 'reorder'])->name('routines.exercises.reorder');
    Route::put('rutinas/{routine}/ejercicios/{routineExercise}', [RoutineExerciseController::class, 'update'])->name('routines.exercises.update');
    Route::delete('rutinas/{routine}/ejercicios/{routineExercise}', [RoutineExerciseController::class, 'destroy'])->name('routines.exercises.destroy');

    Route::resource('entrenamientos', WorkoutSessionController::class)
        ->names('workouts')
        ->parameters(['entrenamientos' => 'workout'])
        ->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::post('entrenamientos/{workout}/finalizar', [WorkoutSessionController::class, 'finish'])->name('workouts.finish');
    Route::post('entrenamientos/{workout}/compartir', [WorkoutSessionController::class, 'share'])->name('workouts.share');
    Route::post('entrenamientos/{workout}/series', [WorkoutSetController::class, 'store'])->name('workouts.sets.store');
    Route::put('entrenamientos/{workout}/series/{set}', [WorkoutSetController::class, 'update'])->name('workouts.sets.update');
    Route::delete('entrenamientos/{workout}/series/{set}', [WorkoutSetController::class, 'destroy'])->name('workouts.sets.destroy');

    Route::get('carreras/crear', [ActivityController::class, 'create'])->name('activities.create');
    Route::resource('carreras', ActivityController::class)
        ->names('activities')
        ->parameters(['carreras' => 'activity'])
        ->except(['create', 'edit']);
    Route::get('carreras/{activity}/editar', [ActivityController::class, 'edit'])->name('activities.edit');
    Route::post('carreras/{activity}/compartir', [ActivityController::class, 'share'])->name('activities.share');

    Route::get('integraciones', [IntegrationController::class, 'index'])->name('integrations.index');
    Route::post('integraciones/tokens', [IntegrationController::class, 'storeToken'])->name('integrations.tokens.store');
    Route::delete('integraciones/tokens/{token}', [IntegrationController::class, 'destroyToken'])->name('integrations.tokens.destroy');
    Route::get('integraciones/strava/conectar', [StravaController::class, 'connect'])->name('integrations.strava.connect');
    Route::get('integraciones/strava/callback', [StravaController::class, 'callback'])->name('integrations.strava.callback');
    Route::post('integraciones/strava/importar', [StravaController::class, 'backfill'])->name('integrations.strava.backfill');
    Route::delete('integraciones/strava', [StravaController::class, 'disconnect'])->name('integrations.strava.disconnect');
});

Route::get('r/{token}', [ShareController::class, 'routine'])->name('share.routine');
Route::get('r/{token}/og.png', [ShareController::class, 'routineImage'])->name('share.routine.image');
Route::get('e/{token}', [ShareController::class, 'workout'])->name('share.workout');
Route::get('e/{token}/og.png', [ShareController::class, 'workoutImage'])->name('share.workout.image');
Route::get('c/{token}', [ShareController::class, 'activity'])->name('share.activity');
Route::get('c/{token}/og.png', [ShareController::class, 'activityImage'])->name('share.activity.image');

Route::get('webhooks/strava', [StravaWebhookController::class, 'verify'])->name('webhooks.strava.verify');
Route::post('webhooks/strava', [StravaWebhookController::class, 'handle'])->name('webhooks.strava.handle');

require __DIR__.'/settings.php';
