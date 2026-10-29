import { Head } from '@inertiajs/react';
import type { HyroxSplit } from '@/components/activity-form';
import { FormHeader } from '@/components/activities/form-header';
import { ActivityForm } from '@/components/activity-form';
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
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 lg:p-6">
                <FormHeader
                    title="Registrar carrera"
                    closeHref={activities.index.url()}
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
