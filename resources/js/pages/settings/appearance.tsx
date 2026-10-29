import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { SettingsCard } from '@/components/settings/settings-card';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Ajustes de apariencia" />

            <SettingsCard
                title="Apariencia"
                description="El modo oscuro es el de siempre en el gimnasio. Sistema sigue el ajuste de tu dispositivo."
            >
                <AppearanceTabs className="max-w-md" />
            </SettingsCard>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Ajustes de apariencia',
            href: editAppearance(),
        },
    ],
};
