import { Head, router, useForm, useHttp } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    Clock,
    Flag,
    ListChecks,
    Plus,
    StickyNote,
    Target,
    Trash2,
    Trophy,
    Weight,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExerciseImage } from '@/components/exercise-image';
import { ExercisePicker } from '@/components/exercise-picker';
import { NumberStepper } from '@/components/gymrat/number-stepper';
import { RestTimer } from '@/components/gymrat/rest-timer';
import {
    RpePicker,
    SetRow,
    TargetMetBanner,
    WarmupToggle,
} from '@/components/gymrat/set-logger';
import InputError from '@/components/input-error';
import { ShareDialog, StoryCard } from '@/components/share-dialog';
import { SuggestionCallout } from '@/components/gymrat/suggestion-callout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    formatDate,
    formatDuration,
    formatKg,
    formatNumber,
    formatTarget,
    parseDuration,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import exercisesRoutes from '@/routes/exercises';
import workouts from '@/routes/workouts';
import type {
    Exercise,
    RoutineExercise,
    Suggestion,
    TrackingType,
    WorkoutEntry,
    WorkoutSession,
    WorkoutSet,
} from '@/types';

type Entry = Omit<WorkoutEntry, 'suggestion'> & {
    suggestion: Suggestion | null;
    loading?: boolean;
};

type SetFormData = {
    weight_kg: string;
    reps: string;
    duration_seconds: string;
    distance_m: string;
    rpe: string;
    is_warmup: boolean;
};

type SetValues = Pick<
    WorkoutSet,
    'reps' | 'weight_kg' | 'duration_seconds' | 'distance_m' | 'is_warmup'
>;

const DEFAULT_REST_SECONDS = 90;

export default function WorkoutShow({
    session,
    entries,
}: {
    session: WorkoutSession;
    entries: WorkoutEntry[];
}) {
    const [extraEntries, setExtraEntries] = useState<Entry[]>([]);
    const [rest, setRest] = useState<{ key: number; seconds: number } | null>(
        null,
    );
    const suggestionHttp = useHttp<{ exclude_session: number }, Suggestion>({
        exclude_session: session.id,
    });

    const sets = session.sets ?? [];
    const finished = session.finished_at !== null;
    const entryIds = new Set(entries.map((entry) => entry.exercise.id));
    const allEntries: Entry[] = [
        ...entries,
        ...extraEntries.filter((entry) => !entryIds.has(entry.exercise.id)),
    ];

    const addExercise = (exercise: Exercise) => {
        if (allEntries.some((entry) => entry.exercise.id === exercise.id)) {
            return;
        }

        setExtraEntries((current) => [
            ...current,
            { exercise, target: null, suggestion: null, loading: true },
        ]);

        const resolve = (suggestion: Suggestion | null) =>
            setExtraEntries((current) =>
                current.map((entry) =>
                    entry.exercise.id === exercise.id
                        ? { ...entry, suggestion, loading: false }
                        : entry,
                ),
            );

        suggestionHttp
            .get(exercisesRoutes.suggestion.url(exercise.id))
            .then(resolve)
            .catch(() => resolve(null));
    };

    const removeExtra = (exerciseId: number) =>
        setExtraEntries((current) =>
            current.filter((entry) => entry.exercise.id !== exerciseId),
        );

    const startRest = (seconds: number) =>
        setRest({ key: Date.now(), seconds });

    return (
        <>
            <Head title={session.name} />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-32">
                <WorkoutHeader session={session} finished={finished} />

                {finished && (
                    <WorkoutSummary
                        session={session}
                        entries={allEntries}
                        sets={sets}
                    />
                )}

                {allEntries.length === 0 && (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Añade tu primer ejercicio para empezar a registrar
                            series.
                        </CardContent>
                    </Card>
                )}

                {allEntries.map((entry) => (
                    <ExerciseCard
                        key={entry.exercise.id}
                        session={session}
                        entry={entry}
                        sets={sets.filter(
                            (set) => set.exercise_id === entry.exercise.id,
                        )}
                        finished={finished}
                        onLogged={() =>
                            startRest(
                                entry.target?.rest_seconds ??
                                    DEFAULT_REST_SECONDS,
                            )
                        }
                        onRemove={
                            entryIds.has(entry.exercise.id)
                                ? undefined
                                : () => removeExtra(entry.exercise.id)
                        }
                    />
                ))}

                <ExercisePicker
                    onSelect={addExercise}
                    title="Añadir ejercicio"
                    excludeIds={allEntries.map((entry) => entry.exercise.id)}
                    trigger={
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 w-full border-dashed text-base"
                        >
                            <Plus /> Añadir ejercicio
                        </Button>
                    }
                />

                <NotesCard session={session} />
            </div>

            {rest && (
                <RestTimer
                    key={rest.key}
                    seconds={rest.seconds}
                    onSkip={() => setRest(null)}
                />
            )}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function useNow(active: boolean, interval = 1000): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!active) {
            return;
        }

        const id = window.setInterval(() => setNow(Date.now()), interval);

        return () => window.clearInterval(id);
    }, [active, interval]);

    return now;
}

function WorkoutHeader({
    session,
    finished,
}: {
    session: WorkoutSession;
    finished: boolean;
}) {
    const now = useNow(!finished);
    const startedAt = new Date(session.started_at).getTime();
    const endedAt = session.finished_at
        ? new Date(session.finished_at).getTime()
        : now;
    const elapsed = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
    const [finishing, setFinishing] = useState(false);

    const finish = () =>
        router.post(
            workouts.finish.url(session.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setFinishing(true),
                onFinish: () => setFinishing(false),
            },
        );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="truncate font-num text-3xl uppercase">
                        {session.name}
                    </h1>
                    <p className="text-sm text-muted-foreground first-letter:uppercase">
                        {formatDate(session.started_at, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
                <DeleteWorkoutButton session={session} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div
                    className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-num text-xl',
                        !finished && 'border-primary/50 text-primary-text',
                    )}
                >
                    <Clock className="size-5" />
                    {formatDuration(elapsed)}
                </div>
                {finished ? (
                    <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="size-3" /> Completado
                    </Badge>
                ) : (
                    <Button
                        size="lg"
                        className="ml-auto h-11"
                        disabled={finishing}
                        onClick={finish}
                    >
                        <Flag /> Finalizar entrenamiento
                    </Button>
                )}
            </div>
        </div>
    );
}

function DeleteWorkoutButton({ session }: { session: WorkoutSession }) {
    const [processing, setProcessing] = useState(false);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar entrenamiento"
                >
                    <Trash2 />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Eliminar este entrenamiento?</DialogTitle>
                    <DialogDescription>
                        Se borrarán todas sus series. Esta acción no se puede
                        deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={processing}
                        onClick={() =>
                            router.delete(workouts.destroy.url(session.id), {
                                onStart: () => setProcessing(true),
                                onFinish: () => setProcessing(false),
                            })
                        }
                    >
                        <Trash2 /> Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function NotesCard({ session }: { session: WorkoutSession }) {
    const form = useForm({ notes: session.notes ?? '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(workouts.update.url(session.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Notas guardadas'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <StickyNote className="size-4" /> Notas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="grid gap-3">
                    <Textarea
                        value={form.data.notes}
                        maxLength={2000}
                        rows={3}
                        placeholder="¿Cómo te has sentido? ¿Alguna molestia?"
                        onChange={(event) =>
                            form.setData('notes', event.target.value)
                        }
                    />
                    <InputError message={form.errors.notes} />
                    <Button
                        type="submit"
                        variant="secondary"
                        className="justify-self-end"
                        disabled={form.processing || !form.isDirty}
                    >
                        Guardar notas
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Summary & sharing                                                          */
/* -------------------------------------------------------------------------- */

function WorkoutSummary({
    session,
    entries,
    sets,
}: {
    session: WorkoutSession;
    entries: Entry[];
    sets: WorkoutSet[];
}) {
    const workingSets = sets.filter((set) => !set.is_warmup);
    const performed = entries
        .map((entry) => ({
            exercise: entry.exercise,
            best: bestSet(
                sets.filter((set) => set.exercise_id === entry.exercise.id),
                entry.exercise.tracking_type,
            ),
            count: workingSets.filter(
                (set) => set.exercise_id === entry.exercise.id,
            ).length,
        }))
        .filter((item) => item.best !== null);
    const duration =
        session.duration_minutes !== null
            ? `${session.duration_minutes} min`
            : '—';
    const date = formatDate(session.started_at);

    return (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="size-5 text-amber-500" /> ¡Buen trabajo!
                </CardTitle>
                <CardDescription>Resumen del entrenamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <SummaryStat
                        icon={<Weight className="size-4" />}
                        label="Volumen"
                        value={formatKg(session.volume_kg ?? 0)}
                    />
                    <SummaryStat
                        icon={<ListChecks className="size-4" />}
                        label="Series"
                        value={workingSets.length.toString()}
                    />
                    <SummaryStat
                        icon={<Clock className="size-4" />}
                        label="Duración"
                        value={duration}
                    />
                </div>
                <ShareDialog
                    shareUrl={session.share_url}
                    enableShare={workouts.share(session.id)}
                    title={session.name}
                    text={`He completado "${session.name}": ${workingSets.length} series y ${formatKg(session.volume_kg ?? 0)} de volumen.`}
                    fileName={`entrenamiento-${session.id}`}
                    trigger={
                        <Button size="lg" className="w-full">
                            Compartir entrenamiento
                        </Button>
                    }
                    storyCard={
                        <StoryCard
                            badge="Entrenamiento"
                            title={session.name}
                            subtitle={`${date} · ${duration} · ${formatKg(session.volume_kg ?? 0)}`}
                        >
                            {performed.slice(0, 8).map((item) => (
                                <div
                                    key={item.exercise.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: 24,
                                        borderBottom: '2px solid #3f3f46',
                                        paddingBottom: 20,
                                    }}
                                >
                                    <span style={{ fontWeight: 700 }}>
                                        {item.exercise.name}
                                    </span>
                                    <span
                                        style={{
                                            color: '#facc15',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {item.best
                                            ? formatSet(
                                                  item.best,
                                                  item.exercise.tracking_type,
                                              )
                                            : ''}
                                    </span>
                                </div>
                            ))}
                            {performed.length > 8 && (
                                <div style={{ color: '#a1a1aa' }}>
                                    y {performed.length - 8} ejercicios más
                                </div>
                            )}
                        </StoryCard>
                    }
                />
            </CardContent>
        </Card>
    );
}

function SummaryStat({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums">{value}</div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Exercise card                                                              */
/* -------------------------------------------------------------------------- */

function ExerciseCard({
    session,
    entry,
    sets,
    finished,
    onLogged,
    onRemove,
}: {
    session: WorkoutSession;
    entry: Entry;
    sets: WorkoutSet[];
    finished: boolean;
    onLogged: () => void;
    onRemove?: () => void;
}) {
    const { exercise, target, suggestion } = entry;
    const [showForm, setShowForm] = useState(!finished);
    const [editing, setEditing] = useState<WorkoutSet | null>(null);
    const workingSets = sets.filter((set) => !set.is_warmup);
    const plannedSets = target?.target_sets ?? suggestion?.sets ?? null;
    const muscles = exercise.primary_muscles ?? [];

    return (
        <Card className="gap-4 overflow-hidden py-4">
            <CardHeader className="px-4">
                <div className="flex gap-3">
                    <ExerciseImage
                        exercise={exercise}
                        className="w-20 shrink-0 rounded-md border sm:w-24"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-tight">
                                {exercise.name}
                            </CardTitle>
                            {onRemove && sets.length === 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="-mt-1 -mr-2 size-8 shrink-0"
                                    aria-label="Quitar ejercicio"
                                    onClick={onRemove}
                                >
                                    <X />
                                </Button>
                            )}
                        </div>
                        {muscles.length > 0 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {muscles
                                    .map((muscle) => muscle.name)
                                    .join(', ')}
                            </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {target && (
                                <Badge variant="outline" className="gap-1">
                                    <Target className="size-3" />
                                    {formatTarget(target)}
                                </Badge>
                            )}
                            {plannedSets !== null && (
                                <Badge
                                    variant={
                                        workingSets.length >= plannedSets
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="tabular-nums"
                                >
                                    {workingSets.length}/{plannedSets} series
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 px-4">
                {target?.notes && (
                    <p className="text-sm text-muted-foreground italic">
                        {target.notes}
                    </p>
                )}

                {suggestion ? (
                    <SuggestionCallout suggestion={suggestion} />
                ) : (
                    entry.loading && (
                        <div className="h-16 animate-pulse rounded-lg bg-muted" />
                    )
                )}

                {sets.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        {sets.map((set) => (
                            <SetRow
                                key={set.id}
                                index={
                                    workingSets.findIndex(
                                        (working) => working.id === set.id,
                                    ) + 1
                                }
                                summary={formatSet(set, exercise.tracking_type)}
                                rpe={set.rpe}
                                warmup={set.is_warmup}
                                targetMet={meetsTarget(
                                    set,
                                    suggestion,
                                    exercise.tracking_type,
                                )}
                                onEdit={() => setEditing(set)}
                            />
                        ))}
                    </div>
                )}

                {showForm ? (
                    <AddSetForm
                        key={suggestion ? 'suggested' : 'empty'}
                        session={session}
                        exercise={exercise}
                        suggestion={suggestion}
                        target={target}
                        nextSetNumber={workingSets.length + 1}
                        onLogged={onLogged}
                    />
                ) : (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus /> Añadir serie
                    </Button>
                )}
            </CardContent>

            <Dialog
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar serie</DialogTitle>
                        <DialogDescription>{exercise.name}</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <EditSetForm
                            key={editing.id}
                            session={session}
                            set={editing}
                            trackingType={exercise.tracking_type}
                            onDone={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Set forms                                                                  */
/* -------------------------------------------------------------------------- */

function AddSetForm({
    session,
    exercise,
    suggestion,
    target,
    nextSetNumber,
    onLogged,
}: {
    session: WorkoutSession;
    exercise: Exercise;
    suggestion: Suggestion | null;
    target: RoutineExercise | null;
    nextSetNumber: number;
    onLogged: () => void;
}) {
    const form = useForm<SetFormData>(
        defaultsFromSuggestion(suggestion, target),
    );
    const [celebrate, setCelebrate] = useState(false);
    const trackingType = exercise.tracking_type;
    const setData = <K extends keyof SetFormData>(
        key: K,
        value: SetFormData[K],
    ) => form.setData((current) => ({ ...current, [key]: value }));

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const payload = toPayload(form.data, trackingType);

        form.transform(() => ({ ...payload, exercise_id: exercise.id }));
        form.post(workouts.sets.store.url(session.id), {
            preserveScroll: true,
            onSuccess: () => {
                setData('rpe', '');
                setData('is_warmup', false);

                if (meetsTarget(payload, suggestion, trackingType)) {
                    setCelebrate(true);
                    navigator.vibrate?.(30);
                    window.setTimeout(() => setCelebrate(false), 2200);
                }

                onLogged();
            },
        });
    };

    const warmup = form.data.is_warmup;

    return (
        <form
            onSubmit={submit}
            aria-label={`Registrar serie ${nextSetNumber}`}
            className="flex flex-col gap-3 rounded-xl border border-input bg-card p-3.5"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-num text-lg uppercase">
                    {warmup ? 'Calentamiento' : `Serie ${nextSetNumber}`}
                </h3>
                <WarmupToggle
                    pressed={warmup}
                    onToggle={() => setData('is_warmup', !warmup)}
                />
            </div>

            <SetFields
                trackingType={trackingType}
                data={form.data}
                errors={form.errors}
                onChange={setData}
                idPrefix={`add-${exercise.id}`}
            />

            <RpePicker
                value={parseInteger(form.data.rpe)}
                onChange={(value) => setData('rpe', value?.toString() ?? '')}
            />
            <InputError message={form.errors.rpe} />

            <div aria-live="polite">{celebrate && <TargetMetBanner />}</div>

            <Button type="submit" size="workout" disabled={form.processing}>
                <Check strokeWidth={3} />
                Guardar {warmup ? 'calentamiento' : `serie ${nextSetNumber}`}
            </Button>
        </form>
    );
}

function EditSetForm({
    session,
    set,
    trackingType,
    onDone,
}: {
    session: WorkoutSession;
    set: WorkoutSet;
    trackingType: TrackingType;
    onDone: () => void;
}) {
    const form = useForm<SetFormData>({
        weight_kg: set.weight_kg?.toString() ?? '',
        reps: set.reps?.toString() ?? '',
        duration_seconds: set.duration_seconds
            ? formatDuration(set.duration_seconds)
            : '',
        distance_m: set.distance_m?.toString() ?? '',
        rpe: set.rpe?.toString() ?? '',
        is_warmup: set.is_warmup,
    });
    const [deleting, setDeleting] = useState(false);
    const route = { workout: session.id, set: set.id };
    const setData = <K extends keyof SetFormData>(
        key: K,
        value: SetFormData[K],
    ) => form.setData((current) => ({ ...current, [key]: value }));

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => toPayload(data, trackingType));
        form.put(workouts.sets.update.url(route), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    const destroy = () =>
        router.delete(workouts.sets.destroy.url(route), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => setDeleting(false),
            onSuccess: onDone,
        });

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex justify-end">
                <WarmupToggle
                    pressed={form.data.is_warmup}
                    onToggle={() => setData('is_warmup', !form.data.is_warmup)}
                />
            </div>
            <SetFields
                trackingType={trackingType}
                data={form.data}
                errors={form.errors}
                onChange={setData}
                idPrefix={`edit-${set.id}`}
            />
            <RpePicker
                value={parseInteger(form.data.rpe)}
                onChange={(value) => setData('rpe', value?.toString() ?? '')}
            />
            <InputError message={form.errors.rpe} />
            <DialogFooter className="gap-2">
                <Button
                    type="button"
                    variant="destructive"
                    disabled={deleting}
                    onClick={destroy}
                >
                    <Trash2 /> Eliminar
                </Button>
                <Button type="submit" disabled={form.processing}>
                    <Check /> Guardar cambios
                </Button>
            </DialogFooter>
        </form>
    );
}

/**
 * Value inputs for a set; which ones depend on how the exercise is tracked.
 */
function SetFields({
    trackingType,
    data,
    errors,
    onChange,
    idPrefix,
}: {
    trackingType: TrackingType;
    data: SetFormData;
    errors: Partial<Record<string, string>>;
    onChange: <K extends keyof SetFormData>(
        key: K,
        value: SetFormData[K],
    ) => void;
    idPrefix: string;
}) {
    const stepper = (
        key: 'weight_kg' | 'reps' | 'distance_m',
        label: string,
        options: { step: number; max: number; unit?: string },
    ) => (
        <div>
            <NumberStepper
                label={label}
                unit={options.unit}
                step={options.step}
                max={options.max}
                value={parseNumber(data[key]) ?? 0}
                onChange={(value) => onChange(key, value.toString())}
            />
            <InputError message={errors[key]} className="mt-1" />
        </div>
    );

    return (
        <div className="grid gap-2.5 sm:grid-cols-2">
            {trackingType === 'weight_reps' &&
                stepper('weight_kg', 'Peso', {
                    step: 2.5,
                    max: 1000,
                    unit: 'kg',
                })}
            {(trackingType === 'weight_reps' || trackingType === 'reps') &&
                stepper('reps', 'Repeticiones', { step: 1, max: 1000 })}
            {trackingType === 'distance_time' &&
                stepper('distance_m', 'Distancia', {
                    step: 50,
                    max: 100000,
                    unit: 'm',
                })}
            {(trackingType === 'time' || trackingType === 'distance_time') && (
                <div
                    className={cn(
                        'flex flex-col gap-1.5',
                        trackingType === 'time' && 'sm:col-span-2',
                    )}
                >
                    <label
                        htmlFor={`${idPrefix}-duration`}
                        className="text-xs font-semibold text-muted-foreground"
                    >
                        Tiempo (mm:ss)
                    </label>
                    <input
                        id={`${idPrefix}-duration`}
                        value={data.duration_seconds}
                        inputMode="numeric"
                        placeholder="1:30"
                        className="h-16 w-full rounded-lg border border-input bg-transparent text-center font-num text-[28px] outline-none focus-visible:border-ring"
                        onChange={(event) =>
                            onChange('duration_seconds', event.target.value)
                        }
                    />
                    <InputError message={errors.duration_seconds} />
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseNumber(value: string): number | null {
    const normalized = value.trim().replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string): number | null {
    const parsed = parseNumber(value);

    return parsed === null ? null : Math.round(parsed);
}

function toPayload(
    data: SetFormData,
    trackingType: TrackingType,
): SetValues & { rpe: number | null } {
    const usesReps = trackingType === 'weight_reps' || trackingType === 'reps';
    const usesDuration =
        trackingType === 'time' || trackingType === 'distance_time';

    return {
        weight_kg:
            trackingType === 'weight_reps' ? parseNumber(data.weight_kg) : null,
        reps: usesReps ? parseInteger(data.reps) : null,
        duration_seconds: usesDuration
            ? parseDuration(data.duration_seconds)
            : null,
        distance_m:
            trackingType === 'distance_time'
                ? parseInteger(data.distance_m)
                : null,
        rpe: parseInteger(data.rpe),
        is_warmup: data.is_warmup,
    };
}

function defaultsFromSuggestion(
    suggestion: Suggestion | null,
    target: RoutineExercise | null,
): SetFormData {
    const reps =
        suggestion?.reps ??
        suggestion?.reps_min ??
        target?.target_reps_min ??
        null;
    const weight = suggestion?.weight_kg ?? target?.target_weight_kg ?? null;
    const duration =
        suggestion?.duration_seconds ?? target?.target_seconds ?? null;
    const distance =
        suggestion?.distance_m ?? target?.target_distance_m ?? null;

    return {
        weight_kg: weight?.toString() ?? '',
        reps: reps?.toString() ?? '',
        duration_seconds: duration ? formatDuration(duration) : '',
        distance_m: distance?.toString() ?? '',
        rpe: '',
        is_warmup: false,
    };
}

/**
 * Whether a working set reaches the values suggested for today.
 */
function meetsTarget(
    set: SetValues,
    suggestion: Suggestion | null,
    trackingType: TrackingType,
): boolean {
    if (!suggestion || set.is_warmup) {
        return false;
    }

    const targetReps = suggestion.reps ?? suggestion.reps_min;

    switch (trackingType) {
        case 'weight_reps':
            if (suggestion.weight_kg === null && targetReps === null) {
                return false;
            }

            return (
                (suggestion.weight_kg === null ||
                    (set.weight_kg ?? 0) >= suggestion.weight_kg) &&
                (targetReps === null || (set.reps ?? 0) >= targetReps)
            );
        case 'reps':
            return targetReps !== null && (set.reps ?? 0) >= targetReps;
        case 'time':
            return (
                suggestion.duration_seconds !== null &&
                (set.duration_seconds ?? 0) >= suggestion.duration_seconds
            );
        case 'distance_time':
            return (
                suggestion.duration_seconds !== null &&
                set.duration_seconds !== null &&
                set.duration_seconds <= suggestion.duration_seconds &&
                (suggestion.distance_m === null ||
                    (set.distance_m ?? 0) >= suggestion.distance_m)
            );
    }
}

function formatSet(set: SetValues, trackingType: TrackingType): string {
    switch (trackingType) {
        case 'weight_reps':
            return set.weight_kg
                ? `${formatKg(set.weight_kg)} × ${set.reps ?? 0}`
                : `${set.reps ?? 0} reps`;
        case 'reps':
            return `${set.reps ?? 0} reps`;
        case 'time':
            return formatDuration(set.duration_seconds);
        case 'distance_time':
            return `${formatNumber(set.distance_m)} m · ${formatDuration(set.duration_seconds)}`;
    }
}

/**
 * Best working set of an exercise (heaviest, most reps, longest or fastest).
 */
function bestSet(sets: WorkoutSet[], trackingType: TrackingType) {
    const working = sets.filter((set) => !set.is_warmup);
    const candidates = working.length > 0 ? working : sets;

    if (candidates.length === 0) {
        return null;
    }

    const score = (set: WorkoutSet): number => {
        switch (trackingType) {
            case 'weight_reps':
                return (set.weight_kg ?? 0) * 1000 + (set.reps ?? 0);
            case 'reps':
                return set.reps ?? 0;
            case 'time':
                return set.duration_seconds ?? 0;
            case 'distance_time':
                return set.duration_seconds
                    ? (set.distance_m ?? 0) / set.duration_seconds
                    : 0;
        }
    };

    return candidates.reduce((best, set) =>
        score(set) > score(best) ? set : best,
    );
}

WorkoutShow.layout = ({ session }: { session: WorkoutSession }) => ({
    breadcrumbs: [
        { title: 'Entrenamientos', href: workouts.index() },
        { title: session.name, href: workouts.show(session.id) },
    ],
});
