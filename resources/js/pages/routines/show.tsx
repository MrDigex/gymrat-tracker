import { Form, Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Clock,
    Dumbbell,
    EllipsisVertical,
    Globe,
    History,
    Lock,
    Pencil,
    Play,
    Plus,
    Sparkles,
    Target,
    Trash2,
} from 'lucide-react';
import type { ComponentProps, FormEvent } from 'react';
import { useState } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import { ExercisePicker, fetchJson } from '@/components/exercise-picker';
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
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
    formatDateTime,
    formatDuration,
    formatTarget,
    parseDuration,
} from '@/lib/format';
import exercises from '@/routes/exercises';
import routines from '@/routes/routines';
import workouts from '@/routes/workouts';
import type {
    Exercise,
    Routine,
    RoutineExercise,
    Suggestion,
    TrackingType,
    WorkoutSession,
} from '@/types';

type Props = {
    routine: Routine;
    recentSessions: WorkoutSession[];
};

/**
 * Target inputs are kept as strings so they can be empty while editing.
 */
type TargetData = {
    target_sets: string;
    target_reps_min: string;
    target_reps_max: string;
    target_weight_kg: string;
    target_time: string;
    target_distance_m: string;
    rest_seconds: string;
    notes: string;
};

const toText = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value);

const toNumber = (value: string) => {
    const trimmed = value.trim().replace(',', '.');

    return trimmed === '' || Number.isNaN(Number(trimmed))
        ? null
        : Number(trimmed);
};

const toTimeText = (seconds: number | null | undefined) =>
    seconds ? formatDuration(seconds) : '';

function fromSuggestion(suggestion: Suggestion | null): TargetData {
    return {
        target_sets: toText(suggestion?.sets ?? 3),
        target_reps_min: toText(suggestion?.reps_min ?? suggestion?.reps),
        target_reps_max: toText(suggestion?.reps_max ?? suggestion?.reps),
        target_weight_kg: toText(suggestion?.weight_kg),
        target_time: toTimeText(suggestion?.duration_seconds),
        target_distance_m: toText(suggestion?.distance_m),
        rest_seconds: '90',
        notes: '',
    };
}

function fromRoutineExercise(item: RoutineExercise): TargetData {
    return {
        target_sets: toText(item.target_sets),
        target_reps_min: toText(item.target_reps_min),
        target_reps_max: toText(item.target_reps_max),
        target_weight_kg: toText(item.target_weight_kg),
        target_time: toTimeText(item.target_seconds),
        target_distance_m: toText(item.target_distance_m),
        rest_seconds: toText(item.rest_seconds),
        notes: item.notes ?? '',
    };
}

function toPayload(data: TargetData, trackingType: TrackingType) {
    const usesReps = trackingType === 'weight_reps' || trackingType === 'reps';
    const usesTime =
        trackingType === 'time' || trackingType === 'distance_time';

    return {
        target_sets: toNumber(data.target_sets),
        target_reps_min: usesReps ? toNumber(data.target_reps_min) : null,
        target_reps_max: usesReps ? toNumber(data.target_reps_max) : null,
        target_weight_kg:
            trackingType === 'weight_reps'
                ? toNumber(data.target_weight_kg)
                : null,
        target_seconds: usesTime ? parseDuration(data.target_time) : null,
        target_distance_m:
            trackingType === 'distance_time'
                ? toNumber(data.target_distance_m)
                : null,
        rest_seconds: toNumber(data.rest_seconds),
        notes: data.notes.trim() || null,
    };
}

export default function RoutineShow({ routine, recentSessions }: Props) {
    const items = routine.exercises ?? [];
    const [starting, setStarting] = useState(false);
    const [pending, setPending] = useState<{
        exercise: Exercise;
        suggestion: Suggestion | null;
        loading: boolean;
    } | null>(null);

    const start = () => {
        setStarting(true);
        router.post(
            workouts.store.url(),
            { routine_id: routine.id },
            { onFinish: () => setStarting(false) },
        );
    };

    const selectExercise = (exercise: Exercise) => {
        setPending({ exercise, suggestion: null, loading: true });

        fetchJson<Suggestion>(exercises.suggestion.url(exercise.id))
            .then((suggestion) =>
                setPending((current) =>
                    current?.exercise.id === exercise.id
                        ? { ...current, suggestion, loading: false }
                        : current,
                ),
            )
            .catch(() =>
                setPending((current) =>
                    current?.exercise.id === exercise.id
                        ? { ...current, loading: false }
                        : current,
                ),
            );
    };

    const move = (index: number, offset: number) => {
        const ids = items.map((item) => item.id);
        [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];

        router.put(
            routines.exercises.reorder.url(routine.id),
            { ids },
            { preserveScroll: true },
        );
    };

    const addButton = (
        <ExercisePicker
            title="Añadir ejercicio"
            excludeIds={items.map((item) => item.exercise.id)}
            onSelect={selectExercise}
            trigger={
                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                    <Plus className="size-5" /> Añadir ejercicio
                </button>
            }
        />
    );

    return (
        <>
            <Head title={routine.name} />

            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4">
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {routine.name}
                                </h1>
                                {routine.is_public && (
                                    <Badge variant="secondary">
                                        <Globe /> Pública
                                    </Badge>
                                )}
                            </div>
                            {routine.description && (
                                <p className="text-sm whitespace-pre-line text-muted-foreground">
                                    {routine.description}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                {items.length}{' '}
                                {items.length === 1
                                    ? 'ejercicio'
                                    : 'ejercicios'}
                            </p>
                        </div>
                        <RoutineMenu routine={routine} />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            size="lg"
                            className="sm:flex-1"
                            onClick={start}
                            disabled={starting}
                        >
                            {starting ? <Spinner /> : <Play />} Empezar
                            entrenamiento
                        </Button>
                        <ShareDialog
                            shareUrl={routine.share_url}
                            enableShare={routines.share(routine.id)}
                            title={routine.name}
                            text={`Mira mi rutina «${routine.name}» en GymRat Tracker`}
                            fileName={`rutina-${routine.id}`}
                            trigger={
                                <Button size="lg" variant="outline">
                                    <Globe /> Compartir
                                </Button>
                            }
                            storyCard={
                                <StoryCard
                                    badge="Rutina"
                                    title={routine.name}
                                    subtitle={`${items.length} ejercicios`}
                                >
                                    {items.slice(0, 10).map((item, index) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                gap: 24,
                                                borderBottom:
                                                    '2px solid #3f3f46',
                                                paddingBottom: 20,
                                            }}
                                        >
                                            <span style={{ fontWeight: 700 }}>
                                                {index + 1}.{' '}
                                                {item.exercise.name}
                                            </span>
                                            <span
                                                style={{
                                                    color: '#facc15',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {formatTarget(item)}
                                            </span>
                                        </div>
                                    ))}
                                    {items.length > 10 && (
                                        <div style={{ color: '#a1a1aa' }}>
                                            y {items.length - 10} más…
                                        </div>
                                    )}
                                </StoryCard>
                            }
                        />
                    </div>
                </div>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Ejercicios</h2>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
                            <Dumbbell className="size-8 text-muted-foreground" />
                            <p className="font-medium">Tu rutina está vacía</p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                Añade ejercicios y te propondremos series,
                                repeticiones y peso según tu último
                                entrenamiento para que sigas progresando.
                            </p>
                        </div>
                    ) : (
                        <ol className="space-y-3">
                            {items.map((item, index) => (
                                <RoutineExerciseItem
                                    key={item.id}
                                    routine={routine}
                                    item={item}
                                    index={index}
                                    isLast={index === items.length - 1}
                                    onMove={(offset) => move(index, offset)}
                                />
                            ))}
                        </ol>
                    )}

                    {addButton}
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="size-4" /> Sesiones recientes
                        </CardTitle>
                        <CardDescription>
                            Tus últimos entrenamientos con esta rutina.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentSessions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Todavía no has entrenado con esta rutina.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {recentSessions.map((session) => (
                                    <li key={session.id}>
                                        <Link
                                            href={workouts.show(session.id)}
                                            className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">
                                                    {session.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDateTime(
                                                        session.started_at,
                                                    )}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-right text-xs text-muted-foreground">
                                                {session.finished_at ? (
                                                    <>
                                                        {session.sets_count ??
                                                            0}{' '}
                                                        series
                                                        {session.duration_minutes !==
                                                            null &&
                                                            ` · ${session.duration_minutes} min`}
                                                    </>
                                                ) : (
                                                    <Badge>En curso</Badge>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={pending !== null}
                onOpenChange={(open) => !open && setPending(null)}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    {pending && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    Añadir {pending.exercise.name}
                                </DialogTitle>
                                <DialogDescription>
                                    Hemos preparado tus objetivos para que sigas
                                    progresando. Ajústalos si lo necesitas.
                                </DialogDescription>
                            </DialogHeader>
                            {pending.loading ? (
                                <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                                    <Spinner />
                                    Calculando tu sugerencia…
                                </div>
                            ) : (
                                <AddExerciseForm
                                    key={pending.exercise.id}
                                    routine={routine}
                                    exercise={pending.exercise}
                                    suggestion={pending.suggestion}
                                    onDone={() => setPending(null)}
                                />
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function RoutineMenu({ routine }: { routine: Routine }) {
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Opciones de la rutina"
                    >
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(true)}>
                        <Pencil /> Editar nombre y descripción
                    </DropdownMenuItem>
                    {routine.is_public && (
                        <DropdownMenuItem
                            onSelect={() =>
                                router.delete(
                                    routines.unshare.url(routine.id),
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <Lock /> Dejar de compartir
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleting(true)}
                    >
                        <Trash2 /> Eliminar rutina
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={editing} onOpenChange={setEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar rutina</DialogTitle>
                        <DialogDescription>
                            Cambia el nombre o la descripción.
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        {...routines.update.form(routine.id)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => setEditing(false)}
                        className="space-y-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="routine-name">Nombre</Label>
                                    <Input
                                        id="routine-name"
                                        name="name"
                                        defaultValue={routine.name}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="routine-description">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="routine-description"
                                        name="description"
                                        rows={3}
                                        defaultValue={routine.description ?? ''}
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancelar
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>
                                        {processing && <Spinner />} Guardar
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleting}
                onOpenChange={setDeleting}
                title={`¿Eliminar «${routine.name}»?`}
                description="Se eliminará la rutina y sus objetivos. Tus entrenamientos registrados se conservan."
                confirmLabel="Eliminar rutina"
                onConfirm={() =>
                    router.delete(routines.destroy.url(routine.id))
                }
            />
        </>
    );
}

function RoutineExerciseItem({
    routine,
    item,
    index,
    isLast,
    onMove,
}: {
    routine: Routine;
    item: RoutineExercise;
    index: number;
    isLast: boolean;
    onMove: (offset: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [removing, setRemoving] = useState(false);

    return (
        <li className="flex gap-3 rounded-xl border bg-card p-3">
            <div className="relative shrink-0">
                <ExerciseImage
                    exercise={item.exercise}
                    animate={false}
                    className="h-16 w-24 rounded-lg [&_svg]:size-5"
                />
                <span className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                <Link
                    href={exercises.show(item.exercise.id)}
                    className="line-clamp-2 leading-tight font-medium hover:underline"
                >
                    {item.exercise.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                        <Target className="size-3.5" /> {formatTarget(item)}
                    </span>
                    {item.rest_seconds !== null && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" /> Descanso{' '}
                            {formatDuration(item.rest_seconds)}
                        </span>
                    )}
                </div>
                {item.notes && (
                    <p className="text-xs text-muted-foreground italic">
                        {item.notes}
                    </p>
                )}
            </div>
            <div className="flex shrink-0 flex-col items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Subir"
                    disabled={index === 0}
                    onClick={() => onMove(-1)}
                >
                    <ArrowUp />
                </Button>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Opciones del ejercicio"
                        >
                            <EllipsisVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(true)}>
                            <Pencil /> Editar objetivos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setRemoving(true)}
                        >
                            <Trash2 /> Quitar de la rutina
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Bajar"
                    disabled={isLast}
                    onClick={() => onMove(1)}
                >
                    <ArrowDown />
                </Button>
            </div>

            <Dialog open={editing} onOpenChange={setEditing}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{item.exercise.name}</DialogTitle>
                        <DialogDescription>
                            Ajusta los objetivos de este ejercicio.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <EditTargetForm
                            routine={routine}
                            item={item}
                            onDone={() => setEditing(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={removing}
                onOpenChange={setRemoving}
                title={`¿Quitar ${item.exercise.name}?`}
                description="Se quitará de esta rutina. Tu historial no se borra."
                confirmLabel="Quitar"
                onConfirm={() =>
                    router.delete(
                        routines.exercises.destroy.url({
                            routine: routine.id,
                            routineExercise: item.id,
                        }),
                        { preserveScroll: true },
                    )
                }
            />
        </li>
    );
}

function AddExerciseForm({
    routine,
    exercise,
    suggestion,
    onDone,
}: {
    routine: Routine;
    exercise: Exercise;
    suggestion: Suggestion | null;
    onDone: () => void;
}) {
    const form = useForm<TargetData>(fromSuggestion(suggestion));

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            exercise_id: exercise.id,
            ...toPayload(data, exercise.tracking_type),
        }));
        form.post(routines.exercises.store.url(routine.id), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-3">
                <ExerciseImage
                    exercise={exercise}
                    animate={false}
                    className="h-14 w-20 shrink-0 rounded-lg [&_svg]:size-5"
                />
                <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{exercise.name}</p>
                    <p className="truncate text-muted-foreground">
                        {exercise.primary_muscles
                            ?.map((muscle) => muscle.name)
                            .join(', ') || exercise.category_label}
                    </p>
                </div>
            </div>

            {suggestion ? (
                <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="size-4" />
                        {suggestion.has_history
                            ? 'Sobrecarga progresiva: tu siguiente paso'
                            : 'Punto de partida recomendado'}
                    </p>
                    <SuggestionCallout
                        suggestion={suggestion}
                        className="border-emerald-500/40 bg-emerald-500/5"
                    />
                </div>
            ) : (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    No pudimos calcular una sugerencia. Indica tus objetivos
                    manualmente.
                </p>
            )}

            <TargetFields
                trackingType={exercise.tracking_type}
                data={form.data}
                errors={form.errors}
                onChange={(key, value) => form.setData(key, value)}
            />

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? <Spinner /> : <Plus />} Añadir a la
                    rutina
                </Button>
            </DialogFooter>
        </form>
    );
}

function EditTargetForm({
    routine,
    item,
    onDone,
}: {
    routine: Routine;
    item: RoutineExercise;
    onDone: () => void;
}) {
    const form = useForm<TargetData>(fromRoutineExercise(item));

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => toPayload(data, item.exercise.tracking_type));
        form.put(
            routines.exercises.update.url({
                routine: routine.id,
                routineExercise: item.id,
            }),
            { preserveScroll: true, onSuccess: onDone },
        );
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <TargetFields
                trackingType={item.exercise.tracking_type}
                data={form.data}
                errors={form.errors}
                onChange={(key, value) => form.setData(key, value)}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />} Guardar
                </Button>
            </DialogFooter>
        </form>
    );
}

function TargetFields({
    trackingType,
    data,
    errors,
    onChange,
}: {
    trackingType: TrackingType;
    data: TargetData;
    errors: Partial<Record<string, string>>;
    onChange: (key: keyof TargetData, value: string) => void;
}) {
    const field = (
        key: keyof TargetData,
        label: string,
        props: ComponentProps<typeof Input> = {},
        errorKey: string = key,
    ) => (
        <div className="grid gap-1.5">
            <Label htmlFor={`target-${key}`}>{label}</Label>
            <Input
                id={`target-${key}`}
                value={data[key]}
                onChange={(event) => onChange(key, event.target.value)}
                inputMode="numeric"
                {...props}
            />
            <InputError message={errors[errorKey]} />
        </div>
    );

    const usesReps = trackingType === 'weight_reps' || trackingType === 'reps';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {field('target_sets', 'Series', { type: 'number', min: 1 })}
                {usesReps && (
                    <>
                        {field('target_reps_min', 'Reps mín.', {
                            type: 'number',
                            min: 1,
                        })}
                        {field('target_reps_max', 'Reps máx.', {
                            type: 'number',
                            min: 1,
                        })}
                    </>
                )}
                {trackingType === 'weight_reps' &&
                    field('target_weight_kg', 'Peso (kg)', {
                        inputMode: 'decimal',
                        placeholder: '0',
                    })}
                {trackingType === 'distance_time' &&
                    field('target_distance_m', 'Distancia (m)', {
                        type: 'number',
                        min: 1,
                    })}
                {(trackingType === 'time' ||
                    trackingType === 'distance_time') &&
                    field(
                        'target_time',
                        trackingType === 'time'
                            ? 'Tiempo por serie'
                            : 'Tiempo objetivo',
                        { inputMode: 'text', placeholder: 'm:ss' },
                        'target_seconds',
                    )}
                {field('rest_seconds', 'Descanso (s)', {
                    type: 'number',
                    min: 0,
                    step: 15,
                })}
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="target-notes">Notas (opcional)</Label>
                <Input
                    id="target-notes"
                    value={data.notes}
                    onChange={(event) => onChange('notes', event.target.value)}
                    placeholder="Ej. agarre prono, tempo 3-1-1"
                    maxLength={255}
                />
                <InputError message={errors.notes} />
            </div>
        </div>
    );
}

function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onOpenChange(false);
                            onConfirm();
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

RoutineShow.layout = ({ routine }: Props) => ({
    breadcrumbs: [
        { title: 'Rutinas', href: routines.index() },
        { title: routine.name, href: routines.show(routine.id) },
    ],
});
