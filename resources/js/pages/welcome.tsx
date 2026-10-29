import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUp, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import { Wordmark } from '@/components/public/wordmark';
import { cn } from '@/lib/utils';
import { dashboard, home, login, register } from '@/routes';

const yellowCta =
    'inline-flex min-h-14 items-center justify-center gap-2 rounded-[16px] bg-[#facc15] px-7 font-num text-[17px] text-[#18181b] uppercase transition-colors hover:bg-[#eab308]';

const ghostCta =
    'inline-flex min-h-14 items-center justify-center gap-2 rounded-[16px] border border-white/25 px-6 text-base font-bold text-[#fafafa] transition-colors hover:bg-white/10';

export default function Welcome() {
    const { auth } = usePage().props;
    const loggedIn = Boolean(auth.user);

    return (
        <>
            <Head title="Entrena con un plan. Mide cada progreso." />
            <div className="min-h-screen bg-[#fafafa] text-[#18181b]">
                <Hero loggedIn={loggedIn} />
                <Features />
                <ClosingCta loggedIn={loggedIn} />
                <footer className="dark bg-[#18181b] text-[#fafafa]">
                    <div className="mx-auto flex max-w-[1232px] flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row lg:px-0">
                        <Wordmark className="text-xl" />
                        <p className="text-sm text-[#a1a1aa]">
                            © {new Date().getFullYear()} GymRat Tracker
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

function Hero({ loggedIn }: { loggedIn: boolean }) {
    return (
        <header className="dark relative bg-[#18181b] bg-chalk text-[#fafafa]">
            <nav
                aria-label="Principal"
                className="mx-auto flex max-w-[1232px] items-center justify-between gap-4 px-5 py-4 lg:px-0 lg:py-5"
            >
                <Link href={home()} className="rounded-md">
                    <Wordmark withIcon className="text-2xl" />
                </Link>
                <div className="flex items-center gap-1 sm:gap-3">
                    <a
                        href="#funciones"
                        className="hidden min-h-11 items-center rounded-md px-2 text-[15px] font-bold hover:text-[#facc15] md:inline-flex"
                    >
                        Funciones
                    </a>
                    {loggedIn ? (
                        <Link
                            href={dashboard()}
                            className="inline-flex min-h-11 items-center rounded-[14px] bg-[#facc15] px-4 text-[15px] font-bold text-[#18181b] hover:bg-[#eab308]"
                        >
                            Ir a mi panel
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="inline-flex min-h-11 items-center rounded-md px-2 text-[15px] font-bold hover:text-[#facc15]"
                            >
                                Ya tengo cuenta
                            </Link>
                            <Link
                                href={register()}
                                className="hidden min-h-11 items-center rounded-[14px] bg-[#facc15] px-4 text-[15px] font-bold text-[#18181b] hover:bg-[#eab308] sm:inline-flex"
                            >
                                Empieza gratis
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="mx-auto grid max-w-[1232px] items-center gap-6 px-5 pt-6 pb-14 lg:grid-cols-[1fr_520px] lg:gap-10 lg:px-0 lg:pt-10 lg:pb-20">
                <div>
                    <h1 className="font-num text-[52px] leading-[0.92] uppercase sm:text-[72px] lg:text-[88px]">
                        Entrena con un plan. Mide cada progreso.
                    </h1>
                    <p className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-[#e4e4e7] lg:text-lg">
                        Rutinas que te dicen cuándo subir peso, un registro de
                        series pensado para usar con una mano entre serie y
                        serie, y tus carreras y Hyrox en el mismo sitio.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        {loggedIn ? (
                            <Link href={dashboard()} className={yellowCta}>
                                Seguir entrenando
                                <ArrowRight className="size-5" aria-hidden />
                            </Link>
                        ) : (
                            <>
                                <Link href={register()} className={yellowCta}>
                                    Empieza gratis
                                </Link>
                                <Link href={login()} className={ghostCta}>
                                    Ya tengo cuenta
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
                    <img
                        src={MASCOT_SRC}
                        alt="La rata de GymRat haciendo peso muerto con discos amarillos"
                        className="mx-auto w-[80%] lg:w-full"
                    />
                    <CoachBubble className="relative -mt-12 max-w-[330px] lg:absolute lg:bottom-[4%] lg:-left-12 lg:mt-0" />
                </div>
            </div>
            <div aria-hidden className="h-3.5 bg-hazard" />
        </header>
    );
}

function CoachBubble({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'rounded-[6px_20px_20px_20px] bg-[#fafafa] p-4 text-[#18181b] shadow-float',
                className,
            )}
        >
            <span className="inline-flex items-center gap-1 rounded-full bg-[#facc15] px-2.5 py-0.5 text-xs font-extrabold">
                <ArrowUp className="size-3.5" aria-hidden />
                Sube el peso
            </span>
            <p className="mt-2 text-[15px] leading-snug font-bold">
                ¡Completaste 12 repeticiones en todas las series! Sube a 42,5 kg
                y vuelve a 8.
            </p>
        </div>
    );
}

function Features() {
    return (
        <section
            id="funciones"
            aria-labelledby="funciones-titulo"
            className="mx-auto max-w-[1232px] scroll-mt-4 px-5 py-14 lg:px-0 lg:py-20"
        >
            <h2
                id="funciones-titulo"
                className="max-w-[440px] font-num text-[40px] leading-[0.95] uppercase lg:text-[56px]"
            >
                Todo lo que pasa en el gimnasio
            </h2>

            <div className="mt-8 grid gap-4 lg:mt-10 lg:gap-5">
                <article className="grid gap-6 rounded-[24px] bg-[#18181b] p-6 text-[#fafafa] lg:grid-cols-2 lg:items-center lg:p-8">
                    <div>
                        <h3 className="font-num text-[26px] leading-none uppercase lg:text-[32px]">
                            Rutinas con sugerencias de progresión
                        </h3>
                        <p className="mt-3 leading-relaxed text-[#e4e4e7]">
                            Al añadir un ejercicio, GymRat mira tu última sesión
                            y te propone series, repeticiones y peso. Como un
                            entrenador, pero sin sermones.
                        </p>
                    </div>
                    <SetRowsMock />
                </article>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                    <LightCard>
                        <p className="font-num text-[64px] leading-none">
                            +880
                        </p>
                        <h3 className="mt-3 text-xl font-bold">
                            Ejercicios con imágenes
                        </h3>
                        <CardText>
                            Posición de inicio y final, músculos y equipamiento.
                            Y puedes crear los tuyos.
                        </CardText>
                    </LightCard>

                    <article className="relative overflow-hidden rounded-[24px] bg-[#facc15] p-7 text-[#18181b]">
                        <span
                            aria-hidden
                            className="pointer-events-none absolute -top-6 -right-2 font-num text-[180px] leading-none text-[#18181b]/10"
                        >
                            8
                        </span>
                        <h3 className="relative font-num text-[30px] leading-[0.95] uppercase">
                            Preparado para Hyrox
                        </h3>
                        <p className="relative mt-3 leading-relaxed">
                            Las 8 estaciones y los 8 km en una plantilla. Mira
                            dónde pierdes tiempo, estación a estación.
                        </p>
                    </article>

                    <LightCard>
                        <h3 className="text-xl leading-tight font-bold">
                            Carreras con Apple Watch y Strava
                        </h3>
                        <div
                            className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] font-bold"
                            aria-label="Apple Watch, después Strava, después GymRat"
                        >
                            <Chip>Apple Watch</Chip>
                            <ArrowRight className="size-3.5" aria-hidden />
                            <Chip>Strava</Chip>
                            <ArrowRight className="size-3.5" aria-hidden />
                            <Chip className="bg-[#18181b] text-[#facc15]">
                                GymRat
                            </Chip>
                        </div>
                        <CardText>
                            Tus rodajes llegan solos, con parciales, ritmo y
                            pulso.
                        </CardText>
                    </LightCard>

                    <LightCard>
                        <h3 className="text-xl leading-tight font-bold">
                            Estadísticas que se entienden
                        </h3>
                        <div
                            aria-hidden
                            className="mt-4 flex h-20 items-end gap-2"
                        >
                            {[50, 40, 62, 58, 74, 100].map((height, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        'flex-1 rounded-t-[3px]',
                                        index === 5
                                            ? 'bg-[#facc15]'
                                            : 'bg-[#2563eb]',
                                    )}
                                    style={{ height: `${height}%` }}
                                />
                            ))}
                        </div>
                        <CardText>
                            Volumen por zona, 1RM estimado, ritmo y récords.
                        </CardText>
                    </LightCard>
                </div>

                <article className="relative overflow-hidden rounded-[24px] bg-[#18181b] p-7 text-[#fafafa] sm:max-w-[296px]">
                    <h3 className="text-xl font-bold">Compártelo en redes</h3>
                    <p className="mt-2 leading-relaxed text-[#e4e4e7]">
                        Un enlace para WhatsApp o una imagen lista para tus
                        historias, con tus números en grande.
                    </p>
                    <div aria-hidden className="mt-4 flex gap-2">
                        <span className="h-24 w-14 rounded-[10px] border-t-4 border-[#facc15] bg-[#2a2a2f]" />
                        <span className="h-24 w-14 rounded-[10px] bg-[#facc15]" />
                    </div>
                </article>
            </div>
        </section>
    );
}

function SetRowsMock() {
    return (
        <div aria-hidden className="grid gap-2">
            <div className="grid h-11 grid-cols-[2rem_1fr_1fr] items-center rounded-[10px] bg-[#2a2a2f] px-4 font-num text-lg">
                <span className="text-sm">1</span>
                <span>67,5 kg</span>
                <span>× 9</span>
            </div>
            <div className="grid h-11 grid-cols-[2rem_1fr_1fr] items-center rounded-[10px] bg-[#facc15] px-4 font-num text-lg text-[#18181b]">
                <span className="text-sm">2</span>
                <span>67,5 kg</span>
                <span className="inline-flex items-center gap-1.5">
                    × 10 <Star className="size-4 fill-current" />
                </span>
            </div>
            <p className="text-sm font-bold text-[#facc15]">
                Próxima sesión: 70 kg × 8
            </p>
        </div>
    );
}

function LightCard({ children }: { children: ReactNode }) {
    return (
        <article className="rounded-[24px] border border-[#e4e4e7] bg-white p-7">
            {children}
        </article>
    );
}

function CardText({ children }: { children: ReactNode }) {
    return <p className="mt-3 leading-relaxed text-[#3f3f46]">{children}</p>;
}

function Chip({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn('rounded-full bg-[#f4f4f5] px-2.5 py-1', className)}
        >
            {children}
        </span>
    );
}

function ClosingCta({ loggedIn }: { loggedIn: boolean }) {
    return (
        <section className="bg-[#facc15] text-[#18181b]">
            <div className="mx-auto flex max-w-[1232px] flex-col gap-6 px-5 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-0 lg:py-16">
                <h2 className="max-w-[520px] font-num text-[40px] leading-[0.95] uppercase lg:text-[56px]">
                    La barra no se va a levantar sola
                </h2>
                <Link
                    href={loggedIn ? dashboard() : register()}
                    className="inline-flex min-h-[60px] items-center justify-center rounded-[16px] bg-[#18181b] px-7 font-num text-[17px] text-[#facc15] uppercase transition-colors hover:bg-[#27272a]"
                >
                    {loggedIn ? 'Ir a mi panel' : 'Crea tu cuenta gratis'}
                </Link>
            </div>
        </section>
    );
}
