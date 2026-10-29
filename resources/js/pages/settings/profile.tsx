import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, LogOut } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import AppearanceTabs from '@/components/appearance-tabs';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { SettingsGroupLabel } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { index as integrationsIndex } from '@/routes/integrations';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();
    const cleanup = useMobileNavigation();

    return (
        <>
            <Head title="Ajustes de perfil" />

            <section
                className="flex flex-col gap-4 rounded-xl bg-card p-4 lg:p-5"
                aria-labelledby="profile-title"
            >
                <div className="flex items-center gap-3">
                    <span
                        className="grid size-14 shrink-0 place-items-center rounded-full bg-primary font-num text-xl text-primary-foreground"
                        aria-hidden
                    >
                        {getInitials(auth.user.name)}
                    </span>
                    <div className="min-w-0">
                        <h2
                            id="profile-title"
                            className="truncate text-lg leading-tight font-bold"
                        >
                            {auth.user.name}
                        </h2>
                        <p className="truncate text-sm text-muted-foreground">
                            {auth.user.email}
                        </p>
                    </div>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="flex flex-col gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        className="h-12 rounded-xl"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nombre completo"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">
                                        Correo electrónico
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="h-12 rounded-xl"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Correo electrónico"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Tu correo electrónico no está
                                            verificado.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline underline-offset-4"
                                            >
                                                Haz clic aquí para reenviar el
                                                correo de verificación.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-success">
                                                Te hemos enviado un nuevo enlace
                                                de verificación a tu correo.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div>
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="h-12 rounded-xl px-5 font-bold"
                                >
                                    Guardar cambios
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </section>

            {/* On phones this page is the settings hub, as in the design. */}
            <div className="flex flex-col gap-2 lg:hidden">
                <SettingsGroupLabel>Apariencia</SettingsGroupLabel>
                <AppearanceTabs />
            </div>

            <div className="flex flex-col gap-2 lg:hidden">
                <SettingsGroupLabel>Seguridad</SettingsGroupLabel>
                <nav
                    className="flex flex-col divide-y overflow-hidden rounded-xl bg-card"
                    aria-label="Seguridad e integraciones"
                >
                    <HubRow
                        href={`${editSecurity.url()}#password`}
                        title="Contraseña"
                        subtitle="Cámbiala cuando quieras"
                    />
                    <HubRow
                        href={`${editSecurity.url()}#two-factor`}
                        title="Verificación en dos pasos"
                        subtitle="Un código extra al iniciar sesión"
                    />
                    <HubRow
                        href={`${editSecurity.url()}#passkeys`}
                        title="Passkeys"
                        subtitle="Entra con Face ID o la huella"
                    />
                    <HubRow
                        href={integrationsIndex.url()}
                        title="Integraciones"
                        subtitle="Strava y atajo de iOS"
                    />
                </nav>
            </div>

            <Button
                variant="outline"
                className="h-14 rounded-xl text-base font-bold"
                asChild
            >
                <Link
                    href={logout()}
                    as="button"
                    onClick={() => {
                        cleanup();
                        router.flushAll();
                    }}
                >
                    <LogOut className="size-5" />
                    Cerrar sesión
                </Link>
            </Button>

            <DeleteUser />
        </>
    );
}

function HubRow({
    href,
    title,
    subtitle,
}: {
    href: string;
    title: string;
    subtitle: string;
}) {
    return (
        <Link
            href={href}
            className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        >
            <span className="min-w-0 flex-1">
                <span className="block font-bold">{title}</span>
                <span className="block text-[13px] text-muted-foreground">
                    {subtitle}
                </span>
            </span>
            <ChevronRight
                className="size-5 text-muted-foreground"
                aria-hidden
            />
        </Link>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Ajustes de perfil',
            href: edit(),
        },
    ],
};
