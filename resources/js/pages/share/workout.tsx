import { Head } from '@inertiajs/react';
import { Star } from 'lucide-react';
import {
    PublicShareLayout,
    PublicStat,
} from '@/components/public-share-layout';
import {
    formatDate,
    formatDuration,
    formatKg,
    formatNumber,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    Exercise,
    SessionRecord,
    TrackingType,
    WorkoutSession,
    WorkoutSet,
} from '@/types';

const kgFormatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
    useGrouping: 'always',
});

/** "8.023 kg" (es-ES skips the separator for four digits by default). */
function formatVolume(kg: number, fractionDigits = 1): string {
    const value = fractionDigits === 0 ? Math.round(kg) : kg;

    return `${kgFormatter.format(value)} kg`;
}

/**
 * Splits a set into the main figure and the secondary one ("67,5 kg", "× 9").
 */
function setColumns(
    set: WorkoutSet,
    trackingType: TrackingType,
): [string, string] {
    switch (trackingType) {
        case 'weight_reps':
            return set.weight_kg
                ? [formatKg(set.weight_kg), `× ${set.reps ?? 0}`]
                : [`${set.reps ?? 0} reps`, ''];
        case 'reps':
            return [`${set.reps ?? 0} reps`, ''];
        case 'time':
            return [formatDuration(set.duration_seconds), ''];
        case 'distance_time':
            return [
                `${formatNumber(set.distance_m)} m`,
                formatDuration(set.duration_seconds),
            ];
    }
}

function setVolume(sets: WorkoutSet[]): number {
    return sets
        .filter((set) => !set.is_warmup)
        .reduce(
            (total, set) => total + (set.weight_kg ?? 0) * (set.reps ?? 0),
            0,
        );
}

export default function ShareWorkout({
    session,
    exercises,
    records = [],
    author,
}: {
    session: WorkoutSession;
    exercises: Exercise[];
    records?: SessionRecord[];
    author: string;
}) {
    const sets = session.sets ?? [];
    const workingSets = sets.filter((set) => !set.is_warmup);
    const recordSetIds = new Set(records.map((record) => record.set_id));
    const order = [...new Set(sets.map((set) => set.exercise_id))];
    const groups = order
        .map((exerciseId) => ({
            exercise: exercises.find((exercise) => exercise.id === exerciseId),
            sets: sets.filter((set) => set.exercise_id === exerciseId),
        }))
        .filter(
            (group): group is { exercise: Exercise; sets: WorkoutSet[] } =>
                group.exercise !== undefined,
        );
    const weekday = formatDate(session.started_at, { weekday: 'long' });
    const date = formatDate(session.started_at);
    const hasWarmups = sets.some((set) => set.is_warmup);
    const hasRecords = recordSetIds.size > 0;

    return (
        <>
            <Head title={session.name} />
            <PublicShareLayout pitch="Registra tus series en segundos y bate tus marcas.">
                <section className="dark rounded-[24px] border border-white/10 bg-[#18181b] bg-chalk p-5 text-[#fafafa]">
                    <p className="text-[15px] text-[#e4e4e7]">
                        {author} entrenó el {weekday} {date}
                    </p>
                    <h1 className="mt-1 font-num text-[52px] leading-[0.95] break-words uppercase sm:text-[64px]">
                        {session.name}
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
                        <PublicStat
                            label="Duración"
                            value={
                                session.duration_minutes !== null
                                    ? `${session.duration_minutes} min`
                                    : '—'
                            }
                        />
                        <PublicStat
                            label="Volumen"
                            value={formatVolume(session.volume_kg ?? 0, 0)}
                            valueClassName="text-[#facc15]"
                        />
                        <PublicStat label="Series" value={workingSets.length} />
                    </div>
                </section>

                <div className="mt-3 grid gap-3">
                    {groups.map(({ exercise, sets: exerciseSets }) => {
                        let number = 0;
                        const volume = setVolume(exerciseSets);

                        return (
                            <section
                                key={exercise.id}
                                className="overflow-hidden rounded-[16px] border bg-card"
                            >
                                <header className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
                                    <h2 className="leading-tight font-bold">
                                        {exercise.name}
                                    </h2>
                                    {volume > 0 && (
                                        <span className="shrink-0 text-[13px] text-muted-foreground">
                                            {formatVolume(volume)}
                                        </span>
                                    )}
                                </header>
                                <ul>
                                    {exerciseSets.map((set) => {
                                        if (!set.is_warmup) {
                                            number += 1;
                                        }

                                        const isRecord = recordSetIds.has(
                                            set.id,
                                        );
                                        const [main, secondary] = setColumns(
                                            set,
                                            exercise.tracking_type,
                                        );

                                        return (
                                            <li
                                                key={set.id}
                                                className={cn(
                                                    'grid min-h-[39px] grid-cols-[2.5rem_1fr_1fr_2rem] items-center px-4 font-num text-[17px]',
                                                    isRecord &&
                                                        'bg-primary/25 dark:bg-primary/15',
                                                    set.is_warmup &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                <span className="text-xs">
                                                    {set.is_warmup ? (
                                                        <>
                                                            <span aria-hidden>
                                                                C
                                                            </span>
                                                            <span className="sr-only">
                                                                Calentamiento
                                                            </span>
                                                        </>
                                                    ) : (
                                                        number
                                                    )}
                                                </span>
                                                <span>{main}</span>
                                                <span>{secondary}</span>
                                                <span className="justify-self-end">
                                                    {isRecord && (
                                                        <>
                                                            <Star
                                                                className="size-[18px] fill-current"
                                                                aria-hidden
                                                            />
                                                            <span className="sr-only">
                                                                Récord personal
                                                            </span>
                                                        </>
                                                    )}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        );
                    })}
                </div>

                {(hasWarmups || hasRecords) && (
                    <p className="mt-3 text-[13px] text-muted-foreground">
                        {hasWarmups &&
                            'C = serie de calentamiento, no cuenta en el volumen.'}
                        {hasWarmups && hasRecords && ' '}
                        {hasRecords && '★ = récord personal.'}
                    </p>
                )}

                {session.notes && (
                    <blockquote className="mt-4 rounded-[14px] border-l-4 border-primary bg-muted p-4 text-sm italic">
                        {session.notes}
                    </blockquote>
                )}
            </PublicShareLayout>
        </>
    );
}
