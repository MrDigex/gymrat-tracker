import type { Routine } from '@/types';

/**
 * "5 ejercicios, unos 55 min".
 */
export function routineSummary(
    routine: Pick<Routine, 'estimated_minutes'>,
    count: number,
    separator = ', ',
): string {
    const exercisesText = `${count} ${count === 1 ? 'ejercicio' : 'ejercicios'}`;

    return routine.estimated_minutes
        ? `${exercisesText}${separator}unos ${routine.estimated_minutes} min`
        : exercisesText;
}

/**
 * Rest between sets: "90 s", "2 min", "2 min 30 s".
 */
export function formatRest(seconds: number): string {
    if (seconds < 120) {
        return `${seconds} s`;
    }

    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/**
 * "hoy", "ayer", "hace 3 días", "hace 2 semanas"…
 */
export function timeAgo(value: string): string {
    const day = 24 * 60 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const days = Math.round((startOfToday.getTime() - date.getTime()) / day);

    if (days < 14) {
        return relative.format(-days, 'day');
    }

    if (days < 60) {
        return relative.format(-Math.round(days / 7), 'week');
    }

    return relative.format(-Math.round(days / 30), 'month');
}
