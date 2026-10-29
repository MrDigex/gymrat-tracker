import { Head } from '@inertiajs/react';
import type { ExerciseFormOptions } from '@/components/exercise-form';
import { ExerciseForm, ExerciseFormHeader } from '@/components/exercise-form';
import exercises from '@/routes/exercises';

export default function ExerciseCreate(options: ExerciseFormOptions) {
    return (
        <>
            <Head title="Nuevo ejercicio" />

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-2 lg:pt-6">
                <ExerciseFormHeader
                    title="Nuevo ejercicio"
                    closeHref={exercises.index.url()}
                />
                <ExerciseForm options={options} />
            </div>
        </>
    );
}

ExerciseCreate.layout = {
    breadcrumbs: [
        { title: 'Ejercicios', href: exercises.index() },
        { title: 'Nuevo', href: exercises.create() },
    ],
};
