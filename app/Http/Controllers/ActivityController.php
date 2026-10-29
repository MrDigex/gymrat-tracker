<?php

namespace App\Http\Controllers;

use App\Actions\SaveActivity;
use App\Enums\ActivitySource;
use App\Enums\ActivityType;
use App\Http\Requests\ActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Services\StatsService;
use Database\Seeders\HyroxExerciseSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function index(Request $request, StatsService $stats): Response
    {
        $activities = $request->user()->activities()
            ->with('splits')
            ->withCount('splits')
            ->latest('started_at')
            ->paginate(20)
            ->through(fn (Activity $activity) => ActivityResource::make($activity)->resolve($request));

        return Inertia::render('activities/index', [
            'activities' => $activities,
            'personalRecords' => $stats->runningRecords($request->user()),
            'hasStrava' => $request->user()->stravaAccount()->exists(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('activities/create', $this->formOptions());
    }

    public function store(ActivityRequest $request, SaveActivity $saveActivity): RedirectResponse
    {
        $activity = $saveActivity->handle(
            $request->user(),
            [...$request->safe()->except('splits'), 'source' => ActivitySource::Manual],
            $request->validated('splits') ?? [],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Carrera guardada.']);

        return to_route('activities.show', $activity);
    }

    public function show(Request $request, Activity $activity): Response
    {
        $this->authorize('view', $activity);

        return Inertia::render('activities/show', [
            'activity' => ActivityResource::make($activity->load('splits'))->resolve($request),
        ]);
    }

    public function edit(Request $request, Activity $activity): Response
    {
        $this->authorize('update', $activity);

        return Inertia::render('activities/edit', [
            'activity' => ActivityResource::make($activity->load('splits'))->resolve($request),
            ...$this->formOptions(),
        ]);
    }

    public function update(ActivityRequest $request, Activity $activity, SaveActivity $saveActivity): RedirectResponse
    {
        $this->authorize('update', $activity);

        $saveActivity->handle($request->user(), $request->safe()->except('splits'), $request->validated('splits') ?? [], $activity);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Carrera actualizada.']);

        return to_route('activities.show', $activity);
    }

    public function destroy(Activity $activity): RedirectResponse
    {
        $this->authorize('delete', $activity);

        $activity->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Carrera eliminada.']);

        return to_route('activities.index');
    }

    public function share(Activity $activity): RedirectResponse
    {
        $this->authorize('update', $activity);

        $activity->forceFill(['share_token' => $activity->share_token ?? Str::lower((string) Str::ulid())])->save();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        $hyroxSplits = collect(HyroxExerciseSeeder::STATIONS)
            ->reject(fn (array $station) => $station['id'] === 'hyrox-run-1km')
            ->values()
            ->flatMap(fn (array $station, int $index) => [
                ['label' => 'Carrera '.($index + 1), 'distance_m' => 1000],
                ['label' => $station['name'], 'distance_m' => $station['distance_m']],
            ]);

        return [
            'types' => collect(ActivityType::cases())->map(fn (ActivityType $type) => ['value' => $type->value, 'label' => $type->label()]),
            'hyroxSplits' => $hyroxSplits,
        ];
    }
}
