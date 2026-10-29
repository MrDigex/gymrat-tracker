<?php

use App\Http\Controllers\Api\ActivityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('actividades', [ActivityController::class, 'store'])->name('api.activities.store');
});
