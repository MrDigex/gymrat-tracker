import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ShareDialog, StoryCard } from '@/components/share-dialog';
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
    formatKm,
    formatNumber,
    formatPace,
} from '@/lib/format';
import activities from '@/routes/activities';
import type { Activity } from '@/types';

export default function ActivityShow({ activity }: { activity: Activity }) {
    const splits = activity.splits ?? [];
    const isHyrox = activity.type === 'hyrox';
    const date = formatDate(activity.started_at, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const stats = [
        { label: 'Distancia', value: formatKm(activity.distance_m) },
        { label: 'Tiempo', value: activity.duration_label },
        { label: 'Ritmo', value: formatPace(activity.pace_seconds_per_km) },
        {
            label: 'Desnivel',
            value:
                activity.elevation_gain_m !== null
                    ? `${formatNumber(activity.elevation_gain_m)} m`
                    : null,
        },
        {
            label: 'FC media',
            value: activity.avg_hr !== null ? `${activity.avg_hr} ppm` : null,
        },
        {
            label: 'FC máxima',
            value: activity.max_hr !== null ? `${activity.max_hr} ppm` : null,
        },
        {
            label: 'Calorías',
            value:
                activity.calories !== null
                    ? `${formatNumber(activity.calories)} kcal`
                    : null,
        },
    ].filter((stat): stat is { label: string; value: string } =>
        Boolean(stat.value),
    );

    return (
        <>
            <Head title={activity.name} />
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            <Badge variant="secondary">
                                {activity.type_label}
                            </Badge>
                            <Badge variant="outline">
                                {activity.source_label}
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {activity.name}
                        </h1>
                        <p className="text-sm text-muted-foreground capitalize">
                            {date}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ShareDialog
                            shareUrl={activity.share_url}
                            enableShare={activities.share(activity.id)}
                            title={activity.name}
                            text={`${activity.name}: ${formatKm(activity.distance_m)} en ${activity.duration_label} (${formatPace(activity.pace_seconds_per_km)})`}
                            fileName={`carrera-${activity.id}`}
                            storyCard={
                                <StoryCard
                                    badge={activity.type_label}
                                    title={activity.name}
                                    subtitle={formatDate(activity.started_at)}
                                >
                                    {[
                                        [
                                            'Distancia',
                                            formatKm(activity.distance_m),
                                        ],
                                        ['Tiempo', activity.duration_label],
                                        [
                                            'Ritmo',
                                            formatPace(
                                                activity.pace_seconds_per_km,
                                            ),
                                        ],
                                        ...(activity.avg_hr
                                            ? [
                                                  [
                                                      'FC media',
                                                      `${activity.avg_hr} ppm`,
                                                  ],
                                              ]
                                            : []),
                                    ].map(([label, value]) => (
                                        <div key={label}>
                                            <div
                                                style={{
                                                    fontSize: 36,
                                                    color: '#a1a1aa',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 4,
                                                }}
                                            >
                                                {label}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 120,
                                                    fontWeight: 900,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </StoryCard>
                            }
                        />
                        <Button variant="outline" asChild>
                            <Link href={activities.edit(activity.id)}>
                                <Pencil /> Editar
                            </Link>
                        </Button>
                        <DeleteActivityButton activity={activity} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className={
                                index < 3
                                    ? 'rounded-xl border bg-card p-4'
                                    : 'rounded-xl border bg-card/50 p-4'
                            }
                        >
                            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                {stat.label}
                            </div>
                            <div
                                className={
                                    index < 3
                                        ? 'mt-1 text-3xl font-bold tabular-nums'
                                        : 'mt-1 text-xl font-semibold tabular-nums'
                                }
                            >
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {splits.length > 0 && (
                    <>
                        <SplitsChart activity={activity} isHyrox={isHyrox} />
                        <Card>
                            <CardHeader>
                                <CardTitle>Parciales</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 sm:px-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-6 sm:pl-2">
                                                Tramo
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Distancia
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Tiempo
                                            </TableHead>
                                            {!isHyrox && (
                                                <TableHead className="pr-6 text-right sm:pr-2">
                                                    Ritmo
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {splits.map((split) => (
                                            <TableRow key={split.id}>
                                                <TableCell className="pl-6 font-medium sm:pl-2">
                                                    {split.label}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {split.distance_m
                                                        ? `${formatNumber(split.distance_m)} m`
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {split.duration_label}
                                                </TableCell>
                                                {!isHyrox && (
                                                    <TableCell className="pr-6 text-right tabular-nums sm:pr-2">
                                                        {formatPace(
                                                            split.pace_seconds_per_km,
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

const chartConfig = {
    value: { label: 'Valor', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function SplitsChart({
    activity,
    isHyrox,
}: {
    activity: Activity;
    isHyrox: boolean;
}) {
    const data = (activity.splits ?? [])
        .map((split) => ({
            label: split.label,
            value: isHyrox ? split.duration_seconds : split.pace_seconds_per_km,
        }))
        .filter((point): point is { label: string; value: number } =>
            Boolean(point.value),
        );

    if (data.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isHyrox ? 'Tiempo por tramo' : 'Ritmo por parcial'}
                </CardTitle>
                <CardDescription>
                    {isHyrox
                        ? 'Cuánto tardaste en cada carrera y estación.'
                        : 'Barras más bajas = parciales más rápidos.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-64 w-full"
                >
                    <BarChart
                        data={data}
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            tickFormatter={(value: string) =>
                                value.length > 10
                                    ? `${value.slice(0, 9)}…`
                                    : value
                            }
                        />
                        <YAxis
                            width={48}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: number) =>
                                formatDuration(value)
                            }
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideIndicator
                                    formatter={(value) => (
                                        <span className="font-mono font-medium tabular-nums">
                                            {isHyrox
                                                ? formatDuration(Number(value))
                                                : formatPace(Number(value))}
                                        </span>
                                    )}
                                />
                            }
                        />
                        <Bar
                            dataKey="value"
                            fill="var(--color-value)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function DeleteActivityButton({ activity }: { activity: Activity }) {
    const [processing, setProcessing] = useState(false);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" aria-label="Eliminar carrera">
                    <Trash2 />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Eliminar esta carrera?</DialogTitle>
                    <DialogDescription>
                        Se borrarán también sus parciales. Esta acción no se
                        puede deshacer.
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
                            router.delete(activities.destroy.url(activity.id), {
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

ActivityShow.layout = ({ activity }: { activity: Activity }) => ({
    breadcrumbs: [
        { title: 'Carreras', href: activities.index() },
        { title: activity.name, href: activities.show(activity.id) },
    ],
});
