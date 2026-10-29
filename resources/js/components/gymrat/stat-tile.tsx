import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatTileProps = {
    label: string;
    value: string;
    unit?: string;
    /** Comparison text, e.g. "más que el mes pasado (65 km)". */
    trend?: { direction: 'up' | 'down' | 'flat'; text: string };
    /** Values for the mini chart (optional). */
    spark?: number[];
    sparkColor?: string;
    /** Hazard stripe on top: only for the streak. */
    hazard?: boolean;
    className?: string;
};

/**
 * KPI tile. The trend is always shown with an arrow and text, never color alone.
 */
export function StatTile({
    label,
    value,
    unit,
    trend,
    spark,
    sparkColor = 'var(--primary)',
    hazard,
    className,
}: StatTileProps) {
    const TrendIcon =
        trend?.direction === 'up'
            ? ArrowUpRight
            : trend?.direction === 'down'
              ? ArrowDownRight
              : Minus;
    const trendColor =
        trend?.direction === 'up'
            ? 'text-trend-up'
            : trend?.direction === 'down'
              ? 'text-trend-down'
              : 'text-muted-foreground';

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl bg-card text-card-foreground',
                className,
            )}
        >
            {hazard && <div className="h-[5px] bg-hazard" aria-hidden />}
            <div className="flex items-end justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[13px] text-muted-foreground">
                        {label}
                    </span>
                    <span>
                        <span className="font-num text-4xl leading-none lg:text-5xl">
                            {value}
                        </span>
                        {unit && (
                            <span className="ml-1 text-sm text-muted-foreground">
                                {unit}
                            </span>
                        )}
                    </span>
                    {trend && (
                        <span
                            className={cn(
                                'flex items-center gap-1 text-xs',
                                trendColor,
                            )}
                        >
                            <TrendIcon
                                className="size-3.5 shrink-0"
                                strokeWidth={2.4}
                                aria-hidden
                            />
                            <span>{trend.text}</span>
                        </span>
                    )}
                </div>
                {spark && spark.length > 1 && (
                    <Sparkline data={spark} color={sparkColor} />
                )}
            </div>
        </div>
    );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
    const width = 72;
    const height = 32;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const points = data
        .map(
            (value, index) =>
                `${(index / (data.length - 1)) * width},${height - 3 - ((value - min) / (max - min || 1)) * (height - 6)}`,
        )
        .join(' ');

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden
            className="shrink-0"
        >
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
