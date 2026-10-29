import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatTileProps = {
    label: ReactNode;
    value: string;
    unit?: string;
    /** Comparison text, e.g. "más que el mes pasado (65 km)". */
    trend?: { direction: 'up' | 'down' | 'flat'; text: ReactNode };
    /** Helper text shown under the value when there is no trend. */
    hint?: ReactNode;
    /** Values for the mini chart (optional). */
    spark?: number[];
    sparkColor?: string;
    /** Accessible summary of the mini chart. */
    sparkLabel?: string;
    sparkClassName?: string;
    /** Hazard stripe on top: only for the streak. */
    hazard?: boolean;
    /** Extra content on the right (e.g. the streak's week strip). */
    aside?: ReactNode;
    /** "empty": dashed outline and muted value, for users without data yet. */
    variant?: 'default' | 'empty';
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
    hint,
    spark,
    sparkColor = 'var(--primary)',
    sparkLabel,
    sparkClassName,
    hazard,
    aside,
    variant = 'default',
    className,
}: StatTileProps) {
    const empty = variant === 'empty';
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
                'overflow-hidden rounded-xl text-card-foreground',
                empty ? 'border-2 border-dashed' : 'bg-card',
                className,
            )}
        >
            {hazard && <div className="h-[6px] bg-hazard" aria-hidden />}
            <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-muted-foreground">
                        {label}
                    </span>
                    <span className="flex items-baseline gap-1">
                        <span
                            className={cn(
                                'font-num text-[40px] leading-none lg:text-5xl',
                                empty && 'text-muted-foreground/50',
                            )}
                        >
                            {value}
                        </span>
                        {unit && (
                            <span
                                className={cn(
                                    'text-sm font-semibold text-muted-foreground',
                                    empty &&
                                        'font-num text-[40px] leading-none text-muted-foreground/50 lg:text-5xl',
                                )}
                            >
                                {unit}
                            </span>
                        )}
                    </span>
                    {trend ? (
                        <span
                            className={cn(
                                'flex items-start gap-1 text-xs font-medium',
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
                    ) : (
                        hint && (
                            <span className="text-xs font-medium text-muted-foreground">
                                {hint}
                            </span>
                        )
                    )}
                </div>
                {aside}
                {spark && spark.length > 1 && (
                    <Sparkline
                        data={spark}
                        color={sparkColor}
                        label={sparkLabel}
                        className={sparkClassName}
                    />
                )}
            </div>
        </div>
    );
}

function Sparkline({
    data,
    color,
    label,
    className,
}: {
    data: number[];
    color: string;
    label?: string;
    className?: string;
}) {
    const width = 112;
    const height = 40;
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
            viewBox={`0 0 ${width} ${height}`}
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cn(
                'h-10 w-16 shrink-0 overflow-visible sm:w-28',
                className,
            )}
            preserveAspectRatio="none"
        >
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
