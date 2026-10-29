import { Head, Link, usePage } from '@inertiajs/react';
import { WifiOff } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { MascotOnTape } from '@/components/public/wordmark';
import { Button } from '@/components/ui/button';
import { dashboard, home } from '@/routes';
import { index as exercisesIndex } from '@/routes/exercises';

type Copy = { title: string; description: string };

const COPY: Record<number, Copy> = {
    403: {
        title: 'Aquí no puedes pasar',
        description:
            'No tienes permiso para ver esta página. Si crees que es un error, vuelve a iniciar sesión.',
    },
    404: {
        title: 'Esta página no existe',
        description:
            'El enlace está mal escrito o la rutina ya no es pública. Vuelve al inicio y sigue entrenando.',
    },
    419: {
        title: 'La sesión ha caducado',
        description:
            'Ha pasado demasiado tiempo desde que abriste la página. Recárgala y vuelve a intentarlo.',
    },
    500: {
        title: 'Algo ha fallado en el servidor',
        description:
            'No es culpa tuya. Lo que ya guardaste está a salvo. Vuelve a intentarlo en unos segundos.',
    },
    503: {
        title: 'Estamos haciendo mantenimiento',
        description:
            'Volvemos en unos minutos. Lo que ya guardaste está a salvo.',
    },
};

function subscribeOnline(callback: () => void) {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);

    return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    };
}

function useIsOffline(): boolean {
    return useSyncExternalStore(
        subscribeOnline,
        () => !navigator.onLine,
        () => false,
    );
}

export default function ErrorPage({ status }: { status: number }) {
    const { auth } = usePage().props;
    const offline = useIsOffline();
    const copy = COPY[status] ?? COPY[500];
    const isServerError = status >= 500 || status === 419;
    const homeHref = auth.user ? dashboard() : home();

    return (
        <>
            <Head title={copy.title} />
            <div className="flex min-h-svh flex-col bg-background text-foreground">
                {offline && (
                    <div className="px-4 pt-4">
                        <div
                            role="status"
                            className="mx-auto flex max-w-[440px] gap-3 rounded-[14px] bg-foreground p-3.5 text-background"
                        >
                            <WifiOff
                                className="mt-0.5 size-5 shrink-0"
                                aria-hidden
                            />
                            <p className="text-sm leading-snug">
                                <strong className="block font-bold">
                                    Sin conexión
                                </strong>
                                Revisa tu cobertura; lo que ya guardaste está a
                                salvo.
                            </p>
                        </div>
                    </div>
                )}

                <MascotOnTape
                    className="mx-auto w-full max-w-[640px] overflow-hidden pt-6"
                    imageClassName="mt-[72px] w-[64%] max-w-[260px] sm:mt-[110px]"
                >
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 text-center font-num text-[150px] leading-none text-foreground/10 select-none sm:text-[200px]"
                    >
                        {status}
                    </span>
                </MascotOnTape>

                <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pt-6 pb-8">
                    <p className="sr-only">Error {status}</p>
                    <h1 className="font-num text-[32px] leading-[1.02] uppercase">
                        {copy.title}
                    </h1>
                    <p className="mt-2 text-[15px] leading-snug text-foreground/80">
                        {copy.description}
                    </p>

                    {isServerError ? (
                        <>
                            <Button
                                className="mt-5 h-14 rounded-[16px] font-num text-[17px] uppercase"
                                onClick={() => window.location.reload()}
                            >
                                Reintentar
                            </Button>
                            <p className="mt-4 text-center text-[13px] text-muted-foreground">
                                Código de error: {status}, por si escribes a
                                soporte
                            </p>
                        </>
                    ) : (
                        <>
                            <Button
                                asChild
                                className="mt-5 h-14 rounded-[16px] font-num text-[17px] uppercase"
                            >
                                <Link href={homeHref}>Volver al inicio</Link>
                            </Button>
                            <Link
                                href={exercisesIndex()}
                                className="mx-auto mt-4 inline-flex min-h-11 items-center px-2 text-[15px] font-bold underline underline-offset-4"
                            >
                                Buscar un ejercicio
                            </Link>
                        </>
                    )}
                </main>
            </div>
        </>
    );
}
