import { Deferred, Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Dumbbell, Flame, Footprints, Play } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    FirstWeekChecklist,
    OnboardingHero,
} from '@/components/dashboard/onboarding';
import { StatTile } from '@/components/gymrat/stat-tile';
import MotivationalQuote from '@/components/motivational-quote';
import {
    ChartEmpty,
    formatThousands,
    hasWeeklyVolume,
    MuscleBars,
    Panel,
    RecordList,
    strengthRecordRows,
    WeeklyVolumeChart,
} from '@/components/stats-charts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrainHref } from '@/hooks/use-train-href';
import { BODY_ZONES } from '@/lib/chart-colors';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create as createActivity } from '@/routes/activities';
import { index as statsIndex } from '@/routes/stats';
import { show as showWorkout } from '@/routes/workouts';
import type {
    MuscleDistribution,
    Onboarding,
    PersonalRecord,
    WeeklyRunning,
    WeeklyVolume,
} from '@/types';

type Kpis = {
    workouts_this_week: number;
    workouts_last_week: number;
    volume_this_week: number;
    volume_last_week: number;
    km_this_month: number;
    km_last_month: number;
    streak_days: number;
};

type RecentWorkout = {
    id: number;
    name: string;
    started_at: string;
    sets: number;
    volume_kg: number;
};

type DashboardProps = {
    quote: { text: string; author: string | null } | null;
    quoteOffset: number;
    kpis: Kpis;
    weeklyVolume?: WeeklyVolume[];
    muscleDistribution?: MuscleDistribution[];
    weeklyRunning?: WeeklyRunning[];
    personalRecords?: PersonalRecord[];
    recentWorkouts: RecentWorkout[];
    routinesCount: number;
    onboarding: Onboarding;
};

const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

function greeting(): string {
    const hour = new Date().getHours();

    if (hour < 6 || hour >= 20) {
        return 'Buenas noches';
    }

    return hour < 13 ? 'Buenos días' : 'Buenas tardes';
}

/**
 * "Jue 29 oct".
 */
function shortDay(value: string): string {
    const date = new Date(value);
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
        .format(date)
        .replace('.', '');
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' })
        .format(date)
        .replace('.', '');

    return `${capitalize(weekday)} ${date.getDate()} ${month}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
}

const kg = (value: number) => formatThousands(Math.round(value));

/**
 * Trend wording: full sentence on desktop, "vs 4 la anterior" on phones.
 */
function trendFor(
    current: number,
    previous: number,
    format: (value: number) => string,
    period: 'semana' | 'mes',
) {
    const diff = current - previous;
    const word = diff > 0 ? 'más' : diff < 0 ? 'menos' : 'igual';
    const long =
        period === 'semana' ? 'que la semana pasada' : 'que el mes pasado';
    const short = period === 'semana' ? 'la anterior' : 'el anterior';

    return {
        direction:
            diff > 0
                ? ('up' as const)
                : diff < 0
                  ? ('down' as const)
                  : ('flat' as const),
        text: (
            <>
                <span className="md:hidden">
                    <span className="sr-only">{capitalize(word)}, </span>
                    vs {format(previous)} {short}
                </span>
                <span className="hidden md:inline">
                    {word} {long} ({format(previous)})
                </span>
            </>
        ),
    };
}

export default function Dashboard({
    quote,
    quoteOffset,
    kpis,
    weeklyVolume,
    muscleDistribution,
    weeklyRunning,
    personalRecords,
    recentWorkouts,
    routinesCount,
    onboarding,
}: DashboardProps) {
    const { auth, activeWorkoutId } = usePage().props;
    const trainHref = useTrainHref();
    const firstName = auth.user.name.split(' ')[0];
    const now = new Date();
    const isNewUser =
        !onboarding.has_workout &&
        recentWorkouts.length === 0 &&
        kpis.km_this_month === 0 &&
        kpis.km_last_month === 0;
    const showChecklist = !onboarding.has_routine || !onboarding.has_workout;

    const startLabel = activeWorkoutId
        ? 'Continuar entrenamiento'
        : 'Empezar entrenamiento';
    const startHint = activeWorkoutId
        ? 'Tienes un entrenamiento en curso'
        : routinesCount > 0
          ? `Elige una de tus ${routinesCount} ${routinesCount === 1 ? 'rutina' : 'rutinas'} o entrena libre`
          : 'Entrenamiento libre';

    const header = (
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 space-y-1">
                <p className="text-[13px] font-bold tracking-[0.12em] text-muted-foreground uppercase md:text-sm md:font-medium md:tracking-normal md:normal-case">
                    <span className="md:hidden">
                        {new Intl.DateTimeFormat('es-ES', {
                            weekday: 'long',
                        }).format(now)}{' '}
                        · {now.getDate()}{' '}
                        {new Intl.DateTimeFormat('es-ES', { month: 'short' })
                            .format(now)
                            .replace('.', '')}
                    </span>
                    <span className="hidden md:inline">
                        {capitalize(
                            new Intl.DateTimeFormat('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            }).format(now),
                        )}
                    </span>
                </p>
                <h1
                    className={cn(
                        'font-num text-[40px] leading-[0.95] md:text-5xl',
                        !isNewUser && 'uppercase',
                    )}
                >
                    {isNewUser
                        ? `Hola, ${firstName}`
                        : `${greeting()}, ${firstName}`}
                </h1>
            </div>
            {!isNewUser && (
                <div className="hidden shrink-0 gap-3 md:flex">
                    <Button
                        asChild
                        variant="outline"
                        className="h-12 rounded-lg px-5 text-[15px] font-bold"
                    >
                        <Link href={createActivity()}>
                            <Footprints aria-hidden />
                            Registrar carrera
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="h-12 rounded-lg px-5 text-[15px] font-bold"
                    >
                        <Link href={trainHref}>
                            <Play className="fill-current" aria-hidden />
                            {startLabel}
                        </Link>
                    </Button>
                </div>
            )}
        </header>
    );

    if (isNewUser) {
        return (
            <>
                <Head title="Inicio" />
                <div className="flex flex-1 flex-col gap-5 p-4 md:gap-6 md:p-6 lg:p-8">
                    {header}
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
                        <OnboardingHero
                            onboarding={onboarding}
                            trainHref={trainHref}
                        />
                        <div className="flex flex-col gap-4">
                            <FirstWeekChecklist
                                onboarding={onboarding}
                                trainHref={trainHref}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <StatTile
                                    variant="empty"
                                    label="Volumen semanal"
                                    value="0"
                                    unit="kg"
                                    hint="Aparecerá tras tu primera sesión"
                                />
                                <StatTile
                                    variant="empty"
                                    label="Racha"
                                    value="0"
                                    unit="días"
                                    hint="Entrena hoy para empezarla"
                                />
                            </div>
                            <MotivationalQuote
                                quote={quote}
                                quoteOffset={quoteOffset}
                                stacked
                            />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const volumeSpark = weeklyVolume?.map((week) =>
        BODY_ZONES.reduce((sum, zone) => sum + week[zone], 0),
    );
    const kmSpark = weeklyRunning?.map((week) => week.km);
    const streakUnit = kpis.streak_days === 1 ? 'día' : 'días';

    return (
        <>
            <Head title="Inicio" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8">
                {header}

                {showChecklist && (
                    <FirstWeekChecklist
                        onboarding={onboarding}
                        trainHref={trainHref}
                    />
                )}

                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                    <StatTile
                        hazard
                        className="col-span-2 lg:col-span-1"
                        label={
                            <>
                                <span className="flex items-center gap-1.5 font-num tracking-[0.08em] text-primary-text uppercase lg:hidden">
                                    <Flame className="size-4" aria-hidden />
                                    Racha
                                </span>
                                <span className="hidden lg:inline">
                                    Racha actual
                                </span>
                            </>
                        }
                        value={formatNumber(kpis.streak_days)}
                        unit={streakUnit}
                        hint={
                            kpis.streak_days > 0 ? (
                                <span className="hidden text-primary-text lg:inline">
                                    ¡No la rompas hoy!
                                </span>
                            ) : (
                                'Entrena hoy para empezar una racha'
                            )
                        }
                        aside={
                            kpis.streak_days > 0 && (
                                <div className="flex flex-col items-start gap-2 lg:hidden">
                                    <p className="text-[15px] font-bold">
                                        ¡No la rompas hoy!
                                    </p>
                                    <StreakWeek
                                        streak={kpis.streak_days}
                                        trainedToday={recentWorkouts.some(
                                            (workout) =>
                                                isSameDay(
                                                    new Date(
                                                        workout.started_at,
                                                    ),
                                                    now,
                                                ),
                                        )}
                                    />
                                </div>
                            )
                        }
                    />

                    <div className="col-span-2 flex flex-col gap-3 md:hidden">
                        <Link
                            href={trainHref}
                            className="flex min-h-[72px] items-center gap-3 rounded-xl bg-primary py-3 pr-3 pl-5 text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                        >
                            <span className="min-w-0 flex-1">
                                <span className="block font-num text-xl leading-tight uppercase">
                                    {startLabel}
                                </span>
                                <span className="block truncate text-[13px] font-bold">
                                    {startHint}
                                </span>
                            </span>
                            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-foreground text-primary">
                                <Play
                                    className="size-5 fill-current"
                                    aria-hidden
                                />
                            </span>
                        </Link>
                        <Button
                            asChild
                            variant="outline"
                            className="h-14 rounded-xl text-base font-bold"
                        >
                            <Link href={createActivity()}>
                                <Footprints aria-hidden />
                                Registrar carrera
                            </Link>
                        </Button>
                    </div>

                    <StatTile
                        label={
                            <>
                                <span className="md:hidden">
                                    Entrenos semana
                                </span>
                                <span className="hidden md:inline">
                                    Entrenamientos esta semana
                                </span>
                            </>
                        }
                        value={formatNumber(kpis.workouts_this_week)}
                        trend={trendFor(
                            kpis.workouts_this_week,
                            kpis.workouts_last_week,
                            formatNumber,
                            'semana',
                        )}
                    />
                    <StatTile
                        label={
                            <>
                                <span className="md:hidden">Km este mes</span>
                                <span className="hidden md:inline">
                                    Kilómetros este mes
                                </span>
                            </>
                        }
                        value={formatNumber(kpis.km_this_month)}
                        unit="km"
                        trend={trendFor(
                            kpis.km_this_month,
                            kpis.km_last_month,
                            (value) => `${formatNumber(value)} km`,
                            'mes',
                        )}
                        spark={
                            kmSpark?.some((value) => value > 0)
                                ? kmSpark
                                : undefined
                        }
                        sparkLabel="Kilómetros por semana, últimas 8 semanas"
                        sparkClassName="max-md:hidden lg:hidden"
                        className="lg:order-last"
                    />
                    <StatTile
                        className="col-span-2 lg:col-span-1"
                        label="Volumen esta semana"
                        value={kg(kpis.volume_this_week)}
                        unit="kg"
                        trend={trendFor(
                            kpis.volume_this_week,
                            kpis.volume_last_week,
                            (value) => `${kg(value)} kg`,
                            'semana',
                        )}
                        spark={
                            volumeSpark?.some((value) => value > 0)
                                ? volumeSpark
                                : undefined
                        }
                        sparkLabel="Volumen por semana, últimas 8 semanas"
                        sparkClassName="lg:hidden"
                    />
                </div>

                <MotivationalQuote quote={quote} quoteOffset={quoteOffset} />

                <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
                    <Panel
                        title="Volumen semanal por zona"
                        caption="Toneladas levantadas, últimas 8 semanas"
                    >
                        <Deferred
                            data="weeklyVolume"
                            fallback={<Skeleton className="h-64 w-full" />}
                        >
                            {weeklyVolume && hasWeeklyVolume(weeklyVolume) ? (
                                <WeeklyVolumeChart data={weeklyVolume} />
                            ) : (
                                <ChartEmpty>
                                    <Dumbbell className="size-6" aria-hidden />
                                    Aún no hay series con peso registradas.
                                    Completa un entrenamiento para ver tu
                                    volumen.
                                </ChartEmpty>
                            )}
                        </Deferred>
                    </Panel>

                    <Panel title="Series por músculo" caption="Últimos 30 días">
                        <Deferred
                            data="muscleDistribution"
                            fallback={<RowsSkeleton rows={8} height="h-6" />}
                        >
                            {muscleDistribution &&
                            muscleDistribution.length > 0 ? (
                                <MuscleBars data={muscleDistribution} />
                            ) : (
                                <ChartEmpty>
                                    <Dumbbell className="size-6" aria-hidden />
                                    Aquí verás qué músculos trabajas más.
                                </ChartEmpty>
                            )}
                        </Deferred>
                    </Panel>
                </div>

                <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
                    <Panel title="Últimos entrenamientos">
                        <RecentWorkouts
                            workouts={recentWorkouts}
                            trainHref={trainHref}
                        />
                    </Panel>

                    <Panel
                        title="Récords personales"
                        action={
                            <Link
                                href={statsIndex()}
                                className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-sm text-sm font-bold text-primary-text hover:underline"
                            >
                                Ver todo
                                <ArrowRight className="size-4" aria-hidden />
                            </Link>
                        }
                        className="gap-1"
                    >
                        <Deferred
                            data="personalRecords"
                            fallback={<RowsSkeleton rows={5} height="h-10" />}
                        >
                            {personalRecords && personalRecords.length > 0 ? (
                                <RecordList
                                    rows={strengthRecordRows(personalRecords, {
                                        withDetail: false,
                                    })}
                                />
                            ) : (
                                <ChartEmpty className="min-h-32">
                                    Tus récords aparecerán cuando registres
                                    series con peso.
                                </ChartEmpty>
                            )}
                        </Deferred>
                    </Panel>
                </div>
            </div>
        </>
    );
}

/**
 * Monday-to-Sunday strip with the streak days filled in. The streak ends today
 * when there is a workout today, otherwise yesterday (same rule as the backend).
 */
function StreakWeek({
    streak,
    trainedToday,
}: {
    streak: number;
    trainedToday: boolean;
}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const end = new Date(today);

    if (!trainedToday) {
        end.setDate(end.getDate() - 1);
    }

    const start = new Date(end);
    start.setDate(end.getDate() - streak + 1);
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const names = [
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
        'domingo',
    ];
    const days = labels.map((label, index) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + index);

        return {
            label,
            name: names[index],
            active: day >= start && day <= end,
            today: day.getTime() === today.getTime(),
        };
    });
    const active = days.filter((day) => day.active).map((day) => day.name);

    return (
        <div
            role="img"
            aria-label={
                active.length > 0
                    ? `Esta semana has entrenado: ${active.join(', ')}`
                    : 'Esta semana aún no has entrenado'
            }
            className="grid grid-cols-7 gap-1"
        >
            {days.map((day) => (
                <div
                    key={day.label}
                    className="flex flex-col items-center gap-1"
                >
                    <span
                        className={cn(
                            'h-6 w-6 rounded-[6px] sm:w-7',
                            day.active ? 'bg-primary' : 'bg-muted',
                            day.today &&
                                !day.active &&
                                'border-2 border-primary bg-transparent',
                        )}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground">
                        {day.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

function RecentWorkouts({
    workouts,
    trainHref,
}: {
    workouts: RecentWorkout[];
    trainHref: string;
}): ReactNode {
    if (workouts.length === 0) {
        return (
            <ChartEmpty className="min-h-32">
                Todavía no has registrado entrenamientos.
                <Button asChild variant="outline" className="h-11 font-bold">
                    <Link href={trainHref}>Empezar ahora</Link>
                </Button>
            </ChartEmpty>
        );
    }

    return (
        <>
            <ul className="divide-y md:hidden">
                {workouts.map((workout) => {
                    const date = new Date(workout.started_at);

                    return (
                        <li key={workout.id}>
                            <Link
                                href={showWorkout(workout.id)}
                                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                            >
                                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted leading-none">
                                    <span className="font-num text-lg">
                                        {date.getDate()}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {new Intl.DateTimeFormat('es-ES', {
                                            month: 'short',
                                        })
                                            .format(date)
                                            .replace('.', '')}
                                    </span>
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-bold">
                                        {workout.name}
                                    </span>
                                    <span className="block text-[13px] text-muted-foreground">
                                        {workout.sets}{' '}
                                        {workout.sets === 1
                                            ? 'serie'
                                            : 'series'}{' '}
                                        · {formatThousands(workout.volume_kg)}{' '}
                                        kg
                                    </span>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <table className="hidden w-full text-sm md:table">
                <thead>
                    <tr className="border-b text-left text-[13px] text-muted-foreground">
                        <th className="pb-2 font-medium">Fecha</th>
                        <th className="pb-2 font-medium">Rutina</th>
                        <th className="pb-2 text-right font-medium">Series</th>
                        <th className="pb-2 text-right font-medium">Volumen</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {workouts.map((workout) => (
                        <tr
                            key={workout.id}
                            className="transition-colors hover:bg-muted/40"
                        >
                            <td className="py-3.5 whitespace-nowrap">
                                {shortDay(workout.started_at)}
                            </td>
                            <td className="max-w-40 truncate py-3.5 font-bold">
                                <Link
                                    href={showWorkout(workout.id)}
                                    className="rounded-sm hover:underline"
                                >
                                    {workout.name}
                                </Link>
                            </td>
                            <td className="py-3.5 text-right font-num">
                                {workout.sets}
                            </td>
                            <td className="py-3.5 text-right font-num whitespace-nowrap">
                                {formatThousands(workout.volume_kg)} kg
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

function RowsSkeleton({ rows, height }: { rows: number; height: string }) {
    return (
        <div className="space-y-2.5">
            {Array.from({ length: rows }, (_, index) => (
                <Skeleton key={index} className={cn('w-full', height)} />
            ))}
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Inicio',
            href: dashboard(),
        },
    ],
};
