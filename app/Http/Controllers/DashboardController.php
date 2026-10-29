<?php

namespace App\Http\Controllers;

use App\Models\MotivationalQuote;
use App\Services\StatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, StatsService $stats): Response
    {
        $user = $request->user();
        $from = now()->subWeeks(7)->startOfWeek();
        $quote = MotivationalQuote::forDay($user->id, $request->integer('frase'));

        return Inertia::render('dashboard', [
            'quote' => $quote?->only(['text', 'author']),
            'quoteOffset' => $request->integer('frase'),
            'kpis' => $stats->kpis($user),
            'weeklyVolume' => Inertia::defer(fn () => $stats->weeklyVolumeByZone($user, $from, now())),
            'muscleDistribution' => Inertia::defer(fn () => $stats->muscleDistribution($user, now()->subDays(30), now())),
            'weeklyRunning' => Inertia::defer(fn () => $stats->weeklyRunning($user, $from, now())),
            'personalRecords' => Inertia::defer(fn () => $stats->personalRecords($user, 6)),
            'recentWorkouts' => $stats->recentWorkouts($user),
            'routinesCount' => $user->routines()->count(),
        ]);
    }
}
