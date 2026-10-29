import { usePage } from '@inertiajs/react';
import workouts from '@/routes/workouts';

/**
 * Where the "Entrenar" action goes: back to the workout in progress, or to the
 * workout history with the "Nuevo entrenamiento" dialog open.
 */
export function useTrainHref(): string {
    const { activeWorkoutId } = usePage().props;

    return activeWorkoutId
        ? workouts.show.url(activeWorkoutId)
        : workouts.index.url({ query: { nuevo: 1 } });
}
