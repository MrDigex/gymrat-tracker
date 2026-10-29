import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    LineChart as LineChartIcon,
    MoreHorizontal,
    Pencil,
    Trash2,
    TrendingDown,
    TrendingUp,
    Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { ExerciseImage } from '@/components/exercise-image';
import { MuscleChip } from '@/components/exercises/muscle-chip';
import { SuggestionCallout } from '@/components/gymrat/suggestion-callout';
import { Button } from '@/components/ui/button';
import type { ChartConfig } from '@/components/ui/chart';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { progressChartConfig } from '@/lib/chart-colors';
import {
    formatDate,
    formatDuration,
    formatKg,
    formatNumber,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import exercises from '@/routes/exercises';
import workouts from '@/routes/workouts';
import type { Exercise, ExerciseProgressPoint, Suggestion } from '@/types';

type HistoryPoint = ExerciseProgressPoint & {
    session_id: number;
    sets: number;
    best_distance_m: number | null;
    best_set: { weight_kg: number | null; reps: number | null } | null;
};

type MetricKey = keyof typeof progressChartConfig;

type Metric = {
    key: MetricKey;
    label: string;
    /** Full value, e.g. "90 kg". */
    format: (value: number | null) => string;
    /** Big number and its unit, shown apart. */
    split: (value: number) => { value: string; unit?: string };
    /** Whether a lower value is better (timed distances). */
    lowerIsBetter?: boolean;
};

const WINDOW_WEEKS = 8;
const RECENT_ROWS = 8;

const kgMetric = (key: MetricKey, label: string): Metric => ({
    key,
    label,
    format: formatKg,
    split: (value) => ({ value: formatNumber(value), unit: 'kg' }),
});

/**
 * Metrics charted for each tracking type. The first one is the headline.
 */
function metricsFor(exercise: Exercise): Metric[] {
    switch (exercise.tracking_type) {
        case 'weight_reps':
            return [
                kgMetric('estimated_1rm', '1RM estimado'),
                kgMetric('max_weight_kg', 'Peso máximo'),
            ];
        case 'reps':
            return [
                {
                    key: 'max_reps',
                    label: 'Máx. repeticiones',
                    format: formatNumber,
                    split: (value) => ({
                        value: formatNumber(value),
                        unit: 'reps',
                    }),
                },
            ];
        default:
            return [
                {
                    key: 'best_duration_seconds',
                    label: 'Mejor tiempo',
                    format: formatDuration,
                    split: (value) => ({ value: formatDuration(value) }),
                    lowerIsBetter: exercise.tracking_type === 'distance_time',
                },
            ];
    }
}

/**
 * Best set of a session, e.g. "67,5 × 10" (the set with the highest estimated 1RM).
 */
function bestSet(exercise: Exercise, point: HistoryPoint): string {
    switch (exercise.tracking_type) {
        case 'weight_reps': {
            const best = point.best_set;

            if (best?.weight_kg && best.reps) {
                return `${formatNumber(best.weight_kg)} × ${best.reps}`;
            }

            return point.max_weight_kg
                ? formatKg(point.max_weight_kg)
                : point.max_reps
                  ? `${point.max_reps} reps`
                  : '—';
        }
        case 'reps':
            return point.max_reps ? `${point.max_reps} reps` : '—';
        case 'time':
            return formatDuration(point.best_duration_seconds);
        default:
            return point.best_distance_m
                ? `${formatNumber(point.best_distance_m)} m en ${formatDuration(point.best_duration_seconds)}`
                : formatDuration(point.best_duration_seconds);
    }
}

export default function ExerciseShow({
    exercise,
    history,
    suggestion,
}: {
    exercise: Exercise;
    history: HistoryPoint[];
    suggestion: Suggestion;
}) {
    const [frame, setFrame] = useState<'start' | 'end'>('start');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const metrics = metricsFor(exercise);
    const headline = metrics[0];
    const instructions = exercise.instructions ?? [];
    const recent = [...history].reverse();
    const visibleRows = showAll ? recent : recent.slice(0, RECENT_ROWS);

    const values = history
        .map((point) => point[headline.key])
        .filter((value): value is number => value !== null);
    const best =
        values.length > 0
            ? headline.lowerIsBetter
                ? Math.min(...values)
                : Math.max(...values)
            : null;

    const details = [
        exercise.equipment_label,
        exercise.level_label,
        exercise.mechanic_label,
    ].filter(Boolean);
    const zone =
        exercise.body_zone === 'cuerpo_completo' ? null : exercise.body_zone;

    const thirdColumn =
        exercise.tracking_type === 'weight_reps'
            ? '1RM est.'
            : exercise.tracking_type === 'reps'
              ? 'Total reps'
              : 'Series';

    return (
        <>
            <Head title={exercise.name} />

            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pb-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:px-9 lg:pt-6">
                {/* Left column on desktop: photo, name, muscles and technique */}
                <div className="contents lg:flex lg:flex-col lg:gap-6">
                    <section className="order-1 flex flex-col gap-3">
                        <div
                            className={cn(
                                'relative -mx-4 overflow-hidden lg:mx-0 lg:rounded-xl',
                                // Hyrox SVG cards start with #18181b: a top band
                                // keeps the buttons off the HYROX label.
                                exercise.is_hyrox
                                    ? 'bg-[#18181b] pt-16'
                                    : 'bg-muted',
                            )}
                        >
                            <ExerciseImage
                                exercise={
                                    frame === 'end' && exercise.image_alt_url
                                        ? {
                                              ...exercise,
                                              image_url: exercise.image_alt_url,
                                          }
                                        : exercise
                                }
                                animate={false}
                                className={cn(
                                    exercise.is_hyrox
                                        ? 'aspect-[3/2] bg-[#18181b]'
                                        : 'aspect-[4/3]',
                                )}
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/70 to-transparent" />

                            <Link
                                href={exercises.index()}
                                aria-label="Volver a ejercicios"
                                className="absolute top-3 left-3 grid size-11 place-items-center rounded-lg bg-background/80 backdrop-blur outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                            >
                                <ChevronLeft className="size-6" />
                            </Link>

                            {exercise.can_edit && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        aria-label="Más opciones"
                                        className="absolute top-3 right-3 grid size-11 place-items-center rounded-lg bg-background/80 backdrop-blur outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                                    >
                                        <MoreHorizontal className="size-6" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={exercises.edit(
                                                    exercise.id,
                                                )}
                                            >
                                                <Pencil /> Editar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() =>
                                                setConfirmDelete(true)
                                            }
                                        >
                                            <Trash2 /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {exercise.image_alt_url && (
                                <div
                                    role="group"
                                    aria-label="Posición en la imagen"
                                    className="absolute right-3 bottom-3 flex rounded-lg bg-background/85 p-1 backdrop-blur"
                                >
                                    {(
                                        [
                                            ['start', 'Inicio'],
                                            ['end', 'Final'],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={frame === value}
                                            onClick={() => setFrame(value)}
                                            className={cn(
                                                'h-9 min-w-16 rounded-[10px] px-3 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                                                frame === value
                                                    ? 'bg-foreground text-background'
                                                    : 'text-foreground',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <h1 className="font-num text-[32px] leading-[0.95] break-words uppercase lg:text-[44px]">
                            {exercise.name}
                        </h1>

                        <div className="flex flex-wrap gap-1.5">
                            <span
                                className={cn(
                                    'rounded-sm px-2.5 py-1 text-[13px] font-extrabold',
                                    exercise.is_hyrox
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground',
                                )}
                            >
                                {exercise.category_label}
                            </span>
                            {details.map((detail) => (
                                <span
                                    key={detail}
                                    className="rounded-sm border px-2.5 py-1 text-[13px] font-semibold"
                                >
                                    {detail}
                                </span>
                            ))}
                            {exercise.is_custom && (
                                <span className="rounded-sm border border-primary px-2.5 py-1 text-[13px] font-semibold text-primary-text">
                                    Propio
                                </span>
                            )}
                        </div>
                    </section>

                    <section
                        aria-labelledby="muscles-title"
                        className="order-4 space-y-2.5"
                    >
                        <h2
                            id="muscles-title"
                            className="text-lg font-extrabold"
                        >
                            Músculos
                        </h2>
                        <MuscleRow
                            title="Principal"
                            muscles={exercise.primary_muscles}
                            zone={zone}
                        />
                        <MuscleRow
                            title="Secundarios"
                            muscles={exercise.secondary_muscles}
                            zone={zone}
                            variant="outline"
                        />
                    </section>

                    <section
                        aria-labelledby="steps-title"
                        className="order-5 space-y-3"
                    >
                        <h2 id="steps-title" className="text-lg font-extrabold">
                            Cómo se hace
                        </h2>
                        {instructions.length > 0 ? (
                            <ol className="space-y-3">
                                {instructions.map((step, index) => (
                                    <li
                                        key={index}
                                        className="flex gap-3 text-[15px] leading-snug"
                                    >
                                        <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-muted font-num text-sm">
                                            {index + 1}
                                        </span>
                                        <span className="pt-0.5">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Este ejercicio no tiene instrucciones.
                            </p>
                        )}
                    </section>
                </div>

                {/* Right column on desktop: coach tip, progress and history */}
                <div className="contents lg:sticky lg:top-4 lg:flex lg:flex-col lg:gap-6">
                    <SuggestionCallout
                        suggestion={suggestion}
                        className="order-2"
                    />

                    <ProgressCard
                        className="order-3"
                        history={history}
                        metrics={metrics}
                    />

                    {recent.length > 0 && (
                        <section
                            aria-labelledby="history-title"
                            className="order-6 space-y-2"
                        >
                            <h2
                                id="history-title"
                                className="text-lg font-extrabold"
                            >
                                Historial
                            </h2>
                            <table className="w-full text-[15px]">
                                <thead>
                                    <tr className="border-b text-left text-[13px] text-muted-foreground">
                                        <th className="py-2 font-medium">
                                            Fecha
                                        </th>
                                        <th className="py-2 font-medium">
                                            Mejor serie
                                        </th>
                                        <th className="py-2 text-right font-medium">
                                            {thirdColumn}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRows.map((point) => {
                                        const isRecord =
                                            best !== null &&
                                            history.length > 1 &&
                                            point[headline.key] === best;

                                        return (
                                            <tr
                                                key={point.session_id}
                                                className="border-b"
                                            >
                                                <td className="py-3.5">
                                                    <Link
                                                        href={workouts.show(
                                                            point.session_id,
                                                        )}
                                                        className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    >
                                                        {formatDate(
                                                            point.date,
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                            },
                                                        )}
                                                    </Link>
                                                </td>
                                                <td
                                                    className={cn(
                                                        'py-3.5 font-num',
                                                        isRecord &&
                                                            'text-primary-text',
                                                    )}
                                                >
                                                    <span className="inline-flex items-center gap-1.5">
                                                        {bestSet(
                                                            exercise,
                                                            point,
                                                        )}
                                                        {isRecord && (
                                                            <Trophy
                                                                className="size-4"
                                                                aria-label="Récord"
                                                            />
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-right font-num">
                                                    {exercise.tracking_type ===
                                                    'weight_reps'
                                                        ? formatNumber(
                                                              point.estimated_1rm,
                                                          )
                                                        : exercise.tracking_type ===
                                                            'reps'
                                                          ? formatNumber(
                                                                point.total_reps,
                                                            )
                                                          : point.sets}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {recent.length > RECENT_ROWS && (
                                <Button
                                    variant="ghost"
                                    className="h-11 w-full font-bold"
                                    onClick={() => setShowAll(!showAll)}
                                >
                                    {showAll
                                        ? 'Ver menos'
                                        : `Ver las ${recent.length} sesiones`}
                                </Button>
                            )}
                        </section>
                    )}
                </div>
            </div>

            {exercise.can_edit && (
                <DeleteExerciseDialog
                    exercise={exercise}
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                />
            )}
        </>
    );
}

function ProgressCard({
    history,
    metrics,
    className,
}: {
    history: HistoryPoint[];
    metrics: Metric[];
    className?: string;
}) {
    const headline = metrics[0];
    const since = new Date();
    since.setDate(since.getDate() - WINDOW_WEEKS * 7);
    const sinceDay = since.toISOString().slice(0, 10);
    const windowed = history.filter((point) => point.date >= sinceDay);
    // Fall back to the whole history when the last 8 weeks are too sparse.
    const useWindow = windowed.length >= 2;
    const data = useWindow ? windowed : history;
    const caption = `${headline.label}, ${useWindow ? `${WINDOW_WEEKS} semanas` : 'todo el historial'}`;

    const points = data.filter((point) => point[headline.key] !== null);
    const latest = points.at(-1)?.[headline.key] ?? null;
    const first = points.at(0)?.[headline.key] ?? null;
    const delta =
        latest !== null && first !== null && points.length > 1
            ? latest - first
            : null;
    const improved =
        delta !== null && (headline.lowerIsBetter ? delta < 0 : delta > 0);

    const chartConfig = Object.fromEntries(
        metrics.map((metric) => [metric.key, progressChartConfig[metric.key]]),
    ) satisfies ChartConfig;

    return (
        <section
            aria-labelledby="progress-title"
            className={cn('rounded-xl bg-card p-4', className)}
        >
            <div className="flex items-baseline justify-between gap-3">
                <h2 id="progress-title" className="text-lg font-extrabold">
                    Tu progreso
                </h2>
                {history.length > 0 && (
                    <span className="text-[13px] text-muted-foreground">
                        {caption}
                    </span>
                )}
            </div>

            {history.length === 0 ? (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
                    <LineChartIcon className="size-8 text-muted-foreground" />
                    <p className="font-bold">
                        Todavía no has registrado este ejercicio
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Añádelo a una rutina o a tu próximo entrenamiento y aquí
                        verás tu evolución.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4">
                        <div>
                            {latest !== null && (
                                <p className="flex items-baseline gap-1">
                                    <span className="font-num text-[44px] leading-none text-primary-text">
                                        {headline.split(latest).value}
                                    </span>
                                    {headline.split(latest).unit && (
                                        <span className="text-sm text-muted-foreground">
                                            {headline.split(latest).unit}
                                        </span>
                                    )}
                                </p>
                            )}
                            {delta !== null && delta !== 0 && (
                                <p
                                    className={cn(
                                        'mt-1 flex items-center gap-1 text-xs font-bold',
                                        improved
                                            ? 'text-trend-up'
                                            : 'text-trend-down',
                                    )}
                                >
                                    {delta > 0 ? (
                                        <TrendingUp
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                    ) : (
                                        <TrendingDown
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                    )}
                                    {delta > 0 ? '+' : '−'}
                                    {headline.format(Math.abs(delta))}
                                </p>
                            )}
                        </div>

                        <ChartContainer
                            config={chartConfig}
                            className="aspect-auto h-20 w-full lg:h-36"
                        >
                            <LineChart
                                data={data}
                                margin={{
                                    left: 4,
                                    right: 6,
                                    top: 6,
                                    bottom: 2,
                                }}
                            >
                                <XAxis dataKey="date" hide />
                                <YAxis hide domain={['auto', 'auto']} />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(_, payload) =>
                                                formatDate(
                                                    (
                                                        payload[0]?.payload as
                                                            | HistoryPoint
                                                            | undefined
                                                    )?.date,
                                                )
                                            }
                                            formatter={(value, name) => {
                                                const metric = metrics.find(
                                                    (item) => item.key === name,
                                                );

                                                return (
                                                    <div className="flex w-full justify-between gap-4">
                                                        <span className="text-muted-foreground">
                                                            {metric?.label}
                                                        </span>
                                                        <span className="font-medium tabular-nums">
                                                            {metric
                                                                ? metric.format(
                                                                      Number(
                                                                          value,
                                                                      ),
                                                                  )
                                                                : String(value)}
                                                        </span>
                                                    </div>
                                                );
                                            }}
                                        />
                                    }
                                />
                                {[...metrics].reverse().map((metric) => (
                                    <Line
                                        key={metric.key}
                                        dataKey={metric.key}
                                        type="monotone"
                                        stroke={`var(--color-${metric.key})`}
                                        strokeWidth={
                                            metric === headline ? 3 : 2
                                        }
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                        connectNulls
                                    />
                                ))}
                            </LineChart>
                        </ChartContainer>
                    </div>

                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-bold">
                        {metrics.map((metric) => (
                            <li
                                key={metric.key}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    aria-hidden
                                    className="h-[3px] w-3.5 rounded-full"
                                    style={{
                                        background:
                                            progressChartConfig[metric.key]
                                                .color,
                                    }}
                                />
                                {metric.label}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}

function MuscleRow({
    title,
    muscles,
    zone,
    variant = 'solid',
}: {
    title: string;
    muscles: Exercise['primary_muscles'];
    zone: Exercise['body_zone'];
    variant?: 'solid' | 'outline';
}) {
    return (
        <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-2">
            <span className="pt-1 text-sm text-muted-foreground">{title}</span>
            {muscles && muscles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {muscles.map((muscle) => (
                        <MuscleChip
                            key={muscle.id}
                            zone={muscle.body_zone ?? zone}
                            variant={variant}
                            className="px-2.5 py-1 text-[13px]"
                        >
                            {muscle.name}
                        </MuscleChip>
                    ))}
                </div>
            ) : (
                <span className="pt-1 text-sm text-muted-foreground">—</span>
            )}
        </div>
    );
}

function DeleteExerciseDialog({
    exercise,
    open,
    onOpenChange,
}: {
    exercise: Exercise;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [deleting, setDeleting] = useState(false);

    const destroy = () => {
        setDeleting(true);
        router.delete(exercises.destroy.url(exercise.id), {
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Eliminar «{exercise.name}»?</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={deleting}
                        onClick={destroy}
                    >
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

ExerciseShow.layout = ({ exercise }: { exercise: Exercise }) => ({
    breadcrumbs: [
        { title: 'Ejercicios', href: exercises.index() },
        { title: exercise.name, href: exercises.show(exercise.id) },
    ],
});
