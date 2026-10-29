<?php

namespace App\Http\Controllers;

use App\Enums\TrackingType;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ExerciseResource;
use App\Http\Resources\RoutineResource;
use App\Http\Resources\WorkoutSessionResource;
use App\Models\Activity;
use App\Models\Exercise;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Models\WorkoutSession;
use App\Services\OgImageGenerator;
use App\Services\Progression\ProgressionSuggester;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * Public, read-only pages for routines, workouts and races shared on social media.
 */
class ShareController extends Controller
{
    public function routine(Request $request, string $token): Response
    {
        $routine = $this->findRoutine($token)->load('routineExercises.exercise.muscleGroups', 'user:id,name');

        return $this->renderShare('share/routine', [
            'routine' => RoutineResource::make($routine)->resolve($request),
            'author' => $routine->user->name,
        ], $routine->name, 'Rutina de '.$routine->user->name.' · '.$routine->routineExercises->count().' ejercicios', route('share.routine.image', $token));
    }

    public function routineImage(string $token, OgImageGenerator $generator): HttpResponse
    {
        $routine = $this->findRoutine($token)->load('routineExercises.exercise', 'user:id,name');

        return $this->png($generator->render(
            'routine-'.$routine->id.'-'.$routine->updated_at?->timestamp,
            'Rutina',
            $routine->name,
            $routine->routineExercises->map(fn (RoutineExercise $item) => $item->exercise->name.' · '.$this->targetLabel($item))->all(),
            $routine->user->name.' · '.config('app.name'),
        ));
    }

    public function workout(Request $request, string $token): Response
    {
        $workout = WorkoutSession::query()->where('share_token', $token)->with(['sets', 'user:id,name', 'routine:id,name'])->firstOrFail();
        $exercises = Exercise::query()->whereIn('id', $workout->sets->pluck('exercise_id'))->get();

        return $this->renderShare('share/workout', [
            'session' => WorkoutSessionResource::make($workout)->resolve($request),
            'exercises' => ExerciseResource::collection($exercises)->resolve($request),
            'author' => $workout->user->name,
        ], ($workout->name ?? 'Entrenamiento').' · '.$workout->started_at->locale('es')->isoFormat('D MMM YYYY'), 'Entrenamiento de '.$workout->user->name, route('share.workout.image', $token));
    }

    public function workoutImage(string $token, OgImageGenerator $generator): HttpResponse
    {
        $workout = WorkoutSession::query()->where('share_token', $token)->with(['sets.exercise', 'user:id,name'])->firstOrFail();

        $lines = $workout->sets->where('is_warmup', false)->groupBy('exercise_id')
            ->map(fn (Collection $sets) => $sets->first()->exercise->name.' · '.$sets->count().' series'.($sets->max('weight_kg') ? ' · '.ProgressionSuggester::formatKg((float) $sets->max('weight_kg')) : ''))
            ->values()->all();

        return $this->png($generator->render(
            'workout-'.$workout->id.'-'.$workout->updated_at?->timestamp,
            'Entrenamiento',
            $workout->name ?? 'Entrenamiento',
            $lines,
            $workout->user->name.' · '.$workout->started_at->locale('es')->isoFormat('D MMM YYYY'),
        ));
    }

    public function activity(Request $request, string $token): Response
    {
        $activity = Activity::query()->where('share_token', $token)->with(['splits', 'user:id,name'])->firstOrFail();

        return $this->renderShare('share/activity', [
            'activity' => ActivityResource::make($activity)->resolve($request),
            'author' => $activity->user->name,
        ], $activity->name, sprintf('%s km en %s (%s)', number_format($activity->distance_m / 1000, 2, ',', '.'), Activity::formatDuration($activity->duration_seconds), Activity::formatPace($activity->pace_seconds_per_km)), route('share.activity.image', $token));
    }

    public function activityImage(string $token, OgImageGenerator $generator): HttpResponse
    {
        $activity = Activity::query()->where('share_token', $token)->with('user:id,name')->firstOrFail();

        return $this->png($generator->render(
            'activity-'.$activity->id.'-'.$activity->updated_at?->timestamp,
            $activity->type->label(),
            $activity->name,
            array_values(array_filter([
                'Distancia: '.number_format($activity->distance_m / 1000, 2, ',', '.').' km',
                'Tiempo: '.Activity::formatDuration($activity->duration_seconds),
                'Ritmo: '.Activity::formatPace($activity->pace_seconds_per_km),
                $activity->avg_hr ? 'FC media: '.$activity->avg_hr.' ppm' : null,
            ])),
            $activity->user->name.' · '.$activity->started_at->locale('es')->isoFormat('D MMM YYYY'),
        ));
    }

    private function findRoutine(string $token): Routine
    {
        return Routine::query()->where('share_token', $token)->where('is_public', true)->firstOrFail();
    }

    /**
     * Render a public page with Open Graph tags available to crawlers in the initial HTML.
     *
     * @param  array<string, mixed>  $props
     */
    private function renderShare(string $component, array $props, string $title, string $description, string $imageUrl): Response
    {
        View::share('openGraph', [
            'title' => $title,
            'description' => $description,
            'image' => $imageUrl,
            'url' => request()->url(),
        ]);

        return Inertia::render($component, [...$props, 'shareUrl' => request()->url()]);
    }

    private function targetLabel(RoutineExercise $item): string
    {
        return match ($item->exercise->tracking_type) {
            TrackingType::Time => $item->target_sets.' × '.($item->target_seconds ?? 30).' s',
            TrackingType::DistanceTime => ($item->target_distance_m ?? 0).' m',
            default => $item->target_sets.' × '.collect([$item->target_reps_min, $item->target_reps_max])->filter()->unique()->implode('-')
                .($item->target_weight_kg ? ' · '.ProgressionSuggester::formatKg($item->target_weight_kg) : ''),
        };
    }

    private function png(string $contents): HttpResponse
    {
        return response($contents, 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
