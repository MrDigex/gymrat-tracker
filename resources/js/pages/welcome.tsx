import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Dumbbell,
    Flame,
    Footprints,
    Images,
    Share2,
    Timer,
    TrendingUp,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, home, login, register } from '@/routes';

type Feature = {
    icon: LucideIcon;
    title: string;
    description: string;
};

const features: Feature[] = [
    {
        icon: TrendingUp,
        title: 'Rutinas con sugerencias de progresión',
        description:
            'Crea tus rutinas y GymRat te propone el peso y las repeticiones de cada serie según tus últimos entrenamientos.',
    },
    {
        icon: Images,
        title: 'Más de 880 ejercicios con imágenes',
        description:
            'Un catálogo completo con músculos trabajados, instrucciones e imágenes, y la opción de crear tus propios ejercicios.',
    },
    {
        icon: Timer,
        title: 'Preparado para Hyrox',
        description:
            'Registra tus estaciones (SkiErg, sled push, wall balls…) y sigue tus mejores tiempos en cada una.',
    },
    {
        icon: Footprints,
        title: 'Carreras con Apple Watch y Strava',
        description:
            'Importa tus carreras automáticamente desde Strava o con un Atajo de iOS, o regístralas a mano.',
    },
    {
        icon: BarChart3,
        title: 'Estadísticas que motivan',
        description:
            'Volumen por zona corporal, récords personales, 1RM estimado, kilómetros y ritmo semana a semana.',
    },
    {
        icon: Share2,
        title: 'Comparte en redes',
        description:
            'Comparte tus rutinas, entrenamientos y carreras con un enlace y una imagen lista para redes sociales.',
    },
];

const primaryCta =
    'inline-flex items-center justify-center gap-2 rounded-md bg-[#facc15] px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-sm transition-colors hover:bg-[#eab308] focus-visible:ring-2 focus-visible:ring-[#facc15] focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-neutral-950';

const secondaryCta =
    'inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Tu progreso en el gimnasio, bajo control" />
            <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
                    <Link href={home()} className="flex items-center gap-2">
                        <AppLogoIcon className="size-9" />
                        <span className="text-lg font-bold tracking-tight">
                            GymRat Tracker
                        </span>
                    </Link>
                    <nav className="flex items-center gap-2">
                        {auth.user ? (
                            <Link href={dashboard()} className={primaryCta}>
                                Ir a mi panel
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    href={register()}
                                    className={secondaryCta}
                                >
                                    Crear cuenta
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="flex-1">
                    <section className="relative overflow-hidden">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-3xl rounded-full bg-[#facc15]/20 blur-3xl dark:bg-[#facc15]/10"
                        />
                        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-12 pb-20 text-center lg:pt-16">
                            <img
                                src="/images/logo/gymrat-icon.png"
                                alt="GymRat, la rata de gimnasio levantando peso muerto"
                                className="mb-6 size-32 -rotate-3 drop-shadow-xl transition-transform hover:rotate-3 sm:size-40"
                            />
                            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#facc15]/40 bg-[#facc15]/10 px-3 py-1 text-xs font-medium text-yellow-800 dark:text-[#facc15]">
                                <Flame className="size-3.5" />
                                Fuerza, Hyrox y running en un solo lugar
                            </span>
                            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                                Entrena con un plan.{' '}
                                <span className="text-yellow-600 dark:text-[#facc15]">
                                    Mide cada progreso.
                                </span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg text-balance text-neutral-600 dark:text-neutral-400">
                                GymRat Tracker registra tus series, te sugiere
                                cuándo subir de peso y reúne tus entrenamientos
                                de gimnasio, Hyrox y carreras para que veas
                                exactamente cuánto estás mejorando.
                            </p>
                            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className={primaryCta}
                                    >
                                        <Dumbbell className="size-4" />
                                        Continuar entrenando
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={register()}
                                            className={primaryCta}
                                        >
                                            <Dumbbell className="size-4" />
                                            Empieza gratis
                                        </Link>
                                        <Link
                                            href={login()}
                                            className={secondaryCta}
                                        >
                                            Ya tengo cuenta
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto max-w-6xl px-6 pb-24">
                        <h2 className="sr-only">Funcionalidades</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map(
                                ({ icon: Icon, title, description }) => (
                                    <div
                                        key={title}
                                        className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs transition-colors hover:border-[#facc15]/60 dark:border-neutral-800 dark:bg-neutral-900"
                                    >
                                        <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[#facc15]/15 text-yellow-700 dark:text-[#facc15]">
                                            <Icon className="size-5" />
                                        </span>
                                        <h3 className="font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                            {description}
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    {!auth.user && (
                        <section className="border-t border-neutral-200 dark:border-neutral-800">
                            <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    Tu próxima marca personal empieza hoy
                                </h2>
                                <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
                                    Crea tu cuenta, monta tu primera rutina en
                                    minutos y deja que GymRat lleve la cuenta
                                    por ti.
                                </p>
                                <Link href={register()} className={primaryCta}>
                                    Crear mi cuenta
                                </Link>
                            </div>
                        </section>
                    )}
                </main>

                <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500 dark:border-neutral-800">
                    GymRat Tracker · Hecho para gente que no se salta el día de
                    piernas
                </footer>
            </div>
        </>
    );
}
