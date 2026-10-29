import { Form, Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    Ellipsis,
    Globe,
    Lock,
    Pencil,
    Play,
    Plus,
    Share2,
    Trash2,
} from 'lucide-react';
import type { ComponentProps, FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import { ExercisePicker, fetchJson } from '@/components/exercise-picker';
import InputError from '@/components/input-error';
import { ShareDialog, StoryCard } from '@/components/share-dialog';
import {
    MASCOT_SRC,
    SuggestionCallout,
} from '@/components/gymrat/suggestion-callout';
import { formatRest, routineSummary } from '@/components/routines/routine-meta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { formatDuration, formatTarget, parseDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
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

function monthShort(value: string): string {
    return new Intl.DateTimeFormat('es-ES', { month: 'short' })
        .format(new Date(value))
        .replace('.', '');
}

function sessionDay(value: string): string {
    const date = new Date(value);
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
        .format(date)
        .replace('.', '');
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' })
        .format(date)
        .replace('.', '');

    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()} ${month}`;
}

const volumeFormatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
    useGrouping: 'always',
});

export default function RoutineShow({ routine, recentSessions }: Props) {
    const items = routine.exercises ?? [];
    const [starting, setStarting] = useState(false);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const summary = routineSummary(routine, items.length);
    const totalSets = items.reduce((sum, item) => sum + item.target_sets, 0);
    const lastDone =
        routine.last_performed_at ??
        recentSessions.find((session) => session.finished_at)?.started_at ??
        null;

    const start = () => {
        setStarting(true);
        router.post(
            workouts.store.url(),
            { routine_id: routine.id },
            { onFinish: () => setStarting(false) },
        );
    };

    const highlight = (id: number | null) => {
        setHighlightId(id);
        window.setTimeout(() => setHighlightId(null), 2000);
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

    const share = (trigger: ReactNode) => (
        <ShareDialog
            shareUrl={routine.share_url}
            enableShare={routines.share(routine.id)}
            title={routine.name}
            text={`Mira mi rutina «${routine.name}» en GymRat Tracker`}
            fileName={`rutina-${routine.id}`}
            trigger={trigger}
            storyCard={
                <StoryCard
                    badge="Rutina"
                    title={routine.name}
                    stats={[
                        {
                            label: 'Ejercicios',
                            value: items.length,
                        },
                        ...(routine.estimated_minutes
                            ? [
                                  {
                                      label: 'Duración aprox.',
                                      value: routine.estimated_minutes,
                                      unit: 'min',
                                  },
                              ]
                            : []),
                    ]}
                    tiles={[
                        {
                            label: 'Series',
                            value: routine.total_sets ?? totalSets,
                        },
                        {
                            label: 'Minutos',
                            value: routine.estimated_minutes
                                ? `~${routine.estimated_minutes}`
                                : '—',
                        },
                        {
                            label: 'Última vez',
                            value: lastDone
                                ? new Date(lastDone).getDate()
                                : '—',
                            unit: lastDone
                                ? ` ${monthShort(lastDone)}`
                                : undefined,
                        },
                    ]}
                >
                    {items.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                                maxWidth: 440,
                                fontSize: 34,
                                fontWeight: 700,
                            }}
                        >
                            {items.slice(0, 4).map((item, index) => (
                                <div
                                    key={item.id}
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <span style={{ color: '#facc15' }}>
                                        {index + 1}
                                    </span>{' '}
                                    {item.exercise.name}
                                </div>
                            ))}
                            {items.length > 4 && (
                                <div
                                    style={{
                                        color: '#a1a1aa',
                                        fontWeight: 400,
                                    }}
                                >
                                    y {items.length - 4} más
                                </div>
                            )}
                        </div>
                    )}
                </StoryCard>
            }
        />
    );

    const addButton = (
        <ExercisePicker
            title="Añadir ejercicio"
            excludeIds={items.map((item) => item.exercise.id)}
            renderSelected={(exercise, { back, close, layout }) => (
                <AddExerciseStep
                    key={exercise.id}
                    routine={routine}
                    exercise={exercise}
                    existingIds={items.map((item) => item.id)}
                    layout={layout}
                    onBack={layout === 'split' ? close : back}
                    onDone={(id) => {
                        close();
                        highlight(id);
                    }}
                />
            )}
            trigger={
                <button
                    type="button"
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/50 p-4 text-[15px] font-bold transition-colors hover:border-primary hover:bg-primary/5"
                >
                    <Plus className="size-5" aria-hidden /> Añadir ejercicio
                </button>
            }
        />
    );

    return (
        <>
            <Head title={routine.name} />

            <div className="flex w-full flex-1 flex-col gap-5 p-4 md:gap-6 md:p-6 lg:p-8">
                <div className="-my-1 flex items-center justify-between gap-2 md:hidden">
                    <Link
                        href={routines.index()}
                        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="size-5" aria-hidden />
                        Rutinas
                    </Link>
                    <div className="flex gap-2">
                        {share(
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-11 rounded-lg"
                                aria-label="Compartir rutina"
                            >
                                <Share2 aria-hidden />
                            </Button>,
                        )}
                        <RoutineMenu routine={routine} />
                    </div>
                </div>

                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="min-w-0 font-num text-5xl leading-[0.95] break-words uppercase md:text-6xl">
                                {routine.name}
                            </h1>
                            {routine.is_public && (
                                <Badge variant="secondary">
                                    <Globe aria-hidden /> Pública
                                </Badge>
                            )}
                        </div>
                        <p className="max-w-2xl text-[15px] whitespace-pre-line text-muted-foreground">
                            {routine.description &&
                                `${routine.description.trim().replace(/([^.!?…])$/, '$1.')} `}
                            {summary}.
                        </p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-3 md:flex">
                        {share(
                            <Button
                                variant="outline"
                                className="h-12 rounded-lg px-5 text-[15px] font-bold"
                            >
                                <Share2 aria-hidden /> Compartir
                            </Button>,
                        )}
                        <Button
                            className="h-12 rounded-lg px-5 text-[15px] font-bold"
                            onClick={start}
                            disabled={starting}
                        >
                            {starting ? (
                                <Spinner />
                            ) : (
                                <Play className="fill-current" aria-hidden />
                            )}
                            Empezar entrenamiento
                        </Button>
                        <RoutineMenu routine={routine} />
                    </div>
                    <Button
                        size="workout"
                        className="w-full md:hidden"
                        onClick={start}
                        disabled={starting}
                    >
                        {starting ? (
                            <Spinner />
                        ) : (
                            <Play className="fill-current" aria-hidden />
                        )}
                        Empezar entrenamiento
                    </Button>
                </header>

                <div className="grid items-start gap-5 md:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                    <section
                        aria-label="Ejercicios"
                        className="flex flex-col gap-2.5"
                    >
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center">
                                <img
                                    src={MASCOT_SRC}
                                    alt=""
                                    className="size-24 rounded-2xl object-cover"
                                />
                                <p className="font-num text-xl uppercase">
                                    Tu rutina está vacía
                                </p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Añade ejercicios y te propondremos series,
                                    repeticiones y peso según tu último
                                    entrenamiento para que sigas progresando.
                                </p>
                            </div>
                        ) : (
                            <ol className="flex flex-col gap-2.5">
                                {items.map((item, index) => (
                                    <RoutineExerciseItem
                                        key={item.id}
                                        routine={routine}
                                        item={item}
                                        index={index}
                                        isLast={index === items.length - 1}
                                        highlighted={item.id === highlightId}
                                        onMove={(offset) => move(index, offset)}
                                    />
                                ))}
                            </ol>
                        )}

                        {addButton}
                    </section>

                    <section className="rounded-xl bg-card p-5">
                        <h2 className="mb-2 text-lg font-bold">
                            Sesiones recientes
                        </h2>
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
                                            className="-mx-2 flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
                                        >
                                            <span className="min-w-0">
                                                <span className="block font-medium">
                                                    {sessionDay(
                                                        session.started_at,
                                                    )}
                                                </span>
                                                {session.finished_at &&
                                                    session.volume_kg !==
                                                        undefined && (
                                                        <span className="block text-xs text-muted-foreground">
                                                            {session.sets_count ??
                                                                0}{' '}
                                                            series
                                                            {session.duration_minutes !==
                                                                null &&
                                                                ` · ${session.duration_minutes} min`}
                                                        </span>
                                                    )}
                                            </span>
                                            <span className="shrink-0 text-right">
                                                {!session.finished_at ? (
                                                    <Badge>En curso</Badge>
                                                ) : session.volume_kg !==
                                                  undefined ? (
                                                    <span className="font-num">
                                                        {volumeFormatter.format(
                                                            session.volume_kg,
                                                        )}{' '}
                                                        kg
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {session.sets_count ??
                                                            0}{' '}
                                                        series
                                                        {session.duration_minutes !==
                                                            null &&
                                                            ` · ${session.duration_minutes} min`}
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
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
                        variant="outline"
                        size="icon"
                        className="size-11 rounded-lg md:size-12"
                        aria-label="Opciones de la rutina"
                    >
                        <Ellipsis aria-hidden />
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
    highlighted = false,
    onMove,
}: {
    routine: Routine;
    item: RoutineExercise;
    index: number;
    isLast: boolean;
    highlighted?: boolean;
    onMove: (offset: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [removing, setRemoving] = useState(false);
    const muscles = item.exercise.primary_muscles
        ?.map((muscle) => muscle.name)
        .join(', ');

    return (
        <li
            className={cn(
                'flex items-center gap-2 rounded-xl bg-card p-2 pr-1 transition-shadow duration-300 md:gap-3 md:p-2.5',
                highlighted && 'ring-2 ring-primary',
            )}
        >
            <div className="hidden shrink-0 flex-col md:flex">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label={`Subir ${item.exercise.name}`}
                    disabled={index === 0}
                    onClick={() => onMove(-1)}
                >
                    <ChevronUp aria-hidden />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label={`Bajar ${item.exercise.name}`}
                    disabled={isLast}
                    onClick={() => onMove(1)}
                >
                    <ChevronDown aria-hidden />
                </Button>
            </div>
            <div className="relative shrink-0">
                <ExerciseImage
                    exercise={item.exercise}
                    animate={false}
                    className="size-14 rounded-md md:h-14 md:w-20 [&_svg]:size-5"
                />
                <span className="absolute -top-1.5 -left-1.5 grid size-6 place-items-center rounded-full bg-primary font-num text-xs text-primary-foreground ring-2 ring-card">
                    {index + 1}
                </span>
            </div>
            <div className="min-w-0 flex-1 md:grid md:grid-cols-[minmax(0,1fr)_auto_4rem] md:items-center md:gap-4">
                <div className="min-w-0">
                    <Link
                        href={exercises.show(item.exercise.id)}
                        className="line-clamp-2 leading-tight font-bold hover:underline"
                    >
                        {item.exercise.name}
                    </Link>
                    {muscles && (
                        <p className="hidden truncate text-[13px] text-muted-foreground md:block">
                            {muscles}
                        </p>
                    )}
                    {item.notes && (
                        <p className="truncate text-xs text-muted-foreground italic">
                            {item.notes}
                        </p>
                    )}
                </div>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 md:mt-0">
                    <span className="font-num text-[15px] md:text-lg">
                        {formatTarget(item)}
                    </span>
                    {item.rest_seconds !== null && (
                        <span className="text-xs text-muted-foreground md:hidden">
                            {formatRest(item.rest_seconds)}
                        </span>
                    )}
                </p>
                <span className="hidden text-right text-[13px] text-muted-foreground md:block">
                    {item.rest_seconds !== null && (
                        <>
                            <span className="sr-only">Descanso </span>
                            {formatRest(item.rest_seconds)}
                        </>
                    )}
                </span>
            </div>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0 text-muted-foreground"
                        aria-label={`Opciones de ${item.exercise.name}`}
                    >
                        <Ellipsis aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(true)}>
                        <Pencil /> Editar objetivos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={index === 0}
                        onSelect={() => onMove(-1)}
                    >
                        <ArrowUp /> Subir
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={isLast}
                        onSelect={() => onMove(1)}
                    >
                        <ArrowDown /> Bajar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setRemoving(true)}
                    >
                        <Trash2 /> Quitar de la rutina
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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

/**
 * Second step of the add-exercise sheet: fetch the coach suggestion, then confirm targets.
 */
function AddExerciseStep(props: {
    routine: Routine;
    exercise: Exercise;
    existingIds: number[];
    layout: 'split' | 'stacked';
    onBack: () => void;
    onDone: (routineExerciseId: number | null) => void;
}) {
    const [state, setState] = useState<{
        loading: boolean;
        suggestion: Suggestion | null;
    }>({ loading: true, suggestion: null });

    useEffect(() => {
        const controller = new AbortController();

        fetchJson<Suggestion>(
            exercises.suggestion.url(props.exercise.id),
            controller.signal,
        )
            .then((suggestion) => setState({ loading: false, suggestion }))
            .catch((error: unknown) => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setState({ loading: false, suggestion: null });
            });

        return () => controller.abort();
    }, [props.exercise.id]);

    if (state.loading) {
        return (
            <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                <Spinner />
                Tu coach está calculando el siguiente paso…
            </div>
        );
    }

    return <AddExerciseForm {...props} suggestion={state.suggestion} />;
}

function AddExerciseForm({
    routine,
    exercise,
    existingIds,
    layout,
    suggestion,
    onBack,
    onDone,
}: {
    routine: Routine;
    exercise: Exercise;
    existingIds: number[];
    layout: 'split' | 'stacked';
    suggestion: Suggestion | null;
    onBack: () => void;
    onDone: (routineExerciseId: number | null) => void;
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
            onSuccess: (page) => {
                const added = (page.props.routine as Routine).exercises?.find(
                    (item) => !existingIds.includes(item.id),
                );

                onDone(added?.id ?? null);
            },
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
            <div
                className={cn(
                    'flex items-center gap-3',
                    layout === 'split' && 'hidden',
                )}
            >
                <ExerciseImage
                    exercise={exercise}
                    animate={false}
                    className="h-14 w-20 shrink-0 rounded-md [&_svg]:size-5"
                />
                <p className="min-w-0 truncate text-sm text-muted-foreground">
                    {exercise.primary_muscles
                        ?.map((muscle) => muscle.name)
                        .join(', ') || exercise.category_label}
                </p>
            </div>

            {suggestion ? (
                <SuggestionCallout suggestion={suggestion} variant="coach" />
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

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-lg px-5 font-bold"
                    onClick={onBack}
                >
                    {layout === 'split' ? (
                        'Cancelar'
                    ) : (
                        <>
                            <ArrowLeft aria-hidden /> Atrás
                        </>
                    )}
                </Button>
                <Button
                    type="submit"
                    className="h-12 rounded-lg px-6 font-num text-base uppercase"
                    disabled={form.processing}
                >
                    {form.processing ? <Spinner /> : <Plus aria-hidden />}{' '}
                    Añadir a la rutina
                </Button>
            </div>
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
        <div className="grid min-w-0 gap-1.5">
            <Label
                htmlFor={`target-${key}`}
                className="leading-tight font-bold"
            >
                {label}
            </Label>
            <Input
                id={`target-${key}`}
                value={data[key]}
                onChange={(event) => onChange(key, event.target.value)}
                inputMode="numeric"
                className="h-14 rounded-lg text-center font-num text-xl md:text-xl"
                {...props}
            />
            <InputError message={errors[errorKey]} />
        </div>
    );

    const usesReps = trackingType === 'weight_reps' || trackingType === 'reps';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
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
                <Label htmlFor="target-notes" className="font-bold">
                    Notas (opcional)
                </Label>
                <Textarea
                    id="target-notes"
                    value={data.notes}
                    onChange={(event) => onChange('notes', event.target.value)}
                    placeholder="Ej. agarre prono, tempo 3-1-1"
                    maxLength={255}
                    rows={2}
                    className="rounded-lg"
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
