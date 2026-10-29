<?php

namespace App\Http\Controllers;

use App\Http\Resources\ExerciseResource;
use App\Http\Resources\RoutineExerciseResource;
use App\Http\Resources\RoutineResource;
use App\Http\Resources\WorkoutSessionResource;
use App\Models\Exercise;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Models\WorkoutSession;
use App\Services\Progression\ProgressionSuggester;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WorkoutSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $sessions = $request->user()->workoutSessions()
            ->with(['routine:id,name', 'sets'])
            ->withCount('sets')
            ->latest('started_at')
            ->paginate(20)
            ->through(fn (WorkoutSession $session) => WorkoutSessionResource::make($session)->resolve($request));

        return Inertia::render('workouts/index', [
            'sessions' => $sessions,
            'routines' => RoutineResource::collection($request->user()->routines()->withCount('routineExercises')->orderBy('name')->get())->resolve($request),
        ]);
    }

    /**
     * Start a workout, optionally based on one of the user's routines.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'routine_id' => ['nullable', 'integer'],
            'name' => ['nullable', 'string', 'max:120'],
        ]);

        $routine = isset($validated['routine_id']) ? Routine::query()->whereKey($validated['routine_id'])->firstOrFail() : null;

        if ($routine) {
            $this->authorize('view', $routine);
        }

        $session = $request->user()->workoutSessions()->create([
            'routine_id' => $routine?->id,
            'name' => $validated['name'] ?? $routine?->name,
            'started_at' => now(),
        ]);

        return to_route('workouts.show', $session);
    }

    public function show(Request $request, WorkoutSession $workout, ProgressionSuggester $suggester): Response
    {
        $this->authorize('view', $workout);

        $workout->load(['sets', 'routine.routineExercises.exercise.muscleGroups']);

        $routineExercises = $workout->routine->routineExercises ?? collect();
        $loggedExerciseIds = $workout->sets->pluck('exercise_id')->unique();
        $extraExercises = Exercise::query()
            ->with('muscleGroups')
            ->whereIn('id', $loggedExerciseIds->diff($routineExercises->pluck('exercise_id')))
            ->get();

        $entries = $routineExercises
            ->map(fn (RoutineExercise $routineExercise) => [$routineExercise->exercise, $routineExercise])
            ->concat($extraExercises->map(fn (Exercise $exercise) => [$exercise, null]))
            ->map(fn (array $entry) => [
                'exercise' => ExerciseResource::make($entry[0])->resolve($request),
                'target' => $entry[1] ? RoutineExerciseResource::make($entry[1])->resolve($request) : null,
                'suggestion' => $suggester->suggest($request->user(), $entry[0], $entry[1], $workout->id)->toArray(),
            ])
            ->values();

        return Inertia::render('workouts/show', [
            'session' => WorkoutSessionResource::make($workout)->resolve($request),
            'entries' => $entries,
        ]);
    }

    public function update(Request $request, WorkoutSession $workout): RedirectResponse
    {
        $this->authorize('update', $workout);

        $workout->update($request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]));

        return back();
    }

    public function finish(WorkoutSession $workout): RedirectResponse
    {
        $this->authorize('update', $workout);

        $workout->update(['finished_at' => $workout->finished_at ?? now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => '¡Entrenamiento completado! 💪']);

        return back();
    }

    public function destroy(WorkoutSession $workout): RedirectResponse
    {
        $this->authorize('delete', $workout);

        $workout->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Entrenamiento eliminado.']);

        return to_route('workouts.index');
    }

    public function share(WorkoutSession $workout): RedirectResponse
    {
        $this->authorize('update', $workout);

        $workout->forceFill(['share_token' => $workout->share_token ?? Str::lower((string) Str::ulid())])->save();

        return back();
    }
}
