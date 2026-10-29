import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ActivitySplit } from '@/types';
import { isHyroxRun, paceNumber } from './activity-ui';

type PacePoint = { label: string; short: string; km: boolean; pace: number };

/**
 * Splits that have a pace (distance and time), in order.
 */
export function pacePoints(splits: ActivitySplit[]): PacePoint[] {
    return splits
        .filter(
            (split): split is ActivitySplit & { pace_seconds_per_km: number } =>
                Boolean(split.pace_seconds_per_km),
        )
        .map((split, index) => {
            const km = split.label.match(/^km\s*(\d+)/i)?.[1];

            return {
                label: split.label,
                short: km ?? `${index + 1}`,
                km: Boolean(km),
                pace: split.pace_seconds_per_km,
            };
        });
}

/**
 * Notes for a run: fastest split and negative split (second half faster).
 */
export function paceInsight(splits: ActivitySplit[]): string | null {
    const timed = splits.filter(
        (split) => split.distance_m && split.duration_seconds,
    );
    const points = pacePoints(splits);

    if (points.length < 2) {
        return null;
    }

    const fastest = points.reduce((best, point) =>
        point.pace < best.pace ? point : best,
    );
    const parts = [
        `${fastest.label} el más rápido: ${paceNumber(fastest.pace)}.`,
    ];
    const half = Math.floor(timed.length / 2);
    const paceOf = (list: ActivitySplit[]) =>
        list.reduce((total, split) => total + split.duration_seconds, 0) /
        (list.reduce((total, split) => total + (split.distance_m ?? 0), 0) /
            1000);

    if (half >= 1) {
        const first = paceOf(timed.slice(0, half));
        const second = paceOf(timed.slice(timed.length - half));

        if (second < first) {
            parts.push(
                `Negativo de manual: segunda mitad ${Math.round(first - second)} s/km más rápida.`,
            );
        }
    }

    return parts.join(' ');
}

/**
 * Pace per split. The axis is reversed: bars hang from the top, so a shorter
 * bar (higher end) is a faster split. The fastest one is highlighted.
 */
export function PaceChart({ splits }: { splits: ActivitySplit[] }) {
    const points = pacePoints(splits);

    if (points.length === 0) {
        return null;
    }

    const paces = points.map((point) => point.pace);
    const fastestPace = Math.min(...paces);
    const slowestPace = Math.max(...paces);
    const range = Math.max(slowestPace - fastestPace, 20);
    // Leave room above the fastest so even it has a visible bar.
    const top = Math.floor((fastestPace - range * 0.25) / 15) * 15;
    const bottom = Math.ceil((slowestPace + range * 0.15) / 15) * 15;
    const ticks = [top, Math.round((top + bottom) / 2 / 15) * 15, bottom];
    const position = (pace: number) => ((pace - top) / (bottom - top)) * 100;
    const showValues = points.length <= 14;
    const labelEvery = Math.ceil(points.length / 12);

    return (
        <figure className="flex flex-col gap-2">
            <figcaption className="flex items-baseline justify-between gap-2 text-[13px]">
                <span>Ritmo por km (min/km)</span>
                <span className="text-muted-foreground">
                    arriba = más rápido
                </span>
            </figcaption>
            <div className="flex gap-2">
                <div
                    className="relative h-48 w-9 shrink-0 text-[11px] text-muted-foreground"
                    aria-hidden
                >
                    {ticks.map((tick) => (
                        <span
                            key={tick}
                            className="absolute right-0 -translate-y-1/2 tabular-nums"
                            style={{ top: `${position(tick)}%` }}
                        >
                            {paceNumber(tick)}
                        </span>
                    ))}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <ol
                        className="relative flex h-48 gap-0.5"
                        aria-label="Ritmo por parcial"
                    >
                        {ticks.map((tick) => (
                            <span
                                key={tick}
                                aria-hidden
                                className="absolute inset-x-0 border-t border-border/60"
                                style={{ top: `${position(tick)}%` }}
                            />
                        ))}
                        {points.map((point, index) => {
                            const fastest = point.pace === fastestPace;

                            return (
                                <li
                                    key={index}
                                    className="group relative flex flex-1 flex-col items-center"
                                    title={`${point.label}: ${paceNumber(point.pace)} /km`}
                                >
                                    <span className="sr-only">
                                        {point.label}: {paceNumber(point.pace)}{' '}
                                        /km
                                        {fastest && ', el más rápido'}
                                    </span>
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'w-full rounded-b-[4px] transition-opacity group-hover:opacity-80',
                                            fastest
                                                ? 'bg-primary'
                                                : 'bg-chart-4',
                                        )}
                                        style={{
                                            height: `${position(point.pace)}%`,
                                        }}
                                    />
                                    {showValues && (
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'mt-1 font-num text-[10px] leading-none tabular-nums sm:text-[11px]',
                                                fastest && 'text-primary-text',
                                            )}
                                        >
                                            {paceNumber(point.pace)}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                    <div
                        className="flex gap-0.5 text-[11px] text-muted-foreground"
                        aria-hidden
                    >
                        {points.map((point, index) => (
                            <span
                                key={index}
                                className="flex-1 truncate text-center"
                            >
                                {index % labelEvery === 0 && (
                                    <>
                                        {point.km && (
                                            <span className="hidden sm:inline">
                                                km{' '}
                                            </span>
                                        )}
                                        {point.short}
                                    </>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </figure>
    );
}

type Segment = {
    label: string;
    seconds: number;
    kind: 'run' | 'station';
};

export function hyroxBreakdown(splits: ActivitySplit[], totalSeconds: number) {
    const runs = splits.filter(isHyroxRun);
    const stations = splits.filter((split) => !isHyroxRun(split));
    const sum = (list: ActivitySplit[]) =>
        list.reduce((total, split) => total + split.duration_seconds, 0);
    const transitions = totalSeconds - sum(splits);

    return {
        runSeconds: sum(runs),
        stationSeconds: sum(stations),
        transitionSeconds: transitions > 0 ? transitions : 0,
        stations,
    };
}

/**
 * Best and worst station versus the average station time.
 */
export function stationInsight(splits: ActivitySplit[]): string | null {
    const stations = splits.filter((split) => !isHyroxRun(split));

    if (stations.length < 2) {
        return null;
    }

    const average =
        stations.reduce((total, split) => total + split.duration_seconds, 0) /
        stations.length;
    const best = stations.reduce((a, b) =>
        b.duration_seconds < a.duration_seconds ? b : a,
    );
    const worst = stations.reduce((a, b) =>
        b.duration_seconds > a.duration_seconds ? b : a,
    );

    return `Media por estación: ${formatDuration(Math.round(average))}. Mejor: ${best.label} (${best.duration_label}, ${formatDuration(Math.round(average - best.duration_seconds))} menos). Peor: ${worst.label} (${worst.duration_label}, +${formatDuration(Math.round(worst.duration_seconds - average))}).`;
}

/**
 * Horizontal bars per segment. Shorter = faster. Runs and stations alternate
 * in two colors, each row is labelled so color is never the only cue.
 */
export function SegmentBars({
    splits,
    hyrox,
}: {
    splits: ActivitySplit[];
    hyrox: boolean;
}) {
    const segments: Segment[] = splits.map((split) => ({
        label: split.label,
        seconds: split.duration_seconds,
        kind: hyrox && !isHyroxRun(split) ? 'station' : 'run',
    }));

    if (segments.length === 0) {
        return null;
    }

    const max = Math.max(...segments.map((segment) => segment.seconds));
    const stations = segments.filter((segment) => segment.kind === 'station');
    const bestStation =
        stations.length > 1
            ? Math.min(...stations.map((segment) => segment.seconds))
            : null;

    return (
        <figure className="flex flex-col gap-3">
            <figcaption className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold">
                        Tiempo por tramo
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                        barra corta = más rápido
                    </span>
                </div>
                {hyrox && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold">
                        <span className="flex items-center gap-1.5">
                            <span
                                className="size-3 rounded-[3px] bg-chart-4"
                                aria-hidden
                            />
                            1 km de carrera
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                className="size-3 rounded-[3px] bg-chart-5"
                                aria-hidden
                            />
                            Estación
                        </span>
                    </div>
                )}
            </figcaption>
            <ol className="flex flex-col gap-1">
                {segments.map((segment, index) => {
                    const best =
                        segment.kind === 'station' &&
                        segment.seconds === bestStation;

                    return (
                        <li
                            key={index}
                            className="grid min-h-8 grid-cols-[minmax(0,8.5rem)_1fr_3.25rem] items-center gap-3 text-sm"
                            title={`${segment.label}: ${formatDuration(segment.seconds)}`}
                        >
                            <span
                                className={cn(
                                    'truncate',
                                    segment.kind === 'run' && hyrox
                                        ? 'text-muted-foreground'
                                        : 'font-medium',
                                )}
                            >
                                {segment.label}
                                {best && (
                                    <span className="sr-only">
                                        {' '}
                                        (mejor estación)
                                    </span>
                                )}
                            </span>
                            <span className="flex h-4 items-center" aria-hidden>
                                <span
                                    className={cn(
                                        'h-3 rounded-[4px]',
                                        segment.kind === 'station'
                                            ? 'bg-chart-5'
                                            : 'bg-chart-4',
                                        best &&
                                            'outline-2 outline-offset-2 outline-primary',
                                    )}
                                    style={{
                                        width: `${Math.max((segment.seconds / max) * 100, 2)}%`,
                                    }}
                                />
                            </span>
                            <span
                                className={cn(
                                    'text-right font-num tabular-nums',
                                    best && 'text-primary-text',
                                )}
                            >
                                {formatDuration(segment.seconds)}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </figure>
    );
}
