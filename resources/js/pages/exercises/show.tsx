import { Head, Link, router } from '@inertiajs/react';
import { LineChart as LineChartIcon, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ExerciseImage } from '@/components/exercise-image';
import { SuggestionCallout } from '@/components/suggestion-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
};

type Metric = {
    key: keyof HistoryPoint;
    label: string;
    format: (value: number | null) => string;
};

function metricsFor(exercise: Exercise): Metric[] {
    switch (exercise.tracking_type) {
        case 'weight_reps':
            return [
                {
                    key: 'max_weight_kg',
                    label: 'Peso máximo',
                    format: formatKg,
                },
                {
                    key: 'estimated_1rm',
                    label: '1RM estimado',
                    format: formatKg,
                },
            ];
        case 'reps':
            return [
                {
                    key: 'max_reps',
                    label: 'Máx. repeticiones',
                    format: formatNumber,
                },
            ];
        default:
            return [
                {
                    key: 'best_duration_seconds',
                    label: 'Mejor tiempo',
                    format: formatDuration,
                },
            ];
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
    const metrics = metricsFor(exercise);
    const chartConfig = Object.fromEntries(
        metrics.map((metric, index) => [
            metric.key,
            { label: metric.label, color: `var(--chart-${index + 1})` },
        ]),
    ) satisfies ChartConfig;
    const recent = [...history].reverse().slice(0, 10);
    const instructions = exercise.instructions ?? [];
    const details = [
        exercise.equipment_label,
        exercise.level_label,
        exercise.mechanic_label,
    ].filter(Boolean);

    return (
        <>
            <Head title={exercise.name} />

            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                            <Badge
                                className={cn(
                                    exercise.is_hyrox &&
                                        'bg-yellow-400 text-yellow-950',
                                )}
                                variant={
                                    exercise.is_hyrox ? 'default' : 'secondary'
                                }
                            >
                                {exercise.category_label}
                            </Badge>
                            {exercise.body_zone_label && (
                                <Badge variant="outline">
                                    {exercise.body_zone_label}
                                </Badge>
                            )}
                            {exercise.is_custom && (
                                <Badge variant="outline">Propio</Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {exercise.name}
                        </h1>
                        {details.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {details.join(' · ')}
                            </p>
                        )}
                    </div>
                    {exercise.can_edit && (
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={exercises.edit(exercise.id)}>
                                    <Pencil /> Editar
                                </Link>
                            </Button>
                            <DeleteExerciseButton exercise={exercise} />
                        </div>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <figure className="overflow-hidden rounded-xl border">
                        <ExerciseImage exercise={exercise} animate={false} />
                        <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                            Posición inicial
                        </figcaption>
                    </figure>
                    {exercise.image_alt_url && (
                        <figure className="overflow-hidden rounded-xl border">
                            <ExerciseImage
                                exercise={{
                                    ...exercise,
                                    image_url: exercise.image_alt_url,
                                }}
                                animate={false}
                            />
                            <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                                Posición final
                            </figcaption>
                        </figure>
                    )}
                </div>

                <SuggestionCallout suggestion={suggestion} />

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cómo se hace</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {instructions.length > 0 ? (
                                <ol className="space-y-3">
                                    {instructions.map((step, index) => (
                                        <li
                                            key={index}
                                            className="flex gap-3 text-sm"
                                        >
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                                {index + 1}
                                            </span>
                                            <span className="pt-0.5">
                                                {step}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Este ejercicio no tiene instrucciones.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Músculos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MuscleList
                                title="Principales"
                                muscles={exercise.primary_muscles}
                            />
                            <MuscleList
                                title="Secundarios"
                                muscles={exercise.secondary_muscles}
                                variant="outline"
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tu progreso</CardTitle>
                        <CardDescription>
                            Mejor marca de cada sesión.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
                                <LineChartIcon className="size-8 text-muted-foreground" />
                                <p className="font-medium">
                                    Todavía no has registrado este ejercicio
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Añádelo a una rutina o a tu próximo
                                    entrenamiento y aquí verás tu evolución.
                                </p>
                            </div>
                        ) : (
                            <ChartContainer
                                config={chartConfig}
                                className="aspect-auto h-64 w-full"
                            >
                                <LineChart
                                    data={history}
                                    margin={{ left: 4, right: 12, top: 8 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        minTickGap={24}
                                        tickFormatter={(value: string) =>
                                            formatDate(value, {
                                                day: 'numeric',
                                                month: 'short',
                                            })
                                        }
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={48}
                                        domain={['auto', 'auto']}
                                        tickFormatter={(value: number) =>
                                            metrics[0].format(value)
                                        }
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(_, payload) =>
                                                    formatDate(
                                                        (
                                                            payload[0]
                                                                ?.payload as
                                                                | HistoryPoint
                                                                | undefined
                                                        )?.date,
                                                    )
                                                }
                                                formatter={(value, name) => {
                                                    const metric = metrics.find(
                                                        (item) =>
                                                            item.key === name,
                                                    );

                                                    return (
                                                        <div className="flex w-full justify-between gap-4">
                                                            <span className="text-muted-foreground">
                                                                {metric?.label}
                                                            </span>
                                                            <span className="font-mono font-medium">
                                                                {metric
                                                                    ? metric.format(
                                                                          Number(
                                                                              value,
                                                                          ),
                                                                      )
                                                                    : String(
                                                                          value,
                                                                      )}
                                                            </span>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        }
                                    />
                                    {metrics.length > 1 && (
                                        <ChartLegend
                                            content={<ChartLegendContent />}
                                        />
                                    )}
                                    {metrics.map((metric) => (
                                        <Line
                                            key={metric.key}
                                            dataKey={metric.key}
                                            type="monotone"
                                            stroke={`var(--color-${metric.key})`}
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            connectNulls
                                        />
                                    ))}
                                </LineChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {recent.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial reciente</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">
                                            Series
                                        </TableHead>
                                        <HistoryHeads exercise={exercise} />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recent.map((point) => (
                                        <TableRow key={point.session_id}>
                                            <TableCell>
                                                <Link
                                                    href={workouts.show(
                                                        point.session_id,
                                                    )}
                                                    className="underline-offset-4 hover:underline"
                                                >
                                                    {formatDate(point.date)}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {point.sets}
                                            </TableCell>
                                            <HistoryCells
                                                exercise={exercise}
                                                point={point}
                                            />
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

function HistoryHeads({ exercise }: { exercise: Exercise }) {
    switch (exercise.tracking_type) {
        case 'weight_reps':
            return (
                <>
                    <TableHead className="text-right">Peso máx.</TableHead>
                    <TableHead className="text-right">Reps</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                        Volumen
                    </TableHead>
                    <TableHead className="text-right">1RM est.</TableHead>
                </>
            );
        case 'reps':
            return (
                <>
                    <TableHead className="text-right">Máx. reps</TableHead>
                    <TableHead className="text-right">Total reps</TableHead>
                </>
            );
        case 'time':
            return <TableHead className="text-right">Mejor tiempo</TableHead>;
        default:
            return (
                <>
                    <TableHead className="text-right">Distancia</TableHead>
                    <TableHead className="text-right">Mejor tiempo</TableHead>
                </>
            );
    }
}

function HistoryCells({
    exercise,
    point,
}: {
    exercise: Exercise;
    point: HistoryPoint;
}) {
    switch (exercise.tracking_type) {
        case 'weight_reps':
            return (
                <>
                    <TableCell className="text-right">
                        {formatKg(point.max_weight_kg)}
                    </TableCell>
                    <TableCell className="text-right">
                        {formatNumber(point.total_reps)}
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                        {formatKg(point.volume_kg)}
                    </TableCell>
                    <TableCell className="text-right">
                        {formatKg(point.estimated_1rm)}
                    </TableCell>
                </>
            );
        case 'reps':
            return (
                <>
                    <TableCell className="text-right">
                        {formatNumber(point.max_reps)}
                    </TableCell>
                    <TableCell className="text-right">
                        {formatNumber(point.total_reps)}
                    </TableCell>
                </>
            );
        case 'time':
            return (
                <TableCell className="text-right">
                    {formatDuration(point.best_duration_seconds)}
                </TableCell>
            );
        default:
            return (
                <>
                    <TableCell className="text-right">
                        {point.best_distance_m
                            ? `${formatNumber(point.best_distance_m)} m`
                            : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                        {formatDuration(point.best_duration_seconds)}
                    </TableCell>
                </>
            );
    }
}

function MuscleList({
    title,
    muscles,
    variant = 'secondary',
}: {
    title: string;
    muscles: Exercise['primary_muscles'];
    variant?: 'secondary' | 'outline';
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {title}
            </p>
            {muscles && muscles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {muscles.map((muscle) => (
                        <Badge key={muscle.id} variant={variant}>
                            {muscle.name}
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">—</p>
            )}
        </div>
    );
}

function DeleteExerciseButton({ exercise }: { exercise: Exercise }) {
    const [deleting, setDeleting] = useState(false);

    const destroy = () => {
        setDeleting(true);
        router.delete(exercises.destroy.url(exercise.id), {
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" aria-label="Eliminar ejercicio">
                    <Trash2 />
                    <span className="hidden sm:inline">Eliminar</span>
                </Button>
            </DialogTrigger>
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
