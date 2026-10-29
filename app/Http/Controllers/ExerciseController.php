<?php

namespace App\Http\Controllers;

use App\Enums\BodyZone;
use App\Enums\ExerciseCategory;
use App\Enums\ExerciseSource;
use App\Enums\TrackingType;
use App\Http\Requests\ExerciseRequest;
use App\Http\Resources\ExerciseResource;
use App\Http\Resources\MuscleGroupResource;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\RoutineExercise;
use App\Models\WorkoutSet;
use App\Services\Progression\ProgressionSuggester;
use App\Support\ExerciseTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ExerciseController extends Controller
{
    /**
     * Searchable exercise library.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'zone' => ['nullable', 'string'],
            'muscle' => ['nullable', 'integer'],
            'category' => ['nullable', 'string'],
            'equipment' => ['nullable', 'string'],
            'mine' => ['nullable', 'boolean'],
        ]);

        $exercises = $this->filteredQuery($request, $filters)
            ->with('muscleGroups')
            ->orderByRaw('case when category = ? then 0 else 1 end', [ExerciseCategory::Hyrox->value])
            ->orderBy('name')
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Exercise $exercise) => ExerciseResource::make($exercise)->resolve($request));

        return Inertia::render('exercises/index', [
            'exercises' => $exercises,
            'filters' => (object) $filters,
            ...$this->formOptions(),
        ]);
    }

    /**
     * JSON search used by the exercise picker dialog.
     */
    public function search(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string'],
            'zone' => ['nullable', 'string'],
        ]);

        $exercises = $this->filteredQuery($request, $filters)
            ->with('muscleGroups')
            ->orderBy('name')
            ->limit(30)
            ->get();

        return response()->json(ExerciseResource::collection($exercises)->resolve($request));
    }

    public function create(): Response
    {
        return Inertia::render('exercises/create', $this->formOptions());
    }

    public function store(ExerciseRequest $request): RedirectResponse
    {
        $exercise = $request->user()->exercises()->create([
            ...$this->attributesFrom($request),
            'slug' => Exercise::uniqueSlug($request->string('name')),
            'source' => ExerciseSource::User,
        ]);

        $this->syncMuscles($exercise, $request);
        $this->storeImage($exercise, $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ejercicio creado.']);

        return to_route('exercises.show', $exercise);
    }

    public function show(Request $request, Exercise $exercise, ProgressionSuggester $suggester): Response
    {
        $this->authorize('view', $exercise);

        $exercise->load('muscleGroups');

        return Inertia::render('exercises/show', [
            'exercise' => ExerciseResource::make($exercise)->resolve($request),
            'history' => $this->history($request, $exercise),
            'suggestion' => $suggester->suggest($request->user(), $exercise)->toArray(),
        ]);
    }

    public function edit(Request $request, Exercise $exercise): Response
    {
        $this->authorize('update', $exercise);

        $exercise->load('muscleGroups');

        return Inertia::render('exercises/edit', [
            'exercise' => ExerciseResource::make($exercise)->resolve($request),
            'values' => [
                'equipment' => $exercise->equipment,
                'level' => $exercise->level,
                'mechanic' => $exercise->mechanic,
            ],
            ...$this->formOptions(),
        ]);
    }

    public function update(ExerciseRequest $request, Exercise $exercise): RedirectResponse
    {
        $this->authorize('update', $exercise);

        $exercise->update($this->attributesFrom($request));
        $this->syncMuscles($exercise, $request);
        $this->storeImage($exercise, $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ejercicio actualizado.']);

        return to_route('exercises.show', $exercise);
    }

    public function destroy(Exercise $exercise): RedirectResponse
    {
        $this->authorize('delete', $exercise);

        if ($exercise->image_path && ! str_starts_with($exercise->image_path, '/')) {
            Storage::disk('public')->delete($exercise->image_path);
        }

        $exercise->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ejercicio eliminado.']);

        return to_route('exercises.index');
    }

    /**
     * Progression suggestion for the next time the exercise is performed.
     */
    public function suggestion(Request $request, Exercise $exercise, ProgressionSuggester $suggester): JsonResponse
    {
        $this->authorize('view', $exercise);

        $target = $request->integer('routine_exercise')
            ? RoutineExercise::query()
                ->whereKey($request->integer('routine_exercise'))
                ->whereHas('routine', fn (Builder $query) => $query->whereBelongsTo($request->user()))
                ->first()
            : null;

        return response()->json(
            $suggester->suggest($request->user(), $exercise, $target, $request->integer('exclude_session') ?: null)->toArray()
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<Exercise>
     */
    private function filteredQuery(Request $request, array $filters): Builder
    {
        $zone = BodyZone::tryFrom($filters['zone'] ?? '');

        return Exercise::query()
            ->visibleTo($request->user())
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when(ExerciseCategory::tryFrom($filters['category'] ?? ''), fn (Builder $query, ExerciseCategory $category) => $query->where('category', $category))
            ->when($filters['equipment'] ?? null, fn (Builder $query, string $equipment) => $query->where('equipment', $equipment))
            ->when($filters['mine'] ?? false, fn (Builder $query) => $query->whereBelongsTo($request->user()))
            ->when($filters['muscle'] ?? null, fn (Builder $query, int $muscle) => $query->whereHas(
                'muscleGroups', fn (Builder $query) => $query->whereKey($muscle)->where('is_primary', true)
            ))
            ->when($zone, fn (Builder $query, BodyZone $zone) => $query->whereHas(
                'muscleGroups', fn (Builder $query) => $query->where('body_zone', $zone)->where('is_primary', true)
            ));
    }

    /**
     * Options shared by the library filters and the exercise form.
     *
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        $options = fn (array $labels) => collect($labels)->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])->values();

        return [
            'muscleGroups' => MuscleGroupResource::collection(MuscleGroup::query()->orderBy('name')->get())->resolve(),
            'categories' => collect(ExerciseCategory::cases())->map(fn (ExerciseCategory $case) => ['value' => $case->value, 'label' => $case->label()]),
            'trackingTypes' => collect(TrackingType::cases())->map(fn (TrackingType $case) => ['value' => $case->value, 'label' => $case->label()]),
            'zones' => collect(BodyZone::cases())->map(fn (BodyZone $case) => ['value' => $case->value, 'label' => $case->label()]),
            'equipment' => $options(ExerciseTranslations::EQUIPMENT),
            'levels' => $options(ExerciseTranslations::LEVELS),
            'mechanics' => $options(ExerciseTranslations::MECHANICS),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesFrom(ExerciseRequest $request): array
    {
        return [
            ...$request->safe()->only(['name', 'category', 'tracking_type', 'equipment', 'level', 'mechanic']),
            'instructions' => array_values(array_filter($request->input('instructions', []), fn (?string $step) => filled($step))),
        ];
    }

    private function syncMuscles(Exercise $exercise, ExerciseRequest $request): void
    {
        $primary = $request->collect('primary_muscles')->mapWithKeys(fn (int|string $id) => [(int) $id => ['is_primary' => true]]);
        $secondary = $request->collect('secondary_muscles')->mapWithKeys(fn (int|string $id) => [(int) $id => ['is_primary' => false]]);

        $exercise->muscleGroups()->sync($primary->union($secondary)->all());
    }

    private function storeImage(Exercise $exercise, ExerciseRequest $request): void
    {
        if (! $request->hasFile('image')) {
            return;
        }

        if ($exercise->image_path && ! str_starts_with($exercise->image_path, '/')) {
            Storage::disk('public')->delete($exercise->image_path);
        }

        $exercise->update(['image_path' => $request->file('image')->store('exercises/user/'.$exercise->user_id, 'public')]);
    }

    /**
     * Per-session best set for the progress chart and the recent sets table.
     *
     * @return list<array<string, mixed>>
     */
    private function history(Request $request, Exercise $exercise): array
    {
        return array_values(WorkoutSet::query()
            ->with('workoutSession:id,started_at')
            ->where('exercise_id', $exercise->id)
            ->where('is_warmup', false)
            ->whereHas('workoutSession', fn (Builder $query) => $query->whereBelongsTo($request->user()))
            ->get()
            ->groupBy('workout_session_id')
            ->map(fn ($sets) => [
                'date' => $sets->first()->workoutSession->started_at->toDateString(),
                'session_id' => $sets->first()->workout_session_id,
                'sets' => $sets->count(),
                'max_weight_kg' => $sets->max('weight_kg'),
                'max_reps' => $sets->max('reps'),
                'total_reps' => $sets->sum('reps'),
                'volume_kg' => round($sets->sum(fn (WorkoutSet $set) => ($set->weight_kg ?? 0) * ($set->reps ?? 0)), 1),
                'estimated_1rm' => $sets->map(fn (WorkoutSet $set) => $set->estimatedOneRepMax())->max(),
                'best_duration_seconds' => $sets->max('duration_seconds'),
                'best_distance_m' => $sets->max('distance_m'),
            ])
            ->sortBy('date')
            ->all());
    }
}
