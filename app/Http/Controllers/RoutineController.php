<?php

namespace App\Http\Controllers;

use App\Http\Resources\RoutineResource;
use App\Http\Resources\WorkoutSessionResource;
use App\Models\Routine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RoutineController extends Controller
{
    public function index(Request $request): Response
    {
        $routines = $request->user()->routines()
            ->withCount('routineExercises')
            ->withMax('workoutSessions', 'started_at')
            ->with('routineExercises.exercise')
            ->latest('updated_at')
            ->get();

        return Inertia::render('routines/index', [
            'routines' => RoutineResource::collection($routines)->resolve($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], attributes: ['name' => 'nombre', 'description' => 'descripción']);

        $routine = $request->user()->routines()->create($validated);

        return to_route('routines.show', $routine);
    }

    public function show(Request $request, Routine $routine): Response
    {
        $this->authorize('view', $routine);

        $routine->load('routineExercises.exercise.muscleGroups');

        return Inertia::render('routines/show', [
            'routine' => RoutineResource::make($routine)->resolve($request),
            'recentSessions' => WorkoutSessionResource::collection(
                $routine->workoutSessions()->withCount('sets')->latest('started_at')->limit(5)->get()
            )->resolve($request),
        ]);
    }

    public function update(Request $request, Routine $routine): RedirectResponse
    {
        $this->authorize('update', $routine);

        $routine->update($request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], attributes: ['name' => 'nombre', 'description' => 'descripción']));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Rutina actualizada.']);

        return back();
    }

    public function destroy(Routine $routine): RedirectResponse
    {
        $this->authorize('delete', $routine);

        $routine->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Rutina eliminada.']);

        return to_route('routines.index');
    }

    /**
     * Make the routine publicly viewable through its share link.
     */
    public function share(Routine $routine): RedirectResponse
    {
        $this->authorize('update', $routine);

        $routine->forceFill([
            'share_token' => $routine->share_token ?? Str::lower((string) Str::ulid()),
            'is_public' => true,
        ])->save();

        return back();
    }

    public function unshare(Routine $routine): RedirectResponse
    {
        $this->authorize('update', $routine);

        $routine->forceFill(['is_public' => false])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'La rutina ya no es pública.']);

        return back();
    }
}
