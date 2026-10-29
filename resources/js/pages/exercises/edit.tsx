import { Head } from '@inertiajs/react';
import type { ExerciseFormOptions } from '@/components/exercise-form';
import { ExerciseForm } from '@/components/exercise-form';
import Heading from '@/components/heading';
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

            <div className="mx-auto w-full max-w-4xl p-4">
                <Heading title="Editar ejercicio" description={exercise.name} />
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
