import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarDays,
    ChevronDown,
    Dumbbell,
    Footprints,
    Minus,
    RotateCcw,
    Timer,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { StatTile } from '@/components/gymrat/stat-tile';
import {
    ChartEmpty,
    hasRunning,
    hasWeeklyVolume,
    MuscleBars,
    PaceChart,
    Panel,
    parseDay,
    RecordList,
    shortDay,
    strengthRecordRows,
    tooltipFormatter,
    WeeklyKmChart,
    WeeklyVolumeChart,
    ZoneShareBar,
} from '@/components/stats-charts';
import { Button } from '@/components/ui/button';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { progressChartConfig } from '@/lib/chart-colors';
import { formatDuration, formatKg, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { show as showActivity } from '@/routes/activities';
import { index as statsIndex } from '@/routes/stats';
import type {
    ExerciseProgressPoint,
    MuscleDistribution,
    Option,
    PersonalRecord,
    RunningRecord,
    TrackingType,
    WeeklyRunning,
    WeeklyVolume,
} from '@/types';

type Filters = {
    from: string;
    to: string;
    zone: string | null;
    exercise: number | null;
};

type HyroxBest = {
    exercise: string;
    distance_m: number | null;
    best_seconds: number;
    date: string;
};

type ExerciseProgress = {
    exercise: { id: number; name: string; tracking_type: TrackingType };
    points: ExerciseProgressPoint[];
};

type StatsProps = {
    filters: Filters;
    zones: Option[];
    loggedExercises: { id: number; name: string; sessions: number }[];
    weeklyVolume: WeeklyVolume[];
    muscleDistribution: MuscleDistribution[];
    exerciseProgress: ExerciseProgress | null;
    personalRecords: PersonalRecord[];
    weeklyRunning: WeeklyRunning[];
    runningRecords: RunningRecord[];
    hyroxBests: HyroxBest[];
};

const ALL = 'all';
const DAY = 24 * 60 * 60 * 1000;

const tabTriggerClass =
    'h-full min-h-11 flex-1 rounded-lg px-4 text-[15px] font-bold data-[state=active]:bg-foreground data-[state=active]:text-background dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-foreground dark:data-[state=active]:text-background';

const chipClass =
    'h-11 shrink-0 rounded-full border bg-card px-4 text-[13px] font-bold whitespace-nowrap dark:bg-card';

export default function StatsIndex({
    filters,
    zones,
    loggedExercises,
    weeklyVolume,
    muscleDistribution,
    exerciseProgress,
    personalRecords,
    weeklyRunning,
    runningRecords,
    hyroxBests,
}: StatsProps) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [rangeOpen, setRangeOpen] = useState(false);

    const applyFilters = (changes: Partial<Filters>) => {
        const next = { ...filters, from, to, ...changes };

        router.get(
            statsIndex.url({
                query: {
                    from: next.from || null,
                    to: next.to || null,
                    zone: next.zone,
                    exercise: next.exercise,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const resetFilters = () => {
        router.get(statsIndex.url(), {}, { preserveScroll: true });
    };

    const zoneLabel = zones.find((zone) => zone.value === filters.zone)?.label;
    const exerciseName = loggedExercises.find(
        (exercise) => exercise.id === filters.exercise,
    )?.name;
    const weeks = Math.max(
        1,
        Math.round(
            (parseDay(filters.to).getTime() -
                parseDay(filters.from).getTime()) /
                (7 * DAY),
        ),
    );

    const zoneSelect = (trigger: ReactNode) => (
        <Select
            value={filters.zone ?? ALL}
            onValueChange={(value) =>
                applyFilters({ zone: value === ALL ? null : value })
            }
        >
            {trigger}
            <SelectContent>
                <SelectItem value={ALL}>Todas las zonas</SelectItem>
                {zones.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                        {zone.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const exerciseSelect = (trigger: ReactNode) => (
        <Select
            value={filters.exercise ? String(filters.exercise) : undefined}
            onValueChange={(value) => applyFilters({ exercise: Number(value) })}
            disabled={loggedExercises.length === 0}
        >
            {trigger}
            <SelectContent>
                {loggedExercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={String(exercise.id)}>
                        {exercise.name}
                        <span className="text-muted-foreground">
                            ({exercise.sessions})
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <>
            <Head title="Estadísticas" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="min-w-0 font-num text-[38px] leading-none uppercase md:text-6xl">
                        <span className="md:hidden">Progreso</span>
                        <span className="hidden md:inline">Estadísticas</span>
                    </h1>
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="h-11 shrink-0 rounded-lg px-3.5 font-bold md:px-4"
                    >
                        <RotateCcw className="hidden md:block" aria-hidden />
                        Restablecer
                    </Button>
                </div>

                <Tabs defaultValue="fuerza" className="gap-4 md:gap-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                        {/* Phones: compact chips */}
                        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
                            <Popover
                                open={rangeOpen}
                                onOpenChange={setRangeOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={chipClass}
                                    >
                                        <CalendarDays aria-hidden />
                                        {shortDay(filters.from)} –{' '}
                                        {shortDay(filters.to)}
                                        <ChevronDown
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-72">
                                    <form
                                        className="grid gap-3"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            setRangeOpen(false);
                                            applyFilters({ from, to });
                                        }}
                                    >
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="from-mobile">
                                                Desde
                                            </Label>
                                            <Input
                                                id="from-mobile"
                                                type="date"
                                                value={from}
                                                max={to}
                                                onChange={(event) =>
                                                    setFrom(event.target.value)
                                                }
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="to-mobile">
                                                Hasta
                                            </Label>
                                            <Input
                                                id="to-mobile"
                                                type="date"
                                                value={to}
                                                min={from}
                                                onChange={(event) =>
                                                    setTo(event.target.value)
                                                }
                                                className="h-11"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="h-11 font-bold"
                                        >
                                            Aplicar
                                        </Button>
                                    </form>
                                </PopoverContent>
                            </Popover>
                            {zoneSelect(
                                <SelectTrigger
                                    aria-label="Zona del cuerpo"
                                    className={cn(
                                        chipClass,
                                        filters.zone &&
                                            'border-primary text-primary-text',
                                    )}
                                >
                                    <SelectValue />
                                </SelectTrigger>,
                            )}
                            {exerciseSelect(
                                <SelectTrigger
                                    aria-label="Ejercicio"
                                    className={cn(
                                        chipClass,
                                        'max-w-56',
                                        filters.exercise &&
                                            'border-primary text-primary-text',
                                    )}
                                >
                                    <SelectValue placeholder="Sin ejercicios registrados" />
                                </SelectTrigger>,
                            )}
                        </div>

                        {/* Tablets and desktop: labelled fields */}
                        <div className="hidden min-w-0 flex-1 grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.6fr)] gap-3 md:grid">
                            <div className="grid min-w-0 grid-cols-1 gap-1.5">
                                <Label htmlFor="from" className="font-bold">
                                    Desde
                                </Label>
                                <Input
                                    id="from"
                                    type="date"
                                    value={from}
                                    max={to}
                                    onChange={(event) =>
                                        setFrom(event.target.value)
                                    }
                                    onBlur={() =>
                                        from !== filters.from &&
                                        applyFilters({ from })
                                    }
                                    className="h-12 rounded-lg bg-card dark:bg-card"
                                />
                            </div>
                            <div className="grid min-w-0 grid-cols-1 gap-1.5">
                                <Label htmlFor="to" className="font-bold">
                                    Hasta
                                </Label>
                                <Input
                                    id="to"
                                    type="date"
                                    value={to}
                                    min={from}
                                    onChange={(event) =>
                                        setTo(event.target.value)
                                    }
                                    onBlur={() =>
                                        to !== filters.to &&
                                        applyFilters({ to })
                                    }
                                    className="h-12 rounded-lg bg-card dark:bg-card"
                                />
                            </div>
                            <div className="grid min-w-0 grid-cols-1 gap-1.5">
                                <Label htmlFor="zone" className="font-bold">
                                    Zona del cuerpo
                                </Label>
                                {zoneSelect(
                                    <SelectTrigger
                                        id="zone"
                                        className="h-12 w-full rounded-lg bg-card data-[size=default]:h-12 dark:bg-card"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>,
                                )}
                            </div>
                            <div className="grid min-w-0 grid-cols-1 gap-1.5">
                                <Label htmlFor="exercise" className="font-bold">
                                    Ejercicio
                                </Label>
                                {exerciseSelect(
                                    <SelectTrigger
                                        id="exercise"
                                        className={cn(
                                            'h-12 w-full rounded-lg bg-card data-[size=default]:h-12 dark:bg-card',
                                            filters.exercise &&
                                                'border-primary',
                                        )}
                                    >
                                        <SelectValue placeholder="Sin ejercicios registrados" />
                                    </SelectTrigger>,
                                )}
                            </div>
                        </div>

                        <TabsList className="h-auto w-full shrink-0 rounded-xl bg-card p-1.5 group-data-[orientation=horizontal]/tabs:h-auto xl:w-auto">
                            <TabsTrigger
                                value="fuerza"
                                className={tabTriggerClass}
                            >
                                Fuerza
                            </TabsTrigger>
                            <TabsTrigger
                                value="carreras"
                                className={tabTriggerClass}
                            >
                                Carreras
                            </TabsTrigger>
                            <TabsTrigger
                                value="hyrox"
                                className={tabTriggerClass}
                            >
                                Hyrox
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent
                        value="fuerza"
                        className="space-y-4 md:space-y-6"
                    >
                        <ExerciseProgressPanel
                            progress={exerciseProgress}
                            fallbackName={exerciseName}
                            weeks={weeks}
                        />

                        <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
                            <Panel
                                title="Volumen por zona"
                                caption={`toneladas por semana${zoneLabel ? ` · ${zoneLabel}` : ''}`}
                                className="order-3 xl:order-1"
                            >
                                {hasWeeklyVolume(weeklyVolume) ? (
                                    <WeeklyVolumeChart data={weeklyVolume} />
                                ) : (
                                    <ChartEmpty>
                                        <Dumbbell
                                            className="size-6"
                                            aria-hidden
                                        />
                                        No hay series con peso en este periodo.
                                    </ChartEmpty>
                                )}
                            </Panel>

                            <StrengthRecords
                                records={personalRecords}
                                className="order-2"
                            />

                            <Panel
                                title="Distribución por músculo"
                                caption="series efectivas"
                                className="order-1 xl:order-3 xl:col-span-2"
                            >
                                {muscleDistribution.length > 0 ? (
                                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                                        <ZoneShareBar
                                            data={muscleDistribution}
                                        />
                                        <MuscleBars
                                            data={muscleDistribution}
                                            limit={10}
                                        />
                                    </div>
                                ) : (
                                    <ChartEmpty className="min-h-32">
                                        <Dumbbell
                                            className="size-6"
                                            aria-hidden
                                        />
                                        No hay series registradas en este
                                        periodo.
                                    </ChartEmpty>
                                )}
                            </Panel>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="carreras"
                        className="space-y-4 md:space-y-6"
                    >
                        <RunningRecords records={runningRecords} />
                        {hasRunning(weeklyRunning) ? (
                            <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
                                <Panel
                                    title="Kilómetros por semana"
                                    caption="carrera, trail y cinta"
                                >
                                    <WeeklyKmChart data={weeklyRunning} />
                                </Panel>
                                <Panel
                                    title="Evolución del ritmo"
                                    caption="min/km, arriba = más rápido"
                                >
                                    <PaceChart data={weeklyRunning} />
                                </Panel>
                            </div>
                        ) : (
                            <ChartEmpty>
                                <Footprints className="size-6" aria-hidden />
                                No hay carreras en este periodo.
                            </ChartEmpty>
                        )}
                    </TabsContent>

                    <TabsContent value="hyrox">
                        <Panel
                            title="Mejores tiempos por estación"
                            caption="tu mejor marca en cada estación"
                            className="gap-1"
                        >
                            {hyroxBests.length > 0 ? (
                                <RecordList
                                    rows={hyroxBests.map((best) => ({
                                        key: best.exercise,
                                        title: best.exercise,
                                        date: best.date,
                                        value: formatDuration(
                                            best.best_seconds,
                                        ),
                                        detail: best.distance_m
                                            ? `${formatNumber(best.distance_m)} m`
                                            : undefined,
                                    }))}
                                />
                            ) : (
                                <ChartEmpty className="min-h-32">
                                    <Timer className="size-6" aria-hidden />
                                    Registra estaciones Hyrox (SkiErg, Sled
                                    Push, Wall Balls…) con su tiempo para ver
                                    tus mejores marcas.
                                </ChartEmpty>
                            )}
                        </Panel>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

type MetricKey = keyof typeof progressChartConfig;

type Metric = {
    key: MetricKey;
    label: string;
    unit?: string;
    format: (value: number) => string;
    /** Change is measured on this metric; lower is better for times. */
    lowerIsBetter?: boolean;
};

function metricsFor(type: TrackingType): {
    stats: Metric[];
    lines: { key: MetricKey; dashed?: boolean }[];
    change: Metric;
    highlight: MetricKey;
} {
    const kg: Metric['format'] = (value) => formatNumber(value);

    if (type === 'weight_reps') {
        const max: Metric = {
            key: 'max_weight_kg',
            label: 'Peso máximo',
            unit: 'kg',
            format: kg,
        };
        const orm: Metric = {
            key: 'estimated_1rm',
            label: '1RM estimado',
            unit: 'kg',
            format: kg,
        };

        return {
            stats: [max, orm],
            lines: [
                { key: 'max_weight_kg' },
                { key: 'estimated_1rm', dashed: true },
            ],
            change: orm,
            highlight: 'estimated_1rm',
        };
    }

    if (type === 'reps') {
        const reps: Metric = {
            key: 'max_reps',
            label: 'Reps máximas',
            unit: 'reps',
            format: formatNumber,
        };

        return {
            stats: [reps],
            lines: [{ key: 'max_reps' }],
            change: reps,
            highlight: 'max_reps',
        };
    }

    const time: Metric = {
        key: 'best_duration_seconds',
        label: type === 'time' ? 'Tiempo máximo' : 'Mejor tiempo',
        format: formatDuration,
        lowerIsBetter: type === 'distance_time',
    };

    return {
        stats: [time],
        lines: [{ key: 'best_duration_seconds' }],
        change: time,
        highlight: 'best_duration_seconds',
    };
}

function valuesOf(points: ExerciseProgressPoint[], key: MetricKey) {
    return points
        .map((point) => ({ date: point.date, value: point[key] }))
        .filter(
            (point): point is { date: string; value: number } =>
                typeof point.value === 'number',
        );
}

function ExerciseProgressPanel({
    progress,
    fallbackName,
    weeks,
}: {
    progress: ExerciseProgress | null;
    fallbackName?: string;
    weeks: number;
}) {
    const title = progress?.exercise.name ?? fallbackName ?? 'Progresión';

    if (!progress || progress.points.length === 0) {
        return (
            <Panel title={title} caption={`${weeks} semanas`}>
                <ChartEmpty>
                    <Dumbbell className="size-6" aria-hidden />
                    {progress
                        ? `No hay sesiones de ${progress.exercise.name} en este periodo.`
                        : 'Registra algún entrenamiento para ver la evolución de tus ejercicios.'}
                </ChartEmpty>
            </Panel>
        );
    }

    const { points } = progress;
    const metrics = metricsFor(progress.exercise.tracking_type);
    const changeValues = valuesOf(points, metrics.change.key);
    const first = changeValues[0];
    const last = changeValues[changeValues.length - 1];
    const delta = first && last ? last.value - first.value : 0;
    const percent = first?.value ? (delta / first.value) * 100 : 0;
    const spanWeeks =
        first && last
            ? Math.round(
                  (parseDay(last.date).getTime() -
                      parseDay(first.date).getTime()) /
                      (7 * DAY),
              )
            : 0;
    const better = metrics.change.lowerIsBetter ? delta < 0 : delta > 0;
    const direction = delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
    const TrendIcon =
        direction === 'up'
            ? ArrowUpRight
            : direction === 'down'
              ? ArrowDownRight
              : Minus;
    const best = (metric: Metric) => {
        const values = valuesOf(points, metric.key).map((point) => point.value);

        return metric.lowerIsBetter ? Math.min(...values) : Math.max(...values);
    };
    const signed = (value: number, format: (value: number) => string) =>
        `${value > 0 ? '+' : value < 0 ? '−' : '±'}${format(Math.abs(value))}`;

    return (
        <section className="grid gap-5 rounded-xl bg-card p-5 md:p-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-3 lg:block">
                    <h2 className="text-lg leading-tight font-bold">
                        <span className="sr-only lg:not-sr-only">
                            Progresión:{' '}
                        </span>
                        {title}
                    </h2>
                    <span className="shrink-0 text-[13px] text-muted-foreground lg:mt-1 lg:block">
                        {weeks} semanas
                    </span>
                </div>
                <dl className="flex flex-wrap gap-x-5 gap-y-3 lg:flex-col">
                    {metrics.stats.map((metric) => {
                        const value = best(metric);

                        return (
                            <div key={metric.key} className="space-y-1">
                                <dt className="text-[13px] font-medium text-muted-foreground">
                                    {metric.label}
                                </dt>
                                <dd className="flex items-baseline gap-1">
                                    <span
                                        className={cn(
                                            'font-num text-[30px] leading-none sm:text-4xl lg:text-5xl',
                                            metric.key === metrics.highlight &&
                                                'text-primary-text',
                                        )}
                                    >
                                        {metric.format(value)}
                                    </span>
                                    {metric.unit && (
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            {metric.unit}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        );
                    })}
                    {changeValues.length > 1 && (
                        <div className="space-y-1">
                            <dt className="text-[13px] font-medium text-muted-foreground">
                                Cambio
                            </dt>
                            <dd
                                className={cn(
                                    'flex items-center gap-1',
                                    delta === 0
                                        ? 'text-muted-foreground'
                                        : better
                                          ? 'text-trend-up'
                                          : 'text-trend-down',
                                )}
                            >
                                <span className="font-num text-[30px] leading-none sm:text-4xl lg:text-3xl">
                                    {signed(Math.round(percent), formatNumber)}%
                                </span>
                            </dd>
                            <dd
                                className={cn(
                                    'flex items-center gap-1 text-xs font-medium',
                                    delta === 0
                                        ? 'text-muted-foreground'
                                        : better
                                          ? 'text-trend-up'
                                          : 'text-trend-down',
                                )}
                            >
                                <TrendIcon
                                    className="size-3.5"
                                    strokeWidth={2.4}
                                    aria-hidden
                                />
                                {signed(delta, metrics.change.format)}
                                {metrics.change.unit
                                    ? ` ${metrics.change.unit}`
                                    : ''}{' '}
                                en {Math.max(spanWeeks, 1)}{' '}
                                {spanWeeks === 1 ? 'semana' : 'semanas'}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>
            <ProgressChart points={points} lines={metrics.lines} />
        </section>
    );
}

function ProgressChart({
    points,
    lines,
}: {
    points: ExerciseProgressPoint[];
    lines: { key: MetricKey; dashed?: boolean }[];
}) {
    const data = points.map((point) => ({
        ...point,
        label: shortDay(point.date),
    }));
    const config = Object.fromEntries(
        lines.map(({ key }) => [key, progressChartConfig[key]]),
    );
    const isTime = lines[0]?.key === 'best_duration_seconds';
    const format = isTime
        ? formatDuration
        : lines[0]?.key === 'max_reps'
          ? (value: number) => `${formatNumber(value)} reps`
          : formatKg;

    return (
        <div className="flex min-w-0 flex-col gap-3">
            <ChartContainer
                config={config}
                className="aspect-auto h-56 w-full lg:h-64"
            >
                <LineChart data={data} margin={{ left: 0, right: 12, top: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={16}
                    />
                    <YAxis
                        width={44}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        tickFormatter={isTime ? formatDuration : formatNumber}
                    />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                formatter={tooltipFormatter(config, format)}
                            />
                        }
                    />
                    {lines.map(({ key, dashed }) => (
                        <Line
                            key={key}
                            dataKey={key}
                            type="monotone"
                            stroke={`var(--color-${key})`}
                            strokeWidth={3}
                            strokeDasharray={dashed ? '8 6' : undefined}
                            dot={
                                data.length <= 12
                                    ? { r: 3, fill: `var(--color-${key})` }
                                    : false
                            }
                            activeDot={{ r: 5 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ChartContainer>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold">
                {lines.map(({ key, dashed }) => (
                    <li key={key} className="flex items-center gap-2">
                        <svg width="20" height="4" aria-hidden>
                            <line
                                x1="0"
                                y1="2"
                                x2="20"
                                y2="2"
                                stroke={progressChartConfig[key].color}
                                strokeWidth="3"
                                strokeDasharray={dashed ? '5 3' : undefined}
                            />
                        </svg>
                        {progressChartConfig[key].label}
                        {key === 'estimated_1rm' && (
                            <span className="font-normal text-muted-foreground">
                                (fórmula de Epley)
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function StrengthRecords({
    records,
    className,
}: {
    records: PersonalRecord[];
    className?: string;
}) {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? records : records.slice(0, 6);

    return (
        <Panel
            title="Récords de fuerza"
            caption="mejor serie y 1RM estimado"
            className={cn('gap-1', className)}
        >
            {records.length > 0 ? (
                <>
                    <RecordList
                        rows={strengthRecordRows(visible, { highlightDays: 7 })}
                    />
                    {records.length > 6 && (
                        <Button
                            variant="ghost"
                            onClick={() => setShowAll(!showAll)}
                            className="mt-2 h-11 self-start font-bold"
                            aria-expanded={showAll}
                        >
                            {showAll
                                ? 'Ver menos'
                                : `Ver todos (${records.length})`}
                        </Button>
                    )}
                </>
            ) : (
                <ChartEmpty className="min-h-32">
                    Aún no tienes récords. ¡Registra series con peso para
                    empezar!
                </ChartEmpty>
            )}
        </Panel>
    );
}

function RunningRecords({ records }: { records: RunningRecord[] }) {
    return (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {records.map((record) => {
                const tile = (
                    <StatTile
                        label={record.label}
                        value={record.duration_label ?? '—'}
                        hint={
                            record.date
                                ? `${record.pace_label ?? ''} · ${shortDay(record.date)}`
                                : 'Sin marca todavía'
                        }
                        variant={record.date ? 'default' : 'empty'}
                        className="h-full"
                    />
                );

                return record.activity_id ? (
                    <Link
                        key={record.label}
                        href={showActivity(record.activity_id)}
                        className="rounded-xl transition-opacity hover:opacity-85"
                    >
                        {tile}
                    </Link>
                ) : (
                    <div key={record.label}>{tile}</div>
                );
            })}
        </div>
    );
}

StatsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Estadísticas',
            href: statsIndex(),
        },
    ],
};
