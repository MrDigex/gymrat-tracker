import { Form, Head, setLayoutProps, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { AuthFooterLink } from '@/components/public/auth-footer-link';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth } = usePage().props;
    const email = auth.user?.email;

    setLayoutProps({
        title: 'Revisa tu correo',
        description: email
            ? `Te hemos enviado un enlace a ${email}. Ábrelo para activar tu cuenta.`
            : 'Te hemos enviado un enlace a tu correo. Ábrelo para activar tu cuenta.',
    });

    return (
        <>
            <Head title="Verifica tu correo" />

            <Form {...send.form()} className="flex flex-col gap-4">
                {({ processing }) => (
                    <Button type="submit" disabled={processing}>
                        {processing && <Spinner />}
                        Reenviar correo
                    </Button>
                )}
            </Form>

            {status === 'verification-link-sent' && (
                <p
                    role="status"
                    className="mt-4 flex items-center gap-2 rounded-[14px] bg-muted px-4 py-3 text-sm font-medium text-trend-up"
                >
                    <Check className="size-4 shrink-0" aria-hidden />
                    Enlace nuevo enviado
                </p>
            )}

            <AuthFooterLink>
                <TextLink
                    href={logout()}
                    className="font-bold decoration-current"
                >
                    Cerrar sesión
                </TextLink>
            </AuthFooterLink>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Revisa tu correo',
    description: 'Te hemos enviado un enlace. Ábrelo para activar tu cuenta.',
};
