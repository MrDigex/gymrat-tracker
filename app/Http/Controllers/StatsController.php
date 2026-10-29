<?php

namespace App\Http\Controllers;

use App\Enums\BodyZone;
use App\Models\Exercise;
use App\Services\StatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class StatsController extends Controller
{
    public function __invoke(Request $request, StatsService $stats): Response
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'zone' => ['nullable', 'string'],
            'exercise' => ['nullable', 'integer'],
        ]);

        $user = $request->user();
        $from = Date::parse($filters['from'] ?? now()->subWeeks(11)->startOfWeek())->startOfDay();
        $to = Date::parse($filters['to'] ?? now())->endOfDay();
        $zone = BodyZone::tryFrom($filters['zone'] ?? '');

        $loggedExercises = $stats->loggedExercises($user);
        $exerciseId = $filters['exercise'] ?? ($loggedExercises[0]['id'] ?? null);
        $exercise = $exerciseId ? Exercise::query()->visibleTo($user)->whereKey($exerciseId)->first() : null;

        return Inertia::render('stats/index', [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'zone' => $zone?->value,
                'exercise' => $exercise?->id,
            ],
            'zones' => collect(BodyZone::cases())->map(fn (BodyZone $case) => ['value' => $case->value, 'label' => $case->label()]),
            'loggedExercises' => $loggedExercises,
            'weeklyVolume' => $stats->weeklyVolumeByZone($user, $from, $to, $zone),
            'muscleDistribution' => $stats->muscleDistribution($user, $from, $to, $zone),
            'exerciseProgress' => $exercise ? [
                'exercise' => ['id' => $exercise->id, 'name' => $exercise->name, 'tracking_type' => $exercise->tracking_type->value],
                'points' => $stats->exerciseProgress($user, $exercise, $from, $to),
            ] : null,
            'personalRecords' => $stats->personalRecords($user, 20),
            'weeklyRunning' => $stats->weeklyRunning($user, $from, $to),
            'runningRecords' => $stats->runningRecords($user),
            'hyroxBests' => $stats->hyroxBests($user),
        ]);
    }
}
