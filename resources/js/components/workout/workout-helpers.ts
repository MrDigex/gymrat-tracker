import {
    formatDuration,
    formatKg,
    formatNumber,
    formatPace,
    parseDuration,
} from '@/lib/format';
import type {
    RoutineExercise,
    SessionRecord,
    Suggestion,
    TrackingType,
    WorkoutEntry,
    WorkoutSet,
} from '@/types';

export type Entry = Omit<WorkoutEntry, 'suggestion'> & {
    suggestion: Suggestion | null;
    loading?: boolean;
};

export type SetFormData = {
    weight_kg: string;
    reps: string;
    duration_seconds: string;
    distance_m: string;
    rpe: string;
    is_warmup: boolean;
};

export type SetValues = Pick<
    WorkoutSet,
    'reps' | 'weight_kg' | 'duration_seconds' | 'distance_m' | 'is_warmup'
>;

export const DEFAULT_REST_SECONDS = 90;

export function parseNumber(value: string): number | null {
    const normalized = value.trim().replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
}

export function parseInteger(value: string): number | null {
    const parsed = parseNumber(value);

    return parsed === null ? null : Math.round(parsed);
}

export function toPayload(
    data: SetFormData,
    trackingType: TrackingType,
): SetValues & { rpe: number | null } {
    const usesReps = trackingType === 'weight_reps' || trackingType === 'reps';
    const usesDuration =
        trackingType === 'time' || trackingType === 'distance_time';

    return {
        weight_kg:
            trackingType === 'weight_reps' ? parseNumber(data.weight_kg) : null,
        reps: usesReps ? parseInteger(data.reps) : null,
        duration_seconds: usesDuration
            ? parseDuration(data.duration_seconds)
            : null,
        distance_m:
            trackingType === 'distance_time'
                ? parseInteger(data.distance_m)
                : null,
        rpe: parseInteger(data.rpe),
        is_warmup: data.is_warmup,
    };
}

export function defaultsFromSuggestion(
    suggestion: Suggestion | null,
    target: RoutineExercise | null,
): SetFormData {
    const reps =
        suggestion?.reps ??
        suggestion?.reps_min ??
        target?.target_reps_min ??
        null;
    const weight = suggestion?.weight_kg ?? target?.target_weight_kg ?? null;
    const duration =
        suggestion?.duration_seconds ?? target?.target_seconds ?? null;
    const distance =
        suggestion?.distance_m ?? target?.target_distance_m ?? null;

    return {
        weight_kg: weight?.toString() ?? '',
        reps: reps?.toString() ?? '',
        duration_seconds: duration ? formatDuration(duration) : '',
        distance_m: distance?.toString() ?? '',
        rpe: '',
        is_warmup: false,
    };
}

/**
 * Form values from an already logged set (to edit it).
 */
export function formDataFromSet(set: WorkoutSet): SetFormData {
    return {
        weight_kg: set.weight_kg?.toString() ?? '',
        reps: set.reps?.toString() ?? '',
        duration_seconds: set.duration_seconds
            ? formatDuration(set.duration_seconds)
            : '',
        distance_m: set.distance_m?.toString() ?? '',
        rpe: set.rpe?.toString() ?? '',
        is_warmup: set.is_warmup,
    };
}

/**
 * Whether a working set reaches the values suggested for today.
 */
export function meetsTarget(
    set: SetValues,
    suggestion: Suggestion | null,
    trackingType: TrackingType,
): boolean {
    if (!suggestion || set.is_warmup) {
        return false;
    }

    const targetReps = suggestion.reps ?? suggestion.reps_min;

    switch (trackingType) {
        case 'weight_reps':
            if (suggestion.weight_kg === null && targetReps === null) {
                return false;
            }

            return (
                (suggestion.weight_kg === null ||
                    (set.weight_kg ?? 0) >= suggestion.weight_kg) &&
                (targetReps === null || (set.reps ?? 0) >= targetReps)
            );
        case 'reps':
            return targetReps !== null && (set.reps ?? 0) >= targetReps;
        case 'time':
            return (
                suggestion.duration_seconds !== null &&
                (set.duration_seconds ?? 0) >= suggestion.duration_seconds
            );
        case 'distance_time':
            return (
                suggestion.duration_seconds !== null &&
                set.duration_seconds !== null &&
                set.duration_seconds <= suggestion.duration_seconds &&
                (suggestion.distance_m === null ||
                    (set.distance_m ?? 0) >= suggestion.distance_m)
            );
    }
}

export function formatSet(set: SetValues, trackingType: TrackingType): string {
    switch (trackingType) {
        case 'weight_reps':
            return set.weight_kg
                ? `${formatKg(set.weight_kg)} × ${set.reps ?? 0}`
                : `${set.reps ?? 0} reps`;
        case 'reps':
            return `${set.reps ?? 0} reps`;
        case 'time':
            return formatDuration(set.duration_seconds);
        case 'distance_time':
            return `${formatNumber(set.distance_m)} m · ${formatDuration(set.duration_seconds)}`;
    }
}

/**
 * Short text for the "objetivo cumplido" banner, e.g. "9 reps @ 67,5".
 */
export function formatSetShort(
    set: SetValues,
    trackingType: TrackingType,
): string {
    switch (trackingType) {
        case 'weight_reps':
            return set.weight_kg
                ? `${set.reps ?? 0} reps @ ${formatNumber(set.weight_kg)}`
                : `${set.reps ?? 0} reps`;
        default:
            return formatSet(set, trackingType);
    }
}

/**
 * Table columns for each tracking type.
 */
export function setColumns(
    trackingType: TrackingType,
): { label: string; value: (set: SetValues) => string }[] {
    const reps = {
        label: 'Reps',
        value: (set: SetValues) => formatNumber(set.reps),
    };
    const time = {
        label: 'Tiempo',
        value: (set: SetValues) => formatDuration(set.duration_seconds),
    };

    switch (trackingType) {
        case 'weight_reps':
            return [
                {
                    label: 'Kg',
                    value: (set) => formatNumber(set.weight_kg ?? 0),
                },
                reps,
            ];
        case 'reps':
            return [reps];
        case 'time':
            return [time];
        case 'distance_time':
            return [
                {
                    label: 'Metros',
                    value: (set) => formatNumber(set.distance_m),
                },
                time,
            ];
    }
}

/**
 * Planned working sets of an entry (routine target, or the suggestion for extra exercises).
 */
export function plannedSets(entry: Entry): number {
    return entry.target?.target_sets ?? entry.suggestion?.sets ?? 0;
}

/**
 * "4 × 6-10" style target, from the routine or the suggestion.
 */
export function targetLabel(entry: Entry): string | null {
    const { target, suggestion } = entry;
    const sets = plannedSets(entry);

    if (!sets) {
        return null;
    }

    const min = target?.target_reps_min ?? suggestion?.reps_min ?? null;
    const max = target?.target_reps_max ?? suggestion?.reps_max ?? null;
    const seconds = target?.target_seconds ?? suggestion?.duration_seconds;
    const distance = target?.target_distance_m ?? suggestion?.distance_m;

    if (distance) {
        return `${sets} × ${formatNumber(distance)} m`;
    }

    if (seconds && !min) {
        return `${sets} × ${formatDuration(seconds)}`;
    }

    const reps =
        min && max && min !== max
            ? `${min}-${max}`
            : (min ?? max ?? suggestion?.reps ?? null);

    return reps ? `${sets} × ${reps}` : `${sets} series`;
}

/**
 * Next-exercise preview, e.g. "3 × 8-12 · 50 kg".
 */
export function nextTargetLabel(entry: Entry): string {
    const weight =
        entry.suggestion?.weight_kg ?? entry.target?.target_weight_kg ?? null;

    return [targetLabel(entry), weight ? formatKg(weight) : null]
        .filter(Boolean)
        .join(' · ');
}

/**
 * Per-exercise summary for the finished workout, e.g. "4 × 9-10 · 67,5".
 */
export function exerciseSummary(
    sets: WorkoutSet[],
    trackingType: TrackingType,
): string {
    const working = sets.filter((set) => !set.is_warmup);
    const list = working.length > 0 ? working : sets;
    const range = (values: number[]) => {
        const min = Math.min(...values);
        const max = Math.max(...values);

        return min === max
            ? formatNumber(min)
            : `${formatNumber(min)}-${formatNumber(max)}`;
    };
    const values = (pick: (set: WorkoutSet) => number | null) =>
        list.map(pick).filter((value): value is number => value !== null);

    switch (trackingType) {
        case 'weight_reps': {
            const reps = values((set) => set.reps);
            const weight = Math.max(0, ...values((set) => set.weight_kg));

            return [
                `${list.length} × ${reps.length ? range(reps) : '—'}`,
                weight ? formatNumber(weight) : null,
            ]
                .filter(Boolean)
                .join(' · ');
        }
        case 'reps': {
            const reps = values((set) => set.reps);

            return `${list.length} × ${reps.length ? range(reps) : '—'}`;
        }
        case 'time':
            return `${list.length} × ${formatDuration(Math.max(0, ...values((set) => set.duration_seconds)))}`;
        case 'distance_time': {
            const distance = values((set) => set.distance_m);

            return `${list.length} × ${distance.length ? range(distance) : '—'} m`;
        }
    }
}

/**
 * Best working set of an exercise (heaviest, most reps, longest or fastest).
 */
export function bestSet(sets: WorkoutSet[], trackingType: TrackingType) {
    const working = sets.filter((set) => !set.is_warmup);
    const candidates = working.length > 0 ? working : sets;

    if (candidates.length === 0) {
        return null;
    }

    const score = (set: WorkoutSet): number => {
        switch (trackingType) {
            case 'weight_reps':
                return (set.weight_kg ?? 0) * 1000 + (set.reps ?? 0);
            case 'reps':
                return set.reps ?? 0;
            case 'time':
                return set.duration_seconds ?? 0;
            case 'distance_time':
                return set.duration_seconds
                    ? (set.distance_m ?? 0) / set.duration_seconds
                    : 0;
        }
    };

    return candidates.reduce((best, set) =>
        score(set) > score(best) ? set : best,
    );
}

/**
 * Value of a personal record in its unit, e.g. "90 kg" or "4:32 /km".
 */
export function formatRecordValue(
    type: SessionRecord['type'],
    value: number,
): string {
    switch (type) {
        case 'one_rep_max':
        case 'weight':
            return formatKg(value);
        case 'reps':
            return `${formatNumber(value)} reps`;
        case 'duration':
            return formatDuration(value);
        case 'pace':
            return formatPace(value);
    }
}

/**
 * Elapsed time as "32:20" or "1:02:05".
 */
export function formatElapsed(seconds: number): string {
    return formatDuration(Math.max(0, Math.floor(seconds)));
}

/**
 * Whether a keyboard event comes from somewhere typing happens.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    );
}

const groupedFormatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
    useGrouping: 'always',
} as Intl.NumberFormatOptions);

/**
 * Number with thousands separator also for 4 digits ("1.215"), as in the design.
 */
export function formatGrouped(value: number): string {
    return groupedFormatter.format(value);
}
