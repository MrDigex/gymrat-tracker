import { Head } from '@inertiajs/react';
import type { HyroxSplit } from '@/components/activity-form';
import { ActivityForm } from '@/components/activity-form';
import Heading from '@/components/heading';
import activities from '@/routes/activities';
import type { Option } from '@/types';

export default function ActivitiesCreate({
    types,
    hyroxSplits,
}: {
    types: Option[];
    hyroxSplits: HyroxSplit[];
}) {
    return (
        <>
            <Head title="Registrar carrera" />
            <div className="mx-auto w-full max-w-3xl p-4">
                <Heading
                    title="Registrar carrera"
                    description="Añade una carrera, un rodaje o una competición Hyrox."
                />
                <ActivityForm types={types} hyroxSplits={hyroxSplits} />
            </div>
        </>
    );
}

ActivitiesCreate.layout = {
    breadcrumbs: [
        { title: 'Carreras', href: activities.index() },
        { title: 'Registrar carrera', href: activities.create() },
    ],
};
