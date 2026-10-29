import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Plus,
    StickyNote,
    Trash2,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode, TouchEvent } from 'react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { ExercisePicker } from '@/components/exercise-picker';
import { RestTimer } from '@/components/gymrat/rest-timer';
import { SetsTable, TargetMetBanner } from '@/components/gymrat/set-logger';
import { SuggestionCallout } from '@/components/gymrat/suggestion-callout';
import InputError from '@/components/input-error';
import { ResponsivePanel } from '@/components/responsive-panel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BODY_ZONE_COLORS } from '@/lib/chart-colors';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import workouts from '@/routes/workouts';
import type {
    Exercise,
    SessionRecord,
    WorkoutSession,
    WorkoutSet,
} from '@/types';
import { EditSetForm, SetLoggerCard } from './set-forms';
import type { Entry, SetValues } from './workout-helpers';
import {
    DEFAULT_REST_SECONDS,
    formatElapsed,
    formatGrouped,
    formatSet,
    formatSetShort,
    meetsTarget,
    nextTargetLabel,
    plannedSets,
    setColumns,
    targetLabel,
} from './workout-helpers';
import { useIsDesktop, useIsWide, useNow } from './use-workout-hooks';

type Rest = { key: number; seconds: number };

type ActiveWorkoutProps = {
    session: WorkoutSession;
    entries: Entry[];
    records: SessionRecord[];
    /** Exercises added on the fly that can still be removed (no sets yet). */
    removableIds: number[];
    onAddExercise: (exercise: Exercise) => void;
    onRemoveExercise: (exerciseId: number) => void;
    /** Shown instead of "Finalizar" when editing a finished workout. */
    onBackToSummary?: () => void;
};

/**
 * Active workout: one exercise at a time on phones, three columns on desktop.
 */
export function ActiveWorkout({
    session,
    entries,
    records,
    removableIds,
    onAddExercise,
    onRemoveExercise,
    onBackToSummary,
}: ActiveWorkoutProps) {
    const isDesktop = useIsDesktop();
    // Design layout (sets table and logger side by side) needs a wide screen;
    // otherwise the logger moves to the right column, above the rest timer.
    const isWide = useIsWide();
    const [loggerSlot, setLoggerSlot] = useState<HTMLDivElement | null>(null);
    const sets = session.sets ?? [];
    const finished = session.finished_at !== null;
    const setsOf = (exerciseId: number) =>
        sets.filter((set) => set.exercise_id === exerciseId);
    const workingCount = (exerciseId: number) =>
        setsOf(exerciseId).filter((set) => !set.is_warmup).length;

    const [selectedId, setSelectedId] = useState<number | null>(() => {
        const pending = entries.find(
            (entry) => workingCount(entry.exercise.id) < plannedSets(entry),
        );

        return (pending ?? entries[0])?.exercise.id ?? null;
    });
    const [rest, setRest] = useState<Rest | null>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [celebration, setCelebration] = useState<{
        exerciseId: number;
        text: string;
    } | null>(null);

    const currentIndex = Math.max(
        0,
        entries.findIndex((entry) => entry.exercise.id === selectedId),
    );
    const current = entries[currentIndex] ?? null;
    const next = entries[currentIndex + 1] ?? null;
    const recordSetIds = new Set(records.map((record) => record.set_id));

    const totalPlanned = entries.reduce(
        (total, entry) => total + plannedSets(entry),
        0,
    );
    const totalWorking = sets.filter((set) => !set.is_warmup).length;

    const goTo = (index: number) => {
        const entry = entries[index];

        if (entry) {
            setSelectedId(entry.exercise.id);
            setCelebration(null);
            window.scrollTo({ top: 0 });
            scrollerRef.current?.scrollTo({ top: 0 });
        }
    };

    const addExercise = (exercise: Exercise) => {
        onAddExercise(exercise);
        setSelectedId(exercise.id);
        setCelebration(null);
    };

    const onLogged = (entry: Entry, set: SetValues) => {
        const met = meetsTarget(
            set,
            entry.suggestion,
            entry.exercise.tracking_type,
        );

        setCelebration(
            met
                ? {
                      exerciseId: entry.exercise.id,
                      text: formatSetShort(set, entry.exercise.tracking_type),
                  }
                : null,
        );

        if (met) {
            navigator.vibrate?.(30);
        }

        setRest({
            key: Date.now(),
            seconds: entry.target?.rest_seconds ?? DEFAULT_REST_SECONDS,
        });
    };

    const picker = (trigger: ReactNode) => (
        <ExercisePicker
            onSelect={addExercise}
            title="Añadir ejercicio"
            excludeIds={entries.map((entry) => entry.exercise.id)}
            trigger={trigger}
        />
    );

    const view = current ? (
        <ExerciseView
            key={`${current.exercise.id}-${current.suggestion ? 's' : 'n'}-${isDesktop ? 'd' : 'm'}`}
            session={session}
            entry={current}
            sets={setsOf(current.exercise.id)}
            recordSetIds={recordSetIds}
            isDesktop={isDesktop}
            loggerSlot={isDesktop && !isWide ? loggerSlot : null}
            celebration={
                celebration?.exerciseId === current.exercise.id
                    ? celebration.text
                    : null
            }
            onLogged={(set) => onLogged(current, set)}
            onRemove={
                removableIds.includes(current.exercise.id) &&
                setsOf(current.exercise.id).length === 0
                    ? () => {
                          onRemoveExercise(current.exercise.id);
                          goTo(Math.max(0, currentIndex - 1));
                      }
                    : undefined
            }
            onSwipe={(direction) => goTo(currentIndex + direction)}
        />
    ) : (
        <EmptyWorkout
            trigger={picker(
                <Button size="workout" className="w-full">
                    <Plus /> Añadir ejercicio
                </Button>,
            )}
        />
    );

    return (
        <div
            ref={scrollerRef}
            className={cn(
                'bg-background bg-chalk',
                'max-md:fixed max-md:inset-0 max-md:z-30 max-md:overflow-y-auto max-md:overscroll-contain',
                'md:min-h-[calc(100dvh-4rem)]',
            )}
        >
            <TopBar
                session={session}
                finished={finished}
                totalWorking={totalWorking}
                totalPlanned={totalPlanned}
                pendingSets={Math.max(0, totalPlanned - totalWorking)}
                addTrigger={picker(
                    <Button variant="outline" className="h-11 px-4 font-bold">
                        <Plus /> Añadir ejercicio
                    </Button>,
                )}
                onBackToSummary={onBackToSummary}
            />

            {isDesktop ? (
                <div
                    className={cn(
                        'grid gap-6 px-8 py-6',
                        isWide
                            ? 'grid-cols-[240px_minmax(0,1fr)_280px]'
                            : 'grid-cols-[210px_minmax(0,1fr)_360px]',
                    )}
                >
                    <ExerciseRail
                        entries={entries}
                        currentIndex={currentIndex}
                        workingCount={workingCount}
                        onSelect={goTo}
                    />
                    <div className="min-w-0">{view}</div>
                    <aside className="flex flex-col gap-5">
                        {!isWide && <div ref={setLoggerSlot} />}
                        {rest ? (
                            <RestTimer
                                key={rest.key}
                                seconds={rest.seconds}
                                variant="inline"
                                onSkip={() => setRest(null)}
                            />
                        ) : (
                            <RestIdle
                                seconds={
                                    current?.target?.rest_seconds ??
                                    DEFAULT_REST_SECONDS
                                }
                                onStart={(seconds) =>
                                    setRest({ key: Date.now(), seconds })
                                }
                            />
                        )}
                        <NotesField session={session} />
                    </aside>
                </div>
            ) : (
                <div
                    className={cn(
                        'mx-auto flex max-w-xl flex-col gap-3 px-4 pb-8',
                        entries.length > 0 ? 'pt-1' : 'pt-4',
                        rest && 'pb-36',
                    )}
                >
                    {entries.length > 0 && (
                        <ExerciseProgress
                            entries={entries}
                            currentIndex={currentIndex}
                            workingCount={workingCount}
                            onSelect={goTo}
                        />
                    )}
                    {view}
                    {next && (
                        <button
                            type="button"
                            onClick={() => goTo(currentIndex + 1)}
                            className="flex min-h-14 items-center gap-3 rounded-lg border border-dashed border-input px-4 py-3 text-left transition-colors hover:bg-muted"
                        >
                            <span className="text-xs font-extrabold tracking-[0.15em] text-muted-foreground uppercase">
                                Siguiente
                            </span>
                            <span className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-bold">
                                {next.exercise.name}
                                {nextTargetLabel(next) &&
                                    ` · ${nextTargetLabel(next)}`}
                            </span>
                            <ChevronRight
                                className="size-5 shrink-0 text-muted-foreground"
                                aria-hidden
                            />
                        </button>
                    )}
                    <div
                        className={cn(
                            'grid gap-2',
                            entries.length > 0 ? 'grid-cols-2' : 'grid-cols-1',
                        )}
                    >
                        {entries.length > 0 &&
                            picker(
                                <Button
                                    variant="outline"
                                    className="h-14 rounded-lg text-[15px] font-bold"
                                >
                                    <Plus /> Añadir ejercicio
                                </Button>,
                            )}
                        <NotesPanel session={session} />
                    </div>
                </div>
            )}

            {rest && !isDesktop && (
                <RestTimer
                    key={rest.key}
                    seconds={rest.seconds}
                    onSkip={() => setRest(null)}
                />
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Top bar                                                                    */
/* -------------------------------------------------------------------------- */

function TopBar({
    session,
    finished,
    totalWorking,
    totalPlanned,
    pendingSets,
    addTrigger,
    onBackToSummary,
}: {
    session: WorkoutSession;
    finished: boolean;
    totalWorking: number;
    totalPlanned: number;
    pendingSets: number;
    addTrigger: ReactNode;
    onBackToSummary?: () => void;
}) {
    const now = useNow(!finished);
    const end = session.finished_at
        ? new Date(session.finished_at).getTime()
        : now;
    const elapsed = (end - new Date(session.started_at).getTime()) / 1000;
    const progress =
        totalPlanned > 0
            ? `${totalWorking} de ${totalPlanned} series`
            : `${totalWorking} ${totalWorking === 1 ? 'serie' : 'series'}`;

    const action = onBackToSummary ? (
        <Button
            variant="outline"
            className="h-11 border-primary px-4 font-bold text-primary-text"
            onClick={onBackToSummary}
        >
            Ver resumen
        </Button>
    ) : (
        <FinishPanel session={session} pendingSets={pendingSets} />
    );

    return (
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur max-md:pt-[env(safe-area-inset-top)]">
            {/* Phone */}
            <div className="flex items-center gap-3 px-4 py-3 xl:hidden">
                <Button
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-md"
                    asChild
                >
                    <Link
                        href={onBackToSummary ? workouts.index() : dashboard()}
                        aria-label="Minimizar entrenamiento"
                    >
                        <ChevronDown className="size-5" />
                    </Link>
                </Button>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-extrabold tracking-[0.12em] text-muted-foreground uppercase">
                        {session.name}
                    </span>
                    <span
                        className={cn(
                            'font-num text-[28px] leading-none',
                            !finished && 'text-primary-text',
                        )}
                        aria-label={`Tiempo: ${formatElapsed(elapsed)}`}
                        suppressHydrationWarning
                    >
                        {formatElapsed(elapsed)}
                    </span>
                </div>
                {action}
            </div>

            {/* Desktop */}
            <div className="hidden items-center gap-5 px-8 py-4 xl:flex">
                <Button
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-md"
                    asChild
                >
                    <Link href={workouts.index()} aria-label="Volver">
                        <ArrowLeft className="size-5" />
                    </Link>
                </Button>
                <h1 className="truncate font-num text-3xl uppercase">
                    {session.name}
                </h1>
                <span
                    className={cn(
                        'font-num text-3xl',
                        !finished && 'text-primary-text',
                    )}
                    suppressHydrationWarning
                >
                    {formatElapsed(elapsed)}
                </span>
                <span className="text-sm text-muted-foreground">
                    {progress}, {formatGrouped(session.volume_kg ?? 0)} kg
                </span>
                <div className="ml-auto flex items-center gap-3">
                    {addTrigger}
                    {action}
                </div>
            </div>
        </header>
    );
}

function FinishPanel({
    session,
    pendingSets,
}: {
    session: WorkoutSession;
    pendingSets: number;
}) {
    const [open, setOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [processing, setProcessing] = useState(false);

    const finish = () =>
        router.post(
            workouts.finish.url(session.id),
            {},
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setOpen(false);
                    window.scrollTo({ top: 0 });
                },
            },
        );

    const destroy = () =>
        router.delete(workouts.destroy.url(session.id), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                setConfirmDelete(false);
            }}
            title={
                confirmDelete
                    ? '¿Eliminar entrenamiento?'
                    : '¿Terminar entrenamiento?'
            }
            description={
                confirmDelete
                    ? 'Se borrarán todas sus series. Esta acción no se puede deshacer.'
                    : pendingSets > 0
                      ? `Te ${pendingSets === 1 ? 'queda 1 serie planificada' : `quedan ${pendingSets} series planificadas`}. Puedes terminar igualmente.`
                      : 'Has completado todas las series planificadas.'
            }
            trigger={
                <Button
                    variant="outline"
                    className="h-11 shrink-0 border-primary px-4 font-bold text-primary-text hover:text-primary-text"
                >
                    <span className="xl:hidden">Finalizar</span>
                    <span className="hidden xl:inline">
                        Finalizar entrenamiento
                    </span>
                </Button>
            }
        >
            {confirmDelete ? (
                <div className="grid gap-2">
                    <Button
                        variant="destructive"
                        className="h-14 text-base font-bold"
                        disabled={processing}
                        onClick={destroy}
                    >
                        <Trash2 /> Eliminar entrenamiento
                    </Button>
                    <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => setConfirmDelete(false)}
                    >
                        Cancelar
                    </Button>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Button
                        size="workout"
                        disabled={processing}
                        onClick={finish}
                    >
                        Terminar entrenamiento
                    </Button>
                    <Button
                        variant="outline"
                        className="h-12 font-bold"
                        onClick={() => setOpen(false)}
                    >
                        Seguir entrenando
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-11 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 /> Eliminar entrenamiento
                    </Button>
                </div>
            )}
        </ResponsivePanel>
    );
}

/* -------------------------------------------------------------------------- */
/* Exercise navigation                                                        */
/* -------------------------------------------------------------------------- */

function ExerciseProgress({
    entries,
    currentIndex,
    workingCount,
    onSelect,
}: {
    entries: Entry[];
    currentIndex: number;
    workingCount: (exerciseId: number) => number;
    onSelect: (index: number) => void;
}) {
    const current = entries[currentIndex];
    const done = workingCount(current.exercise.id);
    const planned = plannedSets(current);

    return (
        <nav aria-label="Ejercicios del entrenamiento">
            <div className="flex items-center">
                <button
                    type="button"
                    className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground disabled:opacity-30"
                    aria-label="Ejercicio anterior"
                    disabled={currentIndex === 0}
                    onClick={() => onSelect(currentIndex - 1)}
                >
                    <ChevronLeft className="size-5" />
                </button>
                <p
                    className="flex flex-1 justify-between text-xs font-extrabold tracking-[0.12em] text-muted-foreground uppercase"
                    aria-live="polite"
                >
                    <span>
                        Ejercicio {currentIndex + 1} de {entries.length}
                    </span>
                    <span>
                        {planned > 0
                            ? `${done} / ${planned} series`
                            : `${done} ${done === 1 ? 'serie' : 'series'}`}
                    </span>
                </p>
                <button
                    type="button"
                    className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground disabled:opacity-30"
                    aria-label="Ejercicio siguiente"
                    disabled={currentIndex === entries.length - 1}
                    onClick={() => onSelect(currentIndex + 1)}
                >
                    <ChevronRight className="size-5" />
                </button>
            </div>
            <ol className="-mt-2 flex gap-1.5">
                {entries.map((entry, index) => {
                    const count = workingCount(entry.exercise.id);
                    const total = plannedSets(entry);
                    const complete = total > 0 && count >= total;

                    return (
                        <li key={entry.exercise.id} className="flex-1">
                            <button
                                type="button"
                                onClick={() => onSelect(index)}
                                aria-current={
                                    index === currentIndex ? 'step' : undefined
                                }
                                aria-label={`${entry.exercise.name}: ${count}${total ? ` de ${total}` : ''} series${complete ? ', completado' : ''}`}
                                className="flex h-6 w-full items-center"
                            >
                                <span
                                    className={cn(
                                        'h-1.5 w-full rounded-full',
                                        index === currentIndex
                                            ? 'bg-primary'
                                            : complete
                                              ? 'bg-primary/45'
                                              : 'bg-border',
                                    )}
                                />
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function ExerciseRail({
    entries,
    currentIndex,
    workingCount,
    onSelect,
}: {
    entries: Entry[];
    currentIndex: number;
    workingCount: (exerciseId: number) => number;
    onSelect: (index: number) => void;
}) {
    return (
        <nav aria-label="Ejercicios del entrenamiento">
            <ol className="flex flex-col gap-2">
                {entries.map((entry, index) => {
                    const count = workingCount(entry.exercise.id);
                    const total = plannedSets(entry);
                    const selected = index === currentIndex;

                    return (
                        <li key={entry.exercise.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(index)}
                                aria-current={selected ? 'step' : undefined}
                                className={cn(
                                    'flex w-full flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:border-foreground/40',
                                    selected && 'border-primary',
                                )}
                            >
                                <span className="flex w-full items-start justify-between gap-2">
                                    <span className="text-sm leading-tight font-bold">
                                        {entry.exercise.name}
                                    </span>
                                    <span
                                        className={cn(
                                            'font-num text-[13px]',
                                            selected
                                                ? 'text-primary-text'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {count}
                                        {total > 0 && `/${total}`}
                                    </span>
                                </span>
                                <span className="h-1 w-full overflow-hidden rounded-full bg-border">
                                    <span
                                        className="block h-full rounded-full bg-primary"
                                        style={{
                                            width: `${total > 0 ? Math.min(100, (count / total) * 100) : count > 0 ? 100 : 0}%`,
                                        }}
                                    />
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/* -------------------------------------------------------------------------- */
/* Current exercise                                                           */
/* -------------------------------------------------------------------------- */

function ExerciseView({
    session,
    entry,
    sets,
    recordSetIds,
    isDesktop,
    loggerSlot,
    celebration,
    onLogged,
    onRemove,
    onSwipe,
}: {
    session: WorkoutSession;
    entry: Entry;
    sets: WorkoutSet[];
    recordSetIds: Set<number>;
    isDesktop: boolean;
    /** Where to render the logger on desktop when it is not next to the table. */
    loggerSlot?: HTMLElement | null;
    celebration: string | null;
    onLogged: (set: SetValues) => void;
    onRemove?: () => void;
    onSwipe: (direction: 1 | -1) => void;
}) {
    const { exercise, suggestion, target } = entry;
    const trackingType = exercise.tracking_type;
    const [editing, setEditing] = useState<WorkoutSet | null>(null);
    const touch = useRef<{ x: number; y: number } | null>(null);
    const working = sets.filter((set) => !set.is_warmup);
    const planned = plannedSets(entry);
    const columns = setColumns(trackingType);
    let workingIndex = 0;
    const rows = sets.map((set) => {
        workingIndex += set.is_warmup ? 0 : 1;

        return {
            key: set.id,
            index: workingIndex,
            values: columns.map((column) => column.value(set)),
            rpe: set.rpe,
            warmup: set.is_warmup,
            targetMet: meetsTarget(set, suggestion, trackingType),
            personalRecord: recordSetIds.has(set.id),
            summary: formatSet(set, trackingType),
            onEdit: () => setEditing(set),
        };
    });

    const swipeHandlers = {
        onTouchStart: (event: TouchEvent) => {
            const point = event.touches[0];

            touch.current = { x: point.clientX, y: point.clientY };
        },
        onTouchEnd: (event: TouchEvent) => {
            const start = touch.current;
            const point = event.changedTouches[0];

            touch.current = null;

            if (!start) {
                return;
            }

            const dx = point.clientX - start.x;
            const dy = point.clientY - start.y;

            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                onSwipe(dx < 0 ? 1 : -1);
            }
        },
    };

    const target_ = targetLabel(entry);
    const suggestionBlock = suggestion ? (
        <div>
            <SuggestionCallout
                suggestion={{
                    ...suggestion,
                    last_performance:
                        suggestion.last_performance && target_
                            ? `${suggestion.last_performance} · Objetivo ${target_}`
                            : suggestion.last_performance,
                }}
            />
            {!suggestion.last_performance && target_ && (
                <p className="mt-1.5 px-1 text-xs text-muted-foreground">
                    Objetivo {target_}
                </p>
            )}
        </div>
    ) : entry.loading ? (
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
    ) : target_ ? (
        <p className="text-sm text-muted-foreground">Objetivo {target_}</p>
    ) : null;

    const table =
        rows.length > 0 || (isDesktop && planned > 0) ? (
            <SetsTable
                columns={columns.map((column) => column.label)}
                rows={rows}
                planned={isDesktop ? Math.max(0, planned - working.length) : 0}
                nextIndex={working.length + 1}
            />
        ) : null;

    const banner = celebration && (
        <div aria-live="polite">
            <TargetMetBanner detail={celebration} />
        </div>
    );

    const logger = (
        <SetLoggerCard
            sessionId={session.id}
            exercise={exercise}
            suggestion={suggestion}
            target={target}
            nextSetNumber={working.length + 1}
            shortcuts={isDesktop}
            onLogged={onLogged}
        />
    );

    const editPanel = (
        <ResponsivePanel
            open={editing !== null}
            onOpenChange={(open) => !open && setEditing(null)}
            title="Editar serie"
            description={exercise.name}
        >
            {editing && (
                <EditSetForm
                    key={editing.id}
                    sessionId={session.id}
                    set={editing}
                    trackingType={trackingType}
                    onDone={() => setEditing(null)}
                />
            )}
        </ResponsivePanel>
    );

    const removeButton = onRemove && (
        <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-md bg-background/80"
            aria-label="Quitar ejercicio"
            onClick={onRemove}
        >
            <X />
        </Button>
    );

    if (isDesktop) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
                    <ExercisePhoto
                        exercise={exercise}
                        className="aspect-[4/3] self-start"
                    />
                    <div className="flex min-w-0 flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <h2
                                className={cn(
                                    'font-num leading-[0.95] uppercase',
                                    exercise.name.length > 34
                                        ? 'text-[26px]'
                                        : exercise.name.length > 20
                                          ? 'text-[32px]'
                                          : 'text-[44px]',
                                )}
                            >
                                {exercise.name}
                            </h2>
                            {removeButton}
                        </div>
                        <MuscleChips exercise={exercise} />
                        {target?.notes && (
                            <p className="text-sm text-muted-foreground italic">
                                {target.notes}
                            </p>
                        )}
                        {!loggerSlot && suggestionBlock}
                    </div>
                </div>
                {loggerSlot && suggestionBlock}
                <div
                    className={cn(
                        'grid items-start gap-5',
                        !loggerSlot && 'grid-cols-2',
                    )}
                >
                    <div className="flex flex-col gap-3 rounded-xl bg-card p-3.5">
                        {table ?? (
                            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                                Aún no hay series. Registra la primera.
                            </p>
                        )}
                        {banner}
                    </div>
                    {loggerSlot ? createPortal(logger, loggerSlot) : logger}
                </div>
                {editPanel}
            </div>
        );
    }

    return (
        <>
            <section
                aria-label={exercise.name}
                className="overflow-hidden rounded-xl border bg-card"
                {...swipeHandlers}
            >
                <ExercisePhoto exercise={exercise} overlay>
                    <div className="flex items-end justify-between gap-2">
                        <div className="flex min-w-0 flex-col gap-2">
                            <h2
                                className={cn(
                                    'font-num leading-[0.95] text-white uppercase [text-shadow:0_1px_12px_rgb(0_0_0/0.5)]',
                                    exercise.name.length > 24
                                        ? 'text-[23px]'
                                        : 'text-[28px]',
                                )}
                            >
                                {exercise.name}
                            </h2>
                            <MuscleChips exercise={exercise} />
                        </div>
                        {removeButton}
                    </div>
                </ExercisePhoto>
                <div className="flex flex-col gap-4 p-3">
                    {target?.notes && (
                        <p className="text-sm text-muted-foreground italic">
                            {target.notes}
                        </p>
                    )}
                    {suggestionBlock}
                    {table}
                    {banner}
                </div>
            </section>
            {logger}
            {editPanel}
        </>
    );
}

function ExercisePhoto({
    exercise,
    overlay = false,
    className,
    children,
}: {
    exercise: Exercise;
    overlay?: boolean;
    className?: string;
    children?: ReactNode;
}) {
    const [frame, setFrame] = useState<'start' | 'end'>('start');
    const [failed, setFailed] = useState<string[]>([]);
    const source =
        frame === 'end' && exercise.image_alt_url
            ? exercise.image_alt_url
            : exercise.image_url;
    const visible = source && !failed.includes(source) ? source : null;

    return (
        <div
            className={cn(
                'relative overflow-hidden bg-muted',
                overlay ? 'aspect-video' : 'rounded-xl',
                className,
            )}
        >
            {visible ? (
                <img
                    src={visible}
                    alt={`${exercise.name}, posición ${frame === 'start' ? 'inicial' : 'final'}`}
                    className="absolute inset-0 size-full bg-white object-cover"
                    onError={() =>
                        setFailed((current) => [...current, visible])
                    }
                />
            ) : (
                <div className="absolute inset-0 grid place-items-center bg-knurl text-muted-foreground">
                    <Dumbbell className="size-10" aria-hidden />
                </div>
            )}
            {overlay && (
                <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_top,var(--card)_0%,rgb(0_0_0/0.55)_45%,transparent_75%)]"
                />
            )}
            {exercise.image_alt_url && exercise.image_url && (
                <div
                    role="group"
                    aria-label="Posición del ejercicio"
                    className="absolute top-2.5 right-2.5 flex rounded-md bg-black/70 p-1 backdrop-blur"
                >
                    {(['start', 'end'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={frame === option}
                            onClick={() => setFrame(option)}
                            className={cn(
                                'h-9 min-w-14 rounded-[8px] px-3 text-[13px] font-bold transition-colors',
                                frame === option
                                    ? 'bg-white text-[#18181b]'
                                    : 'text-white',
                            )}
                        >
                            {option === 'start' ? 'Inicio' : 'Final'}
                        </button>
                    ))}
                </div>
            )}
            {children && (
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                    {children}
                </div>
            )}
        </div>
    );
}

function MuscleChips({ exercise }: { exercise: Exercise }) {
    const muscles = [
        ...(exercise.primary_muscles ?? []),
        ...(exercise.secondary_muscles ?? []),
    ].filter(
        (muscle, index, all) =>
            all.findIndex((other) => other.id === muscle.id) === index,
    );
    const color = BODY_ZONE_COLORS[exercise.body_zone ?? 'superior'];

    if (muscles.length === 0) {
        return null;
    }

    return (
        <ul className="flex flex-wrap gap-1.5" aria-label="Músculos">
            {muscles.slice(0, 4).map((muscle) => (
                <li
                    key={muscle.id}
                    className="rounded-[6px] px-2 py-0.5 text-xs font-bold"
                    style={{
                        color,
                        backgroundColor: `color-mix(in oklab, ${color} 22%, #18181b)`,
                    }}
                >
                    {muscle.name}
                </li>
            ))}
        </ul>
    );
}

function EmptyWorkout({ trigger }: { trigger: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
            <Dumbbell className="size-10 text-muted-foreground" aria-hidden />
            <div>
                <h2 className="font-num text-xl uppercase">
                    Entrenamiento libre
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Añade tu primer ejercicio para empezar a registrar series.
                </p>
            </div>
            <div className="w-full max-w-sm">{trigger}</div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Rest & notes                                                               */
/* -------------------------------------------------------------------------- */

function RestIdle({
    seconds,
    onStart,
}: {
    seconds: number;
    onStart: (seconds: number) => void;
}) {
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="h-1.5 bg-hazard" aria-hidden />
            <div className="flex flex-col items-center gap-3 p-4 pt-3">
                <span className="text-[13px] font-bold text-muted-foreground">
                    Descanso
                </span>
                <div className="grid size-40 place-items-center rounded-full border-[10px] border-border">
                    <span className="font-num text-[40px] leading-none">
                        {formatDuration(seconds)}
                    </span>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    Empieza solo al guardar una serie.
                </p>
                <Button
                    variant="outline"
                    className="h-12 w-full font-bold"
                    onClick={() => onStart(seconds)}
                >
                    Empezar ahora
                </Button>
            </div>
        </div>
    );
}

/**
 * Desktop notes: saved when the field loses focus.
 */
function NotesField({ session }: { session: WorkoutSession }) {
    const form = useForm({ notes: session.notes ?? '' });

    const save = () => {
        if (!form.isDirty) {
            return;
        }

        form.put(workouts.update.url(session.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
                toast.success('Notas guardadas');
            },
        });
    };

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor="workout-notes" className="text-sm font-bold">
                Notas del entrenamiento
            </label>
            <Textarea
                id="workout-notes"
                value={form.data.notes}
                maxLength={2000}
                rows={6}
                placeholder="Cómo te has sentido, molestias, ajustes..."
                onChange={(event) => form.setData('notes', event.target.value)}
                onBlur={save}
            />
            <InputError message={form.errors.notes} />
            <p className="text-xs text-muted-foreground">
                {form.processing
                    ? 'Guardando…'
                    : form.isDirty
                      ? 'Se guardan al salir del campo.'
                      : form.data.notes.length > 0
                        ? 'Guardadas.'
                        : ''}
            </p>
        </div>
    );
}

function NotesPanel({ session }: { session: WorkoutSession }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ notes: session.notes ?? '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(workouts.update.url(session.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
                setOpen(false);
                toast.success('Notas guardadas');
            },
        });
    };

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={setOpen}
            title="Notas"
            description="Cómo te has sentido, molestias, ajustes."
            trigger={
                <Button
                    variant="outline"
                    className="h-14 rounded-lg text-[15px] font-bold"
                >
                    <StickyNote /> Notas
                    {session.notes && (
                        <span className="sr-only"> (tiene notas)</span>
                    )}
                </Button>
            }
        >
            <form onSubmit={submit} className="grid gap-3">
                <Textarea
                    value={form.data.notes}
                    maxLength={2000}
                    rows={5}
                    aria-label="Notas del entrenamiento"
                    placeholder="¿Cómo te has sentido? ¿Alguna molestia?"
                    onChange={(event) =>
                        form.setData('notes', event.target.value)
                    }
                />
                <InputError message={form.errors.notes} />
                <Button
                    type="submit"
                    className="h-12 font-bold"
                    disabled={form.processing || !form.isDirty}
                >
                    Guardar notas
                </Button>
            </form>
        </ResponsivePanel>
    );
}
