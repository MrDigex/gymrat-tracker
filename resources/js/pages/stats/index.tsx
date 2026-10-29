import { Head, Link, router } from '@inertiajs/react';
import {
    Dumbbell,
    Footprints,
    Medal,
    RotateCcw,
    Timer,
    Trophy,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from 'recharts';
import Heading from '@/components/heading';
import {
    ChartEmpty,
    hasRunning,
    hasWeeklyVolume,
    MuscleDistributionChart,
    PaceChart,
    PersonalRecordsTable,
    tooltipFormatter,
    WeeklyKmChart,
    WeeklyVolumeChart,
} from '@/components/stats-charts';
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
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { progressChartConfig } from '@/lib/chart-colors';
import {
    formatDate,
    formatDuration,
    formatKg,
    formatNumber,
} from '@/lib/format';
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

type StatsProps = {
    filters: Filters;
    zones: Option[];
    loggedExercises: { id: number; name: string; sessions: number }[];
    weeklyVolume: WeeklyVolume[];
    muscleDistribution: MuscleDistribution[];
    exerciseProgress: {
        exercise: { id: number; name: string; tracking_type: TrackingType };
        points: ExerciseProgressPoint[];
    } | null;
    personalRecords: PersonalRecord[];
    weeklyRunning: WeeklyRunning[];
    runningRecords: RunningRecord[];
    hyroxBests: HyroxBest[];
};

const ALL = 'all';

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

    return (
        <>
            <Head title="Estadísticas" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Estadísticas"
                    description="Analiza tu progreso en fuerza, carreras y Hyrox"
                />

                <div className="-mt-4 flex flex-wrap items-end gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="from">Desde</Label>
                        <Input
                            id="from"
                            type="date"
                            value={from}
                            max={to}
                            onChange={(event) => setFrom(event.target.value)}
                            onBlur={() =>
                                from !== filters.from && applyFilters({ from })
                            }
                            className="w-40"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="to">Hasta</Label>
                        <Input
                            id="to"
                            type="date"
                            value={to}
                            min={from}
                            onChange={(event) => setTo(event.target.value)}
                            onBlur={() =>
                                to !== filters.to && applyFilters({ to })
                            }
                            className="w-40"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="zone">Zona del cuerpo</Label>
                        <Select
                            value={filters.zone ?? ALL}
                            onValueChange={(value) =>
                                applyFilters({
                                    zone: value === ALL ? null : value,
                                })
                            }
                        >
                            <SelectTrigger id="zone" className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todas</SelectItem>
                                {zones.map((zone) => (
                                    <SelectItem
                                        key={zone.value}
                                        value={zone.value}
                                    >
                                        {zone.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="exercise">Ejercicio</Label>
                        <Select
                            value={
                                filters.exercise
                                    ? String(filters.exercise)
                                    : undefined
                            }
                            onValueChange={(value) =>
                                applyFilters({ exercise: Number(value) })
                            }
                            disabled={loggedExercises.length === 0}
                        >
                            <SelectTrigger id="exercise" className="w-56">
                                <SelectValue placeholder="Sin ejercicios registrados" />
                            </SelectTrigger>
                            <SelectContent>
                                {loggedExercises.map((exercise) => (
                                    <SelectItem
                                        key={exercise.id}
                                        value={String(exercise.id)}
                                    >
                                        {exercise.name}
                                        <span className="text-muted-foreground">
                                            ({exercise.sessions})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={resetFilters}
                        className="ml-auto"
                    >
                        <RotateCcw />
                        Restablecer
                    </Button>
                </div>

                <Tabs defaultValue="fuerza" className="gap-4">
                    <TabsList>
                        <TabsTrigger value="fuerza">
                            <Dumbbell />
                            Fuerza
                        </TabsTrigger>
                        <TabsTrigger value="carreras">
                            <Footprints />
                            Carreras
                        </TabsTrigger>
                        <TabsTrigger value="hyrox">
                            <Timer />
                            Hyrox
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="fuerza" className="space-y-4">
                        <div className="grid gap-4 xl:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Volumen semanal por zona
                                    </CardTitle>
                                    <CardDescription>
                                        Kilos levantados (peso × reps)
                                        {zoneLabel && ` · ${zoneLabel}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {hasWeeklyVolume(weeklyVolume) ? (
                                        <WeeklyVolumeChart
                                            data={weeklyVolume}
                                        />
                                    ) : (
                                        <ChartEmpty>
                                            <Dumbbell className="size-6" />
                                            No hay series con peso en este
                                            periodo.
                                        </ChartEmpty>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Series por músculo</CardTitle>
                                    <CardDescription>
                                        Series efectivas por músculo principal
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {muscleDistribution.length > 0 ? (
                                        <MuscleDistributionChart
                                            data={muscleDistribution}
                                            limit={15}
                                        />
                                    ) : (
                                        <ChartEmpty>
                                            <Dumbbell className="size-6" />
                                            No hay series registradas en este
                                            periodo.
                                        </ChartEmpty>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <ExerciseProgressCard progress={exerciseProgress} />

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="size-4 text-yellow-500 dark:text-yellow-400" />
                                    Récords personales
                                </CardTitle>
                                <CardDescription>
                                    Mejor serie por ejercicio según el 1RM
                                    estimado
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {personalRecords.length > 0 ? (
                                    <PersonalRecordsTable
                                        records={personalRecords}
                                    />
                                ) : (
                                    <ChartEmpty className="min-h-32">
                                        <Trophy className="size-6" />
                                        Aún no tienes récords. ¡Registra series
                                        con peso para empezar!
                                    </ChartEmpty>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="carreras" className="space-y-4">
                        <RunningRecords records={runningRecords} />
                        {hasRunning(weeklyRunning) ? (
                            <div className="grid gap-4 xl:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Kilómetros por semana
                                        </CardTitle>
                                        <CardDescription>
                                            Carreras, trail y cinta
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <WeeklyKmChart data={weeklyRunning} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Evolución del ritmo
                                        </CardTitle>
                                        <CardDescription>
                                            Ritmo medio semanal (más arriba, más
                                            rápido)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <PaceChart data={weeklyRunning} />
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <ChartEmpty>
                                <Footprints className="size-6" />
                                No hay carreras en este periodo.
                            </ChartEmpty>
                        )}
                    </TabsContent>

                    <TabsContent value="hyrox">
                        <HyroxBests bests={hyroxBests} />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function ProgressChart({
    title,
    description,
    points,
    keys,
    format,
    axisFormat = format,
    variant = 'line',
    reversed = false,
}: {
    title: string;
    description?: string;
    points: ExerciseProgressPoint[];
    keys: (keyof typeof progressChartConfig)[];
    format: (value: number) => string;
    axisFormat?: (value: number) => string;
    variant?: 'line' | 'bar';
    reversed?: boolean;
}) {
    const data = points.map((point) => ({
        ...point,
        label: formatDate(point.date, { day: 'numeric', month: 'short' }),
    }));
    const config = Object.fromEntries(
        keys.map((key) => [key, progressChartConfig[key]]),
    );
    const axes = (
        <>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
            />
            <YAxis
                width={48}
                reversed={reversed}
                tickLine={false}
                axisLine={false}
                domain={variant === 'bar' ? [0, 'auto'] : ['auto', 'auto']}
                tickFormatter={axisFormat}
            />
            <ChartTooltip
                cursor={variant === 'line'}
                content={
                    <ChartTooltipContent
                        formatter={tooltipFormatter(config, format)}
                    />
                }
            />
            {keys.length > 1 && (
                <ChartLegend content={<ChartLegendContent />} />
            )}
        </>
    );

    return (
        <div className="space-y-2">
            <div>
                <h3 className="text-sm font-medium">{title}</h3>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <ChartContainer config={config} className="aspect-auto h-56 w-full">
                {variant === 'bar' ? (
                    <BarChart
                        data={data}
                        margin={{ left: 0, right: 8, top: 8 }}
                    >
                        {axes}
                        {keys.map((key) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={`var(--color-${key})`}
                                maxBarSize={28}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                ) : (
                    <LineChart
                        data={data}
                        margin={{ left: 0, right: 8, top: 8 }}
                    >
                        {axes}
                        {keys.map((key) => (
                            <Line
                                key={key}
                                dataKey={key}
                                type="monotone"
                                stroke={`var(--color-${key})`}
                                strokeWidth={2}
                                dot={{ r: 4, fill: `var(--color-${key})` }}
                                activeDot={{ r: 5 }}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                )}
            </ChartContainer>
        </div>
    );
}

function ExerciseProgressCard({
    progress,
}: {
    progress: StatsProps['exerciseProgress'];
}) {
    let content: ReactNode;

    if (!progress) {
        content = (
            <ChartEmpty>
                <Dumbbell className="size-6" />
                Registra algún entrenamiento para ver la evolución de tus
                ejercicios.
            </ChartEmpty>
        );
    } else if (progress.points.length === 0) {
        content = (
            <ChartEmpty>
                <Dumbbell className="size-6" />
                No hay sesiones de {progress.exercise.name} en este periodo.
            </ChartEmpty>
        );
    } else {
        const { points } = progress;
        const type = progress.exercise.tracking_type;
        const reps = (value: number) => `${formatNumber(value)} reps`;

        content = (
            <div className="grid gap-6 lg:grid-cols-2">
                {type === 'weight_reps' && (
                    <>
                        <ProgressChart
                            title="Peso máximo y 1RM estimado"
                            description="Mejor peso de cada sesión y 1RM estimado (fórmula de Epley)"
                            points={points}
                            keys={['max_weight_kg', 'estimated_1rm']}
                            format={formatKg}
                            axisFormat={formatNumber}
                        />
                        <ProgressChart
                            title="Volumen por sesión"
                            description="Peso × repeticiones de todas las series"
                            points={points}
                            keys={['volume_kg']}
                            format={formatKg}
                            axisFormat={formatNumber}
                            variant="bar"
                        />
                        <ProgressChart
                            title="Repeticiones máximas"
                            description="Mejor serie de cada sesión"
                            points={points}
                            keys={['max_reps']}
                            format={reps}
                            axisFormat={formatNumber}
                        />
                    </>
                )}
                {type === 'reps' && (
                    <ProgressChart
                        title="Repeticiones máximas"
                        description="Mejor serie de cada sesión"
                        points={points}
                        keys={['max_reps']}
                        format={reps}
                        axisFormat={formatNumber}
                    />
                )}
                {(type === 'time' || type === 'distance_time') && (
                    <ProgressChart
                        title={type === 'time' ? 'Tiempo máximo' : 'Tiempo'}
                        description="Mejor duración registrada en cada sesión"
                        points={points}
                        keys={['best_duration_seconds']}
                        format={formatDuration}
                    />
                )}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                    Progreso por ejercicio
                    {progress && (
                        <Badge variant="secondary">
                            {progress.exercise.name}
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Elige el ejercicio en los filtros de arriba
                </CardDescription>
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
}

function RunningRecords({ records }: { records: RunningRecord[] }) {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {records.map((record) => {
                const body = (
                    <Card className="h-full gap-2 py-4 transition-colors">
                        <CardHeader className="px-4">
                            <CardDescription className="flex items-center gap-2">
                                <Medal className="size-4" />
                                {record.label}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 px-4">
                            <p className="text-2xl font-semibold tracking-tight tabular-nums">
                                {record.duration_label ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {record.date
                                    ? `${record.pace_label ?? ''} · ${formatDate(record.date)}`
                                    : 'Sin marca todavía'}
                            </p>
                        </CardContent>
                    </Card>
                );

                return record.activity_id ? (
                    <Link
                        key={record.label}
                        href={showActivity(record.activity_id)}
                        className="rounded-xl hover:[&>div]:bg-muted/40"
                    >
                        {body}
                    </Link>
                ) : (
                    <div key={record.label}>{body}</div>
                );
            })}
        </div>
    );
}

function HyroxBests({ bests }: { bests: HyroxBest[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Timer className="size-4 text-yellow-500 dark:text-yellow-400" />
                    Mejores tiempos por estación
                </CardTitle>
                <CardDescription>
                    Tu mejor marca en cada estación Hyrox registrada
                </CardDescription>
            </CardHeader>
            <CardContent>
                {bests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estación</TableHead>
                                <TableHead className="text-right">
                                    Distancia
                                </TableHead>
                                <TableHead className="text-right">
                                    Mejor tiempo
                                </TableHead>
                                <TableHead className="hidden text-right sm:table-cell">
                                    Fecha
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bests.map((best) => (
                                <TableRow key={best.exercise}>
                                    <TableCell className="font-medium">
                                        {best.exercise}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {best.distance_m
                                            ? `${formatNumber(best.distance_m)} m`
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">
                                        {formatDuration(best.best_seconds)}
                                    </TableCell>
                                    <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                                        {formatDate(best.date)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <ChartEmpty className="min-h-32">
                        <Timer className="size-6" />
                        Registra estaciones Hyrox (SkiErg, Sled Push, Wall
                        Balls…) con su tiempo para ver tus mejores marcas.
                    </ChartEmpty>
                )}
            </CardContent>
        </Card>
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
