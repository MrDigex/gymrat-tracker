import { Head, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { ActiveWorkout } from '@/components/workout/active-workout';
import { WorkoutFinished } from '@/components/workout/workout-finished';
import type { Entry } from '@/components/workout/workout-helpers';
import exercisesRoutes from '@/routes/exercises';
import workouts from '@/routes/workouts';
import type {
    Exercise,
    SessionRecord,
    Suggestion,
    WorkoutEntry,
    WorkoutSession,
} from '@/types';

export default function WorkoutShow({
    session,
    entries,
    records = [],
}: {
    session: WorkoutSession;
    entries: WorkoutEntry[];
    records?: SessionRecord[];
}) {
    const [extraEntries, setExtraEntries] = useState<Entry[]>([]);
    const [editingFinished, setEditingFinished] = useState(false);
    const suggestionHttp = useHttp<{ exclude_session: number }, Suggestion>({
        exclude_session: session.id,
    });

    const finished = session.finished_at !== null;
    const entryIds = new Set(entries.map((entry) => entry.exercise.id));
    const allEntries: Entry[] = [
        ...entries,
        ...extraEntries.filter((entry) => !entryIds.has(entry.exercise.id)),
    ];

    const addExercise = (exercise: Exercise) => {
        if (allEntries.some((entry) => entry.exercise.id === exercise.id)) {
            return;
        }

        setExtraEntries((current) => [
            ...current,
            { exercise, target: null, suggestion: null, loading: true },
        ]);

        const resolve = (suggestion: Suggestion | null) =>
            setExtraEntries((current) =>
                current.map((entry) =>
                    entry.exercise.id === exercise.id
                        ? { ...entry, suggestion, loading: false }
                        : entry,
                ),
            );

        suggestionHttp
            .get(exercisesRoutes.suggestion.url(exercise.id))
            .then(resolve)
            .catch(() => resolve(null));
    };

    const removeExtra = (exerciseId: number) =>
        setExtraEntries((current) =>
            current.filter((entry) => entry.exercise.id !== exerciseId),
        );

    return (
        <>
            <Head title={session.name} />
            {finished && !editingFinished ? (
                <WorkoutFinished
                    session={session}
                    entries={allEntries}
                    records={records}
                    onEdit={() => setEditingFinished(true)}
                />
            ) : (
                <ActiveWorkout
                    session={session}
                    entries={allEntries}
                    records={records}
                    removableIds={allEntries
                        .filter((entry) => !entryIds.has(entry.exercise.id))
                        .map((entry) => entry.exercise.id)}
                    onAddExercise={addExercise}
                    onRemoveExercise={removeExtra}
                    onBackToSummary={
                        finished ? () => setEditingFinished(false) : undefined
                    }
                />
            )}
        </>
    );
}

WorkoutShow.layout = ({ session }: { session: WorkoutSession }) => ({
    breadcrumbs: [
        { title: 'Entrenamientos', href: workouts.index() },
        { title: session.name, href: workouts.show(session.id) },
    ],
});
