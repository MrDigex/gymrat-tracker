import { Head } from '@inertiajs/react';
import type { HyroxSplit } from '@/components/activity-form';
import { FormHeader } from '@/components/activities/form-header';
import { ActivityForm } from '@/components/activity-form';
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
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 lg:p-6">
                <FormHeader
                    title="Editar carrera"
                    subtitle={activity.name}
                    closeHref={activities.show.url(activity.id)}
                />
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
