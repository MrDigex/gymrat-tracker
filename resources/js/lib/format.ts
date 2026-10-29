const numberFormatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
});

export function formatNumber(value: number | null | undefined): string {
    return value === null || value === undefined
        ? '—'
        : numberFormatter.format(value);
}

export function formatKg(value: number | null | undefined): string {
    return value === null || value === undefined
        ? '—'
        : `${numberFormatter.format(value)} kg`;
}

export function formatKm(meters: number | null | undefined): string {
    return meters === null || meters === undefined
        ? '—'
        : `${numberFormatter.format(Math.round(meters / 10) / 100)} km`;
}

/**
 * Seconds to "m:ss" or "h:mm:ss".
 */
export function formatDuration(
    totalSeconds: number | null | undefined,
): string {
    if (totalSeconds === null || totalSeconds === undefined) {
        return '—';
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);
    const pad = (value: number) => value.toString().padStart(2, '0');

    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(seconds)}`
        : `${minutes}:${pad(seconds)}`;
}

export function formatPace(secondsPerKm: number | null | undefined): string {
    return secondsPerKm ? `${formatDuration(secondsPerKm)} /km` : '—';
}

/**
 * Parses "h:mm:ss", "mm:ss" or plain seconds into seconds. Returns null when invalid.
 */
export function parseDuration(value: string): number | null {
    const parts = value.trim().split(':').map(Number);

    if (parts.length === 0 || parts.length > 3 || parts.some(Number.isNaN)) {
        return null;
    }

    return parts.reduce((total, part) => total * 60 + part, 0) || null;
}

export function formatDate(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    },
): string {
    return value
        ? new Intl.DateTimeFormat('es-ES', options).format(new Date(value))
        : '—';
}

export function formatDateTime(value: string | null | undefined): string {
    return formatDate(value, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Human summary of a routine target, e.g. "3 × 8-12 · 60 kg".
 */
export function formatTarget(target: {
    target_sets: number;
    target_reps_min: number | null;
    target_reps_max: number | null;
    target_weight_kg: number | null;
    target_seconds: number | null;
    target_distance_m: number | null;
}): string {
    if (target.target_distance_m) {
        return `${target.target_sets} × ${target.target_distance_m} m${target.target_seconds ? ` · ${formatDuration(target.target_seconds)}` : ''}`;
    }

    if (target.target_seconds) {
        return `${target.target_sets} × ${target.target_seconds} s`;
    }

    const reps = [target.target_reps_min, target.target_reps_max]
        .filter((value, index, all) => value && all.indexOf(value) === index)
        .join('-');

    return [
        `${target.target_sets} × ${reps || '?'}`,
        target.target_weight_kg ? formatKg(target.target_weight_kg) : null,
    ]
        .filter(Boolean)
        .join(' · ');
}
