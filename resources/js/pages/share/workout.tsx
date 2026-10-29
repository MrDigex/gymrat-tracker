import { Head } from '@inertiajs/react';
import { ExerciseImage } from '@/components/exercise-image';
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
    TrackingType,
    WorkoutSession,
    WorkoutSet,
} from '@/types';

function formatSet(set: WorkoutSet, trackingType: TrackingType): string {
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

export default function ShareWorkout({
    session,
    exercises,
    author,
    shareUrl,
}: {
    session: WorkoutSession;
    exercises: Exercise[];
    author: string;
    shareUrl: string;
}) {
    const sets = session.sets ?? [];
    const workingSets = sets.filter((set) => !set.is_warmup);
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
    const date = formatDate(session.started_at, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            <Head title={session.name} />
            <PublicShareLayout
                badge="Entrenamiento"
                title={session.name}
                subtitle={<p className="capitalize">{date}</p>}
                author={author}
                shareUrl={shareUrl}
                shareText={`Mira el entrenamiento "${session.name}" de ${author}`}
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PublicStat
                        label="Duración"
                        value={
                            session.duration_minutes !== null
                                ? `${session.duration_minutes} min`
                                : '—'
                        }
                    />
                    <PublicStat label="Ejercicios" value={groups.length} />
                    <PublicStat label="Series" value={workingSets.length} />
                    <PublicStat
                        label="Volumen"
                        value={formatKg(session.volume_kg ?? 0)}
                    />
                </div>

                <div className="space-y-3">
                    {groups.map(({ exercise, sets: exerciseSets }) => {
                        let number = 0;

                        return (
                            <section
                                key={exercise.id}
                                className="overflow-hidden rounded-xl border bg-card"
                            >
                                <div className="flex items-center gap-3 p-3">
                                    <ExerciseImage
                                        exercise={exercise}
                                        className="w-20 shrink-0 rounded-lg"
                                    />
                                    <div className="min-w-0">
                                        <h2 className="leading-tight font-semibold">
                                            {exercise.name}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {exercise.category_label}
                                            {exercise.equipment_label
                                                ? ` · ${exercise.equipment_label}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                                <ul className="divide-y border-t">
                                    {exerciseSets.map((set) => {
                                        if (!set.is_warmup) {
                                            number += 1;
                                        }

                                        return (
                                            <li
                                                key={set.id}
                                                className="flex items-center gap-3 px-4 py-2 text-sm"
                                            >
                                                <span
                                                    className={cn(
                                                        'flex size-6 items-center justify-center rounded-full text-xs font-bold',
                                                        set.is_warmup
                                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                                            : 'bg-muted',
                                                    )}
                                                >
                                                    {set.is_warmup
                                                        ? 'C'
                                                        : number}
                                                </span>
                                                <span className="flex-1 font-medium tabular-nums">
                                                    {formatSet(
                                                        set,
                                                        exercise.tracking_type,
                                                    )}
                                                </span>
                                                {set.rpe !== null && (
                                                    <span className="text-xs text-muted-foreground">
                                                        RPE {set.rpe}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        );
                    })}
                </div>

                {session.notes && (
                    <blockquote className="rounded-xl border-l-4 border-yellow-400 bg-muted/40 p-4 text-sm italic">
                        {session.notes}
                    </blockquote>
                )}
            </PublicShareLayout>
        </>
    );
}
