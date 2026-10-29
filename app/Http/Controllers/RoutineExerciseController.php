<?php

namespace App\Http\Controllers;

use App\Enums\TrackingType;
use App\Http\Requests\RoutineExerciseRequest;
use App\Models\Exercise;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Services\Progression\ProgressionSuggester;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RoutineExerciseController extends Controller
{
    /**
     * Add an exercise to the routine, prefilling targets from the user's history when none are given.
     */
    public function store(RoutineExerciseRequest $request, Routine $routine, ProgressionSuggester $suggester): RedirectResponse
    {
        $this->authorize('update', $routine);

        $exercise = Exercise::query()->findOrFail($request->integer('exercise_id'));
        $this->authorize('view', $exercise);

        $suggestion = $suggester->suggest($request->user(), $exercise);
        $usesReps = in_array($exercise->tracking_type, [TrackingType::WeightReps, TrackingType::Reps], true);

        $routine->routineExercises()->create([
            'exercise_id' => $exercise->id,
            'position' => (int) $routine->routineExercises()->max('position') + 1,
            'target_sets' => $request->input('target_sets', $suggestion->sets),
            'target_reps_min' => $request->input('target_reps_min', $usesReps ? ($suggestion->repsMin ?? $suggestion->reps) : null),
            'target_reps_max' => $request->input('target_reps_max', $usesReps ? ($suggestion->repsMax ?? $suggestion->reps) : null),
            'target_weight_kg' => $request->input('target_weight_kg', $suggestion->weightKg),
            'target_seconds' => $request->input('target_seconds', $suggestion->durationSeconds),
            'target_distance_m' => $request->input('target_distance_m', $suggestion->distanceM),
            'rest_seconds' => $request->input('rest_seconds', 90),
            'notes' => $request->input('notes'),
        ]);

        $routine->touch();

        Inertia::flash('toast', ['type' => 'success', 'message' => $suggestion->hasHistory()
            ? $exercise->name.' añadido. '.$suggestion->message
            : $exercise->name.' añadido a la rutina.']);

        return back();
    }

    public function update(RoutineExerciseRequest $request, Routine $routine, RoutineExercise $routineExercise): RedirectResponse
    {
        $this->authorize('update', $routine);
        abort_unless($routineExercise->routine_id === $routine->id, 404);

        $routineExercise->update($request->validated());
        $routine->touch();

        return back();
    }

    public function destroy(Routine $routine, RoutineExercise $routineExercise): RedirectResponse
    {
        $this->authorize('update', $routine);
        abort_unless($routineExercise->routine_id === $routine->id, 404);

        $routineExercise->delete();
        $routine->touch();

        return back();
    }

    /**
     * Persist a new order for the routine's exercises.
     */
    public function reorder(Request $request, Routine $routine): RedirectResponse
    {
        $this->authorize('update', $routine);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        DB::transaction(function () use ($routine, $ids): void {
            foreach (array_values($ids) as $position => $id) {
                $routine->routineExercises()->whereKey($id)->update(['position' => $position + 1]);
            }
        });

        $routine->touch();

        return back();
    }
}
