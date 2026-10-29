import { Head } from '@inertiajs/react';
import type { ExerciseFormOptions } from '@/components/exercise-form';
import { ExerciseForm, ExerciseFormHeader } from '@/components/exercise-form';
import exercises from '@/routes/exercises';
import type { Exercise } from '@/types';

type Props = ExerciseFormOptions & {
    exercise: Exercise;
    values: {
        equipment: string | null;
        level: string | null;
        mechanic: string | null;
    };
};

export default function ExerciseEdit({ exercise, values, ...options }: Props) {
    return (
        <>
            <Head title={`Editar ${exercise.name}`} />

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-2 lg:pt-6">
                <ExerciseFormHeader
                    title="Editar ejercicio"
                    closeHref={exercises.show.url(exercise.id)}
                />
                <ExerciseForm
                    options={options}
                    exercise={exercise}
                    values={values}
                />
            </div>
        </>
    );
}

ExerciseEdit.layout = ({ exercise }: Props) => ({
    breadcrumbs: [
        { title: 'Ejercicios', href: exercises.index() },
        { title: exercise.name, href: exercises.show(exercise.id) },
        { title: 'Editar', href: exercises.edit(exercise.id) },
    ],
});
