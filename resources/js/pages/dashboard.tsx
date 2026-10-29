import { Deferred, Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Dumbbell,
    Flame,
    Footprints,
    Minus,
    Play,
    Plus,
    Trophy,
    Weight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MotivationalQuote from '@/components/motivational-quote';
import {
    ChartEmpty,
    hasRunning,
    hasWeeklyVolume,
    MuscleDistributionChart,
    PaceChart,
    PersonalRecordsTable,
    WeeklyKmChart,
    WeeklyVolumeChart,
} from '@/components/stats-charts';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatKg, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create as createActivity } from '@/routes/activities';
import { index as routinesIndex } from '@/routes/routines';
import { index as statsIndex } from '@/routes/stats';
import { show as showWorkout } from '@/routes/workouts';
import type {
    MuscleDistribution,
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
};

function greeting(): string {
    const hour = new Date().getHours();

    if (hour < 6) {
        return 'Buenas noches';
    }

    if (hour < 13) {
        return 'Buenos días';
    }

    if (hour < 20) {
        return 'Buenas tardes';
    }

    return 'Buenas noches';
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
}: DashboardProps) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];
    const isNewUser =
        routinesCount === 0 &&
        recentWorkouts.length === 0 &&
        kpis.km_this_month === 0 &&
        kpis.km_last_month === 0;

    return (
        <>
            <Head title="Inicio" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {greeting()}, {firstName}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Este es el resumen de tu entrenamiento.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link href={routinesIndex()}>
                                <Play />
                                Empezar entrenamiento
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={createActivity()}>
                                <Footprints />
                                Registrar carrera
                            </Link>
                        </Button>
                    </div>
                </div>

                <MotivationalQuote quote={quote} quoteOffset={quoteOffset} />

                {isNewUser && <WelcomeCard />}

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiTile
                        icon={Dumbbell}
                        label="Entrenamientos esta semana"
                        value={formatNumber(kpis.workouts_this_week)}
                        current={kpis.workouts_this_week}
                        previous={kpis.workouts_last_week}
                        previousLabel="la semana pasada"
                        formatPrevious={formatNumber}
                    />
                    <KpiTile
                        icon={Weight}
                        label="Volumen esta semana"
                        value={formatKg(Math.round(kpis.volume_this_week))}
                        current={kpis.volume_this_week}
                        previous={kpis.volume_last_week}
                        previousLabel="la semana pasada"
                        formatPrevious={(value) => formatKg(Math.round(value))}
                    />
                    <KpiTile
                        icon={Footprints}
                        label="Kilómetros este mes"
                        value={`${formatNumber(kpis.km_this_month)} km`}
                        current={kpis.km_this_month}
                        previous={kpis.km_last_month}
                        previousLabel="el mes pasado"
                        formatPrevious={(value) => `${formatNumber(value)} km`}
                    />
                    <KpiTile
                        icon={Flame}
                        label="Racha actual"
                        value={`${kpis.streak_days} ${kpis.streak_days === 1 ? 'día' : 'días'}`}
                        hint={
                            kpis.streak_days > 0
                                ? '¡No la rompas hoy!'
                                : 'Entrena hoy para empezar una racha'
                        }
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Volumen semanal por zona</CardTitle>
                            <CardDescription>
                                Kilos levantados (peso × reps) en las últimas 8
                                semanas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Deferred
                                data="weeklyVolume"
                                fallback={<ChartSkeleton />}
                            >
                                {weeklyVolume &&
                                hasWeeklyVolume(weeklyVolume) ? (
                                    <WeeklyVolumeChart data={weeklyVolume} />
                                ) : (
                                    <ChartEmpty>
                                        <Dumbbell className="size-6" />
                                        Aún no hay series con peso registradas.
                                        Completa un entrenamiento para ver tu
                                        volumen.
                                    </ChartEmpty>
                                )}
                            </Deferred>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Series por músculo</CardTitle>
                            <CardDescription>
                                Series efectivas de los últimos 30 días
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Deferred
                                data="muscleDistribution"
                                fallback={<ChartSkeleton />}
                            >
                                {muscleDistribution &&
                                muscleDistribution.length > 0 ? (
                                    <MuscleDistributionChart
                                        data={muscleDistribution}
                                        limit={8}
                                    />
                                ) : (
                                    <ChartEmpty>
                                        <Dumbbell className="size-6" />
                                        Aquí verás qué músculos trabajas más.
                                    </ChartEmpty>
                                )}
                            </Deferred>
                        </CardContent>
                    </Card>
                </div>

                <Deferred
                    data="weeklyRunning"
                    fallback={
                        <div className="grid gap-4 xl:grid-cols-2">
                            <Card>
                                <CardContent>
                                    <ChartSkeleton />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent>
                                    <ChartSkeleton />
                                </CardContent>
                            </Card>
                        </div>
                    }
                >
                    <RunningSection data={weeklyRunning ?? []} />
                </Deferred>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-2">
                            <div className="space-y-1.5">
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="size-4 text-yellow-500 dark:text-yellow-400" />
                                    Récords personales
                                </CardTitle>
                                <CardDescription>
                                    Tus mejores marcas más recientes
                                </CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href={statsIndex()}>
                                    Ver todo
                                    <ArrowRight />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Deferred
                                data="personalRecords"
                                fallback={<TableSkeleton />}
                            >
                                {personalRecords &&
                                personalRecords.length > 0 ? (
                                    <PersonalRecordsTable
                                        records={personalRecords}
                                    />
                                ) : (
                                    <ChartEmpty className="min-h-32">
                                        <Trophy className="size-6" />
                                        Tus récords aparecerán cuando registres
                                        series con peso.
                                    </ChartEmpty>
                                )}
                            </Deferred>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Últimos entrenamientos</CardTitle>
                            <CardDescription>
                                Tus sesiones más recientes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentWorkouts.length > 0 ? (
                                <ul className="divide-y">
                                    {recentWorkouts.map((workout) => (
                                        <li key={workout.id}>
                                            <Link
                                                href={showWorkout(workout.id)}
                                                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/60"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                                    <Dumbbell className="size-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium">
                                                        {workout.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDateTime(
                                                            workout.started_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm tabular-nums">
                                                    <p>
                                                        {workout.sets}{' '}
                                                        {workout.sets === 1
                                                            ? 'serie'
                                                            : 'series'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatKg(
                                                            workout.volume_kg,
                                                        )}
                                                    </p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <ChartEmpty className="min-h-32">
                                    <Dumbbell className="size-6" />
                                    Todavía no has registrado entrenamientos.
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={routinesIndex()}>
                                            {routinesCount > 0
                                                ? 'Elegir una rutina'
                                                : 'Crear mi primera rutina'}
                                        </Link>
                                    </Button>
                                </ChartEmpty>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function KpiTile({
    icon: Icon,
    label,
    value,
    current,
    previous,
    previousLabel,
    formatPrevious,
    hint,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    current?: number;
    previous?: number;
    previousLabel?: string;
    formatPrevious?: (value: number) => string;
    hint?: string;
}) {
    const hasTrend =
        current !== undefined && previous !== undefined && formatPrevious;
    const diff = hasTrend ? current - previous : 0;
    const TrendIcon =
        diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;

    return (
        <Card className="gap-2 py-4">
            <CardHeader className="px-4">
                <CardDescription className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {label}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 px-4">
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {value}
                </p>
                {hasTrend ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendIcon
                            className={cn(
                                'size-3.5',
                                diff > 0 &&
                                    'text-emerald-600 dark:text-emerald-400',
                                diff < 0 &&
                                    'text-orange-600 dark:text-orange-400',
                            )}
                            aria-hidden
                        />
                        <span>
                            {diff === 0
                                ? 'Igual que '
                                : diff > 0
                                  ? 'Más que '
                                  : 'Menos que '}
                            {previousLabel} ({formatPrevious(previous)})
                        </span>
                    </p>
                ) : (
                    hint && (
                        <p className="text-xs text-muted-foreground">{hint}</p>
                    )
                )}
            </CardContent>
        </Card>
    );
}

function RunningSection({ data }: { data: WeeklyRunning[] }) {
    if (!hasRunning(data)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Carreras</CardTitle>
                    <CardDescription>
                        Kilómetros y ritmo de las últimas 8 semanas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartEmpty className="min-h-32">
                        <Footprints className="size-6" />
                        Sin carreras registradas en las últimas semanas.
                        <Button asChild size="sm" variant="outline">
                            <Link href={createActivity()}>
                                <Plus />
                                Registrar carrera
                            </Link>
                        </Button>
                    </ChartEmpty>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Kilómetros por semana</CardTitle>
                    <CardDescription>Últimas 8 semanas</CardDescription>
                </CardHeader>
                <CardContent>
                    <WeeklyKmChart data={data} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Ritmo medio</CardTitle>
                    <CardDescription>
                        Minutos por kilómetro (más arriba, más rápido)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PaceChart data={data} />
                </CardContent>
            </Card>
        </div>
    );
}

function WelcomeCard() {
    return (
        <Card className="border-yellow-400/50 bg-yellow-400/5">
            <CardHeader>
                <CardTitle>¡Bienvenido a GymRat Tracker!</CardTitle>
                <CardDescription>
                    Empieza creando tu primera rutina: elige ejercicios del
                    catálogo y te sugeriremos peso y repeticiones en cada sesión
                    para que sigas progresando.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                    <Link href={routinesIndex()}>
                        <Plus />
                        Crear mi primera rutina
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={createActivity()}>
                        <Footprints />
                        Registrar una carrera
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function ChartSkeleton() {
    return <Skeleton className="h-64 w-full" />;
}

function TableSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
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
