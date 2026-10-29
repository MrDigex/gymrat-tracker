import { Head } from '@inertiajs/react';
import type { ExerciseFormOptions } from '@/components/exercise-form';
import { ExerciseForm } from '@/components/exercise-form';
import Heading from '@/components/heading';
import exercises from '@/routes/exercises';

export default function ExerciseCreate(options: ExerciseFormOptions) {
    return (
        <>
            <Head title="Crear ejercicio" />

            <div className="mx-auto w-full max-w-4xl p-4">
                <Heading
                    title="Crear ejercicio"
                    description="Añade un ejercicio personalizado a tu biblioteca."
                />
                <ExerciseForm options={options} />
            </div>
        </>
    );
}

ExerciseCreate.layout = {
    breadcrumbs: [
        { title: 'Ejercicios', href: exercises.index() },
        { title: 'Crear', href: exercises.create() },
    ],
};
