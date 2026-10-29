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
    BODY_ZONE_COLORS,
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
    BodyZone,
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
                <ChartLegend
                    content={() => (
                        <ZoneLegend
                            zones={visibleZones}
                            className="justify-start"
                        />
                    )}
                />
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

export function ZoneLegend({
    zones,
    className,
}: {
    zones: BodyZone[];
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-[13px] font-semibold',
                className,
            )}
        >
            {zones.map((zone) => (
                <div key={zone} className="flex items-center gap-1.5">
                    <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: BODY_ZONE_COLORS[zone] }}
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

/**
 * Card used by the dashboard and the stats page: bold title, muted caption
 * on the right and the content below.
 */
export function Panel({
    title,
    caption,
    action,
    children,
    className,
    ...props
}: {
    title: ReactNode;
    caption?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
} & Omit<ComponentProps<'section'>, 'title'>) {
    return (
        <section
            className={cn(
                'flex min-w-0 flex-col gap-4 rounded-xl bg-card p-5 text-card-foreground md:p-6',
                className,
            )}
            {...props}
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-lg leading-tight font-bold">{title}</h2>
                {caption && (
                    <span className="text-[13px] text-muted-foreground">
                        {caption}
                    </span>
                )}
                {action}
            </div>
            {children}
        </section>
    );
}

function zonesIn(rows: { zone: BodyZone }[]): BodyZone[] {
    const order: BodyZone[] = [...BODY_ZONES, 'cuerpo_completo'];

    return order.filter((zone) => rows.some((row) => row.zone === zone));
}

/**
 * Sets per muscle as labelled bars (lighter than a chart, readable on phones).
 */
export function MuscleBars({
    data,
    limit = 8,
}: {
    data: MuscleDistribution[];
    limit?: number;
}) {
    const rows = data.slice(0, limit);
    const max = Math.max(...rows.map((row) => row.sets), 1);

    return (
        <div>
            <ul className="space-y-2.5">
                {rows.map((row) => (
                    <li
                        key={row.muscle}
                        className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.25rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,9rem)_1fr_2.5rem]"
                    >
                        <span className="truncate font-medium">
                            {row.muscle}
                            <span className="sr-only">
                                {` (${BODY_ZONE_LABELS[row.zone]})`}
                            </span>
                        </span>
                        <span
                            aria-hidden
                            className="h-4 overflow-hidden rounded-[4px] bg-muted"
                        >
                            <span
                                className="block h-full rounded-[4px]"
                                style={{
                                    width: `${(row.sets / max) * 100}%`,
                                    backgroundColor: BODY_ZONE_COLORS[row.zone],
                                }}
                            />
                        </span>
                        <span className="text-right font-num">
                            {formatNumber(row.sets)}
                            <span className="sr-only"> series</span>
                        </span>
                    </li>
                ))}
            </ul>
            <ZoneLegend zones={zonesIn(rows)} className="justify-start" />
        </div>
    );
}

/**
 * Share of working sets per body zone, as one stacked bar with labels.
 */
export function ZoneShareBar({ data }: { data: MuscleDistribution[] }) {
    const total = data.reduce((sum, row) => sum + row.sets, 0);
    const shares = zonesIn(data)
        .map((zone) => {
            const sets = data
                .filter((row) => row.zone === zone)
                .reduce((sum, row) => sum + row.sets, 0);

            return { zone, percent: total ? (sets / total) * 100 : 0 };
        })
        .sort((a, b) => b.percent - a.percent);

    return (
        <div className="space-y-2.5">
            <div
                aria-hidden
                className="flex h-5 gap-0.5 overflow-hidden rounded-md"
            >
                {shares.map((share) => (
                    <span
                        key={share.zone}
                        style={{
                            width: `${share.percent}%`,
                            backgroundColor: BODY_ZONE_COLORS[share.zone],
                        }}
                    />
                ))}
            </div>
            <ul className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] font-semibold">
                {shares.map((share) => (
                    <li key={share.zone} className="flex items-center gap-1.5">
                        <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-[3px]"
                            style={{
                                backgroundColor: BODY_ZONE_COLORS[share.zone],
                            }}
                        />
                        {BODY_ZONE_LABELS[share.zone]}{' '}
                        {formatNumber(Math.round(share.percent))}%
                    </li>
                ))}
            </ul>
        </div>
    );
}

export type RecordRow = {
    key: string | number;
    title: string;
    href?: string;
    date: string | null;
    /** Main mark, e.g. "67,5 × 10" or "54:30". */
    value: string;
    /** Secondary mark, e.g. the estimated 1RM. */
    detail?: string;
    /** Yellow highlight (recent record). */
    highlight?: boolean;
};

/**
 * Personal records as rows: name and date on the left, the mark on the right.
 */
export function RecordList({ rows }: { rows: RecordRow[] }) {
    return (
        <ul className="divide-y">
            {rows.map((row) => {
                const date = row.date ? shortDay(row.date) : null;

                return (
                    <li
                        key={row.key}
                        className="flex min-h-14 items-center gap-3 py-2.5"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                                {row.href ? (
                                    <Link
                                        href={row.href}
                                        className="rounded-sm hover:underline"
                                    >
                                        {row.title}
                                    </Link>
                                ) : (
                                    row.title
                                )}
                            </p>
                            {date && (
                                <p className="text-xs text-muted-foreground sm:hidden">
                                    {date}
                                </p>
                            )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end sm:flex-row sm:items-baseline sm:gap-6">
                            <p
                                className={cn(
                                    'font-num text-lg leading-tight whitespace-nowrap',
                                    row.highlight && 'text-primary-text',
                                )}
                            >
                                {row.value}
                                {row.highlight && (
                                    <span className="sr-only">
                                        {' '}
                                        (récord reciente)
                                    </span>
                                )}
                            </p>
                            {row.detail && (
                                <p className="text-xs whitespace-nowrap text-muted-foreground sm:w-24 sm:text-right sm:text-sm">
                                    {row.detail}
                                </p>
                            )}
                        </div>
                        {date && (
                            <span className="hidden w-12 shrink-0 text-right text-xs whitespace-nowrap text-muted-foreground sm:inline">
                                {date}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * Parses "2026-10-29" as a local date (new Date() would read it as UTC).
 */
export function parseDay(value: string): Date {
    return new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
    );
}

/**
 * "29 oct".
 */
export function shortDay(value: string): string {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
        .format(parseDay(value))
        .replace('.', '');
}

/**
 * "67,5 × 10" for a record set.
 */
export function formatBestSet(record: PersonalRecord): string {
    return `${formatNumber(record.weight_kg)} × ${record.reps}`;
}

/**
 * Turns strength records into RecordList rows.
 */
export function strengthRecordRows(
    records: PersonalRecord[],
    {
        highlightDays,
        withDetail = true,
    }: { highlightDays?: number; withDetail?: boolean } = {},
): RecordRow[] {
    const limit = highlightDays
        ? Date.now() - highlightDays * 24 * 60 * 60 * 1000
        : null;

    return records.map((record) => ({
        key: record.exercise_id,
        title: record.exercise,
        href: showExercise.url(record.exercise_id),
        date: record.date,
        value: formatBestSet(record),
        detail: withDetail
            ? `1RM ${formatKg(record.estimated_1rm)}`
            : undefined,
        highlight: limit === null || new Date(record.date).getTime() >= limit,
    }));
}

const groupedFormatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
    useGrouping: 'always',
});

/**
 * Like formatNumber, but always groups thousands ("8.023" instead of "8023").
 */
export function formatThousands(value: number): string {
    return groupedFormatter.format(value);
}
