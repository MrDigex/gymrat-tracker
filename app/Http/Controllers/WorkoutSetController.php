<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkoutSetRequest;
use App\Models\Exercise;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Illuminate\Http\RedirectResponse;

class WorkoutSetController extends Controller
{
    public function store(WorkoutSetRequest $request, WorkoutSession $workout): RedirectResponse
    {
        $this->authorize('update', $workout);
        $this->authorize('view', Exercise::query()->findOrFail($request->integer('exercise_id')));

        $workout->sets()->create([
            ...$request->validated(),
            'set_number' => (int) $workout->sets()->where('exercise_id', $request->integer('exercise_id'))->max('set_number') + 1,
        ]);

        return back();
    }

    public function update(WorkoutSetRequest $request, WorkoutSession $workout, WorkoutSet $set): RedirectResponse
    {
        $this->authorize('update', $workout);
        abort_unless($set->workout_session_id === $workout->id, 404);

        $set->update($request->validated());

        return back();
    }

    public function destroy(WorkoutSession $workout, WorkoutSet $set): RedirectResponse
    {
        $this->authorize('update', $workout);
        abort_unless($set->workout_session_id === $workout->id, 404);

        $set->delete();

        return back();
    }
}
