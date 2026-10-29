import { Link } from '@inertiajs/react';
import type { ComponentProps, ReactNode } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    Rectangle,
    XAxis,
    YAxis,
} from 'recharts';
import type { BarShapeProps } from 'recharts';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    BODY_ZONE_LABELS,
    BODY_ZONES,
    bodyZoneChartConfig,
    runningChartConfig,
} from '@/lib/chart-colors';
import {
    formatDate,
    formatDuration,
    formatKg,
    formatNumber,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { show as showExercise } from '@/routes/exercises';
import type {
    MuscleDistribution,
    PersonalRecord,
    WeeklyRunning,
    WeeklyVolume,
} from '@/types';

type TooltipFormatter = ComponentProps<typeof ChartTooltipContent>['formatter'];

/**
 * Tooltip row with a color swatch, the series label and a formatted value.
 */
export function tooltipFormatter(
    config: ChartConfig,
    format: (value: number) => string,
): TooltipFormatter {
    return (value, name, item) => {
        const key = String(item.dataKey ?? name);
        const color =
            (item.payload as { fill?: string } | undefined)?.fill ??
            item.color ??
            `var(--color-${key})`;

        return (
            <div className="flex w-full items-center gap-2">
                <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">
                    {config[key]?.label ?? name}
                </span>
                <span className="ml-auto pl-3 font-mono font-medium text-foreground tabular-nums">
                    {format(Number(value))}
                </span>
            </div>
        );
    };
}

export function ChartEmpty({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground',
                className,
            )}
        >
            {children}
        </div>
    );
}

const compactKg = (value: number) =>
    value >= 1000
        ? `${formatNumber(Math.round(value / 100) / 10)} t`
        : `${formatNumber(value)}`;

export function hasWeeklyVolume(data: WeeklyVolume[]): boolean {
    return data.some((week) => BODY_ZONES.some((zone) => week[zone] > 0));
}

export function WeeklyVolumeChart({
    data,
    className,
}: {
    data: WeeklyVolume[];
    className?: string;
}) {
    const visibleZones = BODY_ZONES.filter((zone) =>
        data.some((week) => week[zone] > 0),
    );

    return (
        <ChartContainer
            config={bodyZoneChartConfig}
            className={cn('aspect-auto h-64 w-full', className)}
        >
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={compactKg}
                />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            formatter={tooltipFormatter(
                                bodyZoneChartConfig,
                                formatKg,
                            )}
                        />
                    }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {visibleZones.map((zone, index) => (
                    <Bar
                        key={zone}
                        dataKey={zone}
                        stackId="volume"
                        fill={`var(--color-${zone})`}
                        stroke="var(--card)"
                        strokeWidth={1}
                        maxBarSize={36}
                        radius={
                            index === visibleZones.length - 1 ? [4, 4, 0, 0] : 0
                        }
                    />
                ))}
            </BarChart>
        </ChartContainer>
    );
}

export function MuscleDistributionChart({
    data,
    limit = 10,
    className,
}: {
    data: MuscleDistribution[];
    limit?: number;
    className?: string;
}) {
    const rows = data.slice(0, limit).map((row) => ({
        ...row,
        fill: `var(--color-${row.zone})`,
    }));
    const zones = BODY_ZONES.filter((zone) =>
        rows.some((row) => row.zone === zone),
    );
    const config = {
        ...bodyZoneChartConfig,
        sets: { label: 'Series' },
    } satisfies ChartConfig;

    return (
        <div className="space-y-3">
            <ChartContainer
                config={config}
                className={cn('aspect-auto w-full', className)}
                style={{ height: Math.max(rows.length * 32 + 64, 140) }}
            >
                <BarChart
                    data={rows}
                    layout="vertical"
                    margin={{ left: 0, right: 16 }}
                >
                    <CartesianGrid horizontal={false} />
                    <XAxis
                        type="number"
                        dataKey="sets"
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="muscle"
                        width={110}
                        tickLine={false}
                        axisLine={false}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                formatter={tooltipFormatter(
                                    config,
                                    (value) =>
                                        `${formatNumber(value)} ${value === 1 ? 'serie' : 'series'}`,
                                )}
                            />
                        }
                    />
                    <Bar
                        dataKey="sets"
                        maxBarSize={20}
                        radius={[0, 4, 4, 0]}
                        shape={(props: BarShapeProps) => (
                            <Rectangle
                                {...props}
                                fill={(props.payload as { fill: string }).fill}
                            />
                        )}
                    />
                    <ChartLegend content={() => <ZoneLegend zones={zones} />} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}

function ZoneLegend({ zones }: { zones: typeof BODY_ZONES }) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
            {zones.map((zone) => (
                <div key={zone} className="flex items-center gap-1.5">
                    <span
                        className="size-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: `var(--color-${zone})` }}
                    />
                    {BODY_ZONE_LABELS[zone]}
                </div>
            ))}
        </div>
    );
}

export function hasRunning(data: WeeklyRunning[]): boolean {
    return data.some((week) => week.km > 0);
}

export function WeeklyKmChart({
    data,
    className,
}: {
    data: WeeklyRunning[];
    className?: string;
}) {
    return (
        <ChartContainer
            config={runningChartConfig}
            className={cn('aspect-auto h-56 w-full', className)}
        >
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis
                    width={36}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatNumber(value)}
                />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            formatter={tooltipFormatter(
                                runningChartConfig,
                                (value) => `${formatNumber(value)} km`,
                            )}
                        />
                    }
                />
                <Bar
                    dataKey="km"
                    fill="var(--color-km)"
                    maxBarSize={36}
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ChartContainer>
    );
}

export function PaceChart({
    data,
    className,
}: {
    data: WeeklyRunning[];
    className?: string;
}) {
    const rows = data.map((week) => ({
        label: week.label,
        pace: week.pace_seconds_per_km,
    }));

    return (
        <ChartContainer
            config={runningChartConfig}
            className={cn('aspect-auto h-56 w-full', className)}
        >
            <LineChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis
                    reversed
                    width={44}
                    domain={['dataMin - 15', 'dataMax + 15']}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatDuration(value)}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            formatter={tooltipFormatter(
                                runningChartConfig,
                                (value) => `${formatDuration(value)} /km`,
                            )}
                        />
                    }
                />
                <Line
                    dataKey="pace"
                    type="monotone"
                    stroke="var(--color-pace)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--color-pace)' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                />
            </LineChart>
        </ChartContainer>
    );
}

export function PersonalRecordsTable({
    records,
}: {
    records: PersonalRecord[];
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ejercicio</TableHead>
                    <TableHead className="text-right">Mejor serie</TableHead>
                    <TableHead className="text-right">1RM estimado</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                        Peso máximo
                    </TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                        Fecha
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {records.map((record) => (
                    <TableRow key={record.exercise_id}>
                        <TableCell className="max-w-48 truncate font-medium">
                            <Link
                                href={showExercise(record.exercise_id)}
                                className="hover:underline"
                            >
                                {record.exercise}
                            </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatKg(record.weight_kg)} × {record.reps}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                            {formatKg(record.estimated_1rm)}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                            {formatKg(record.max_weight_kg)}
                        </TableCell>
                        <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                            {formatDate(record.date)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
