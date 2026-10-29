import { Head } from '@inertiajs/react';
import type { HyroxSplit } from '@/components/activity-form';
import { ActivityForm } from '@/components/activity-form';
import Heading from '@/components/heading';
import activities from '@/routes/activities';
import type { Activity, Option } from '@/types';

export default function ActivitiesEdit({
    activity,
    types,
    hyroxSplits,
}: {
    activity: Activity;
    types: Option[];
    hyroxSplits: HyroxSplit[];
}) {
    return (
        <>
            <Head title={`Editar ${activity.name}`} />
            <div className="mx-auto w-full max-w-3xl p-4">
                <Heading title="Editar carrera" description={activity.name} />
                <ActivityForm
                    key={activity.id}
                    activity={activity}
                    types={types}
                    hyroxSplits={hyroxSplits}
                />
            </div>
        </>
    );
}

ActivitiesEdit.layout = ({ activity }: { activity: Activity }) => ({
    breadcrumbs: [
        { title: 'Carreras', href: activities.index() },
        { title: activity.name, href: activities.show(activity.id) },
        { title: 'Editar', href: activities.edit(activity.id) },
    ],
});
