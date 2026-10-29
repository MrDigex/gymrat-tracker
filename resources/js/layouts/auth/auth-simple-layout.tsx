import { Link, usePage } from '@inertiajs/react';
import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import { MascotOnTape, Wordmark } from '@/components/public/wordmark';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

/**
 * Design copy for auth pages whose own `layout` props still carry the old
 * wording. Pages that set the new copy themselves are not listed.
 */
const COPY_OVERRIDES: Record<string, { title: string; description: string }> = {
    'auth/forgot-password': {
        title: '¿Olvidaste la contraseña?',
        description:
            'Escribe tu correo y te enviamos un enlace para crear una nueva.',
    },
    'auth/reset-password': {
        title: 'Nueva contraseña',
        description: 'Elige una contraseña que no uses en otras webs.',
    },
    'auth/confirm-password': {
        title: 'Zona protegida',
        description:
            'Por seguridad, confirma tu contraseña antes de continuar.',
    },
};

/**
 * Shared look for every auth form, including pages whose markup still uses
 * the default shadcn controls: tall inputs, bold labels and the 56 px
 * yellow uppercase submit button.
 */
const FORM_SKIN = cn(
    '[&_[data-slot=label]]:text-sm [&_[data-slot=label]]:font-bold',
    '[&_input[data-slot=input]]:h-[54px] [&_input[data-slot=input]]:rounded-[14px] [&_input[data-slot=input]]:bg-card [&_input[data-slot=input]]:px-4 [&_input[data-slot=input]]:text-base',
    '[&_form_button:not([type=button])]:h-auto [&_form_button:not([type=button])]:min-h-14 [&_form_button:not([type=button])]:w-full [&_form_button:not([type=button])]:rounded-[16px] [&_form_button:not([type=button])]:py-3 [&_form_button:not([type=button])]:font-num [&_form_button:not([type=button])]:text-[17px] [&_form_button:not([type=button])]:leading-tight [&_form_button:not([type=button])]:whitespace-normal [&_form_button:not([type=button])]:uppercase',
);

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { component } = usePage();
    const copy = COPY_OVERRIDES[component] ?? { title, description };

    return (
        <div className="flex min-h-svh bg-background text-foreground">
            <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[#18181b] bg-chalk p-12 text-[#fafafa] lg:flex">
                <Link href={home()} className="self-start rounded-md">
                    <Wordmark withIcon className="text-2xl text-[#fafafa]" />
                    <span className="sr-only">Ir al inicio</span>
                </Link>
                <div className="relative mx-auto w-full max-w-[520px]">
                    <img src={MASCOT_SRC} alt="" className="w-full" />
                </div>
                <p className="max-w-md font-num text-4xl leading-[0.95] uppercase">
                    Entrena con un plan.{' '}
                    <span className="text-[#facc15]">Mide cada progreso.</span>
                </p>
                <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-3 bg-hazard"
                />
            </aside>

            <main className="flex w-full flex-col lg:w-[520px] lg:shrink-0 lg:justify-center">
                <Link href={home()} className="block lg:hidden">
                    <MascotOnTape
                        className="pt-4"
                        imageClassName={
                            component === 'auth/login'
                                ? undefined
                                : 'w-[42%] max-w-[180px]'
                        }
                    />
                    <span className="sr-only">Ir al inicio</span>
                </Link>

                <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pt-6 pb-6 lg:flex-none lg:px-8 lg:py-12">
                    {copy.title && (
                        <h1 className="font-num text-[32px] leading-[1.02] uppercase">
                            {copy.title}
                        </h1>
                    )}
                    {copy.description && (
                        <p className="mt-2 text-[15px] leading-snug text-foreground/80">
                            {copy.description}
                        </p>
                    )}
                    <div className={cn('mt-5 flex flex-1 flex-col', FORM_SKIN)}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
