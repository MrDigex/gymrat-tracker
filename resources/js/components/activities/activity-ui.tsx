import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Activity, ActivitySplit } from '@/types';

const sourceBadgeClass: Record<Activity['source'], string> = {
    strava: 'bg-[#fc4c02] text-white',
    shortcut: 'bg-foreground text-background',
    manual: 'border border-border text-foreground',
};

/**
 * Where the activity came from. The text is always shown, color is only a hint.
 */
export function SourceBadge({
    activity,
    className,
}: {
    activity: Pick<Activity, 'source' | 'source_label'>;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-bold whitespace-nowrap',
                sourceBadgeClass[activity.source],
                className,
            )}
        >
            {activity.source_label}
        </span>
    );
}

export function TypeBadge({
    activity,
    className,
}: {
    activity: Pick<Activity, 'type' | 'type_label'>;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-bold whitespace-nowrap',
                activity.type === 'hyrox'
                    ? 'bg-primary font-num text-primary-foreground uppercase'
                    : 'bg-secondary text-secondary-foreground',
                className,
            )}
        >
            {activity.type_label}
        </span>
    );
}

/**
 * Small label + big number, as in the race stats.
 */
export function Metric({
    label,
    value,
    highlight,
    size = 'md',
}: {
    label: string;
    value: ReactNode;
    highlight?: boolean;
    size?: 'md' | 'lg';
}) {
    return (
        <div className="min-w-0">
            <div className="text-[13px] text-muted-foreground">{label}</div>
            <div
                className={cn(
                    'font-num leading-tight tabular-nums',
                    size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-2xl',
                    highlight && 'text-primary-text',
                )}
            >
                {value}
            </div>
        </div>
    );
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * "Sábado, 24 oct 2026".
 */
export function longDate(iso: string, withTime = false): string {
    const date = new Date(iso);
    const part = (options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat('es-ES', options).format(date).replace('.', '');
    const time = part({ hour: '2-digit', minute: '2-digit' });

    return (
        `${capitalize(part({ weekday: 'long' }))}, ${part({ day: 'numeric' })} ${part({ month: 'short' })} ${part({ year: 'numeric' })}` +
        (withTime ? `, ${time}` : '')
    );
}

/**
 * "Mar 27 oct".
 */
export function shortDay(iso: string): string {
    const date = new Date(iso);
    const weekday = new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
    }).format(date);
    const dayMonth = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
    }).format(date);

    return `${capitalize(weekday.replace('.', ''))} ${dayMonth.replace('.', '')}`;
}

/**
 * "27 oct".
 */
export function dayMonth(iso: string): string {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
        .format(new Date(iso))
        .replace('.', '');
}

/**
 * "5:27" (no unit) for big numbers.
 */
export function paceNumber(secondsPerKm: number | null | undefined): string {
    if (!secondsPerKm) {
        return '—';
    }

    return `${Math.floor(secondsPerKm / 60)}:${(secondsPerKm % 60).toString().padStart(2, '0')}`;
}

export function kmLabel(meters: number): string {
    return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(Math.round(meters / 10) / 100)} km`;
}

export const isRunType = (type: string) =>
    ['carrera', 'trail', 'cinta'].includes(type);

export const isHyroxRun = (split: Pick<ActivitySplit, 'label'>) =>
    /^carrera\b/i.test(split.label.trim());
