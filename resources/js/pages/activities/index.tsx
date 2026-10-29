import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Footprints,
    Plus,
    Trophy,
    Watch,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Metric,
    SourceBadge,
    TypeBadge,
    dayMonth,
    kmLabel,
    longDate,
    paceNumber,
    shortDay,
} from '@/components/activities/activity-ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import activitiesRoutes from '@/routes/activities';
import integrations from '@/routes/integrations';
import type { Activity, Paginated, RunningRecord } from '@/types';

export default function ActivitiesIndex({
    activities,
    personalRecords,
    hasStrava,
}: {
    activities: Paginated<Activity>;
    personalRecords: RunningRecord[];
    hasStrava: boolean;
}) {
    const featured =
        activities.current_page === 1 ? (activities.data[0] ?? null) : null;

    return (
        <>
            <Head title="Carreras" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 lg:gap-5 lg:p-6">
                <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="font-num text-[34px] leading-none uppercase lg:text-5xl">
                            Carreras
                        </h1>
                        <p className="mt-1 hidden text-muted-foreground lg:block">
                            Tus carreras, rodajes y competiciones Hyrox.
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        {!hasStrava && (
                            <Button
                                variant="outline"
                                className="hidden h-12 rounded-xl px-4 font-bold lg:inline-flex"
                                asChild
                            >
                                <Link href={integrations.index()}>
                                    Sincronizar Apple Watch
                                </Link>
                            </Button>
                        )}
                        <Button
                            className="h-12 rounded-xl px-4 text-base font-bold"
                            asChild
                        >
                            <Link href={activitiesRoutes.create()}>
                                <Plus className="size-5" />
                                <span>
                                    Registrar
                                    <span className="sr-only lg:not-sr-only">
                                        {' carrera'}
                                    </span>
                                </span>
                            </Link>
                        </Button>
                    </div>
                </header>

                <section className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 font-bold lg:sr-only">
                        <Trophy
                            className="size-5 text-primary-text"
                            aria-hidden
                        />
                        Marcas personales
                    </h2>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {personalRecords.map((record) => (
                            <RecordCard
                                key={record.label}
                                record={record}
                                highlighted={
                                    featured !== null &&
                                    record.activity_id === featured.id
                                }
                            />
                        ))}
                    </div>
                </section>

                {!hasStrava && (
                    <Link
                        href={integrations.index()}
                        className="flex min-h-16 items-center gap-3 rounded-xl bg-card p-4 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none lg:hidden"
                    >
                        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary">
                            <Watch className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-bold">
                                Sincroniza tu Apple Watch
                            </span>
                            <span className="block text-sm text-muted-foreground">
                                Con Strava o el atajo de iOS, sin escribir nada.
                            </span>
                        </span>
                        <ChevronRight
                            className="size-5 text-muted-foreground"
                            aria-hidden
                        />
                    </Link>
                )}

                {activities.data.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start">
                        {featured && (
                            <div className="lg:sticky lg:top-4 lg:order-last">
                                <FeaturedRace activity={featured} />
                            </div>
                        )}
                        <section className="flex flex-col gap-2">
                            <h2 className="sr-only">Historial</h2>
                            {activities.data.map((activity) => (
                                <ActivityRow
                                    key={activity.id}
                                    activity={activity}
                                    featured={activity.id === featured?.id}
                                />
                            ))}
                            {activities.last_page > 1 && (
                                <nav
                                    className="mt-2 flex items-center justify-between gap-2"
                                    aria-label="Paginación"
                                >
                                    <PageButton href={activities.prev_page_url}>
                                        <ChevronLeft /> Anterior
                                    </PageButton>
                                    <span className="text-sm text-muted-foreground">
                                        {activities.current_page} de{' '}
                                        {activities.last_page}
                                    </span>
                                    <PageButton href={activities.next_page_url}>
                                        Siguiente <ChevronRight />
                                    </PageButton>
                                </nav>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-4 py-12 text-center">
            <Footprints className="size-10 text-muted-foreground" aria-hidden />
            <h2 className="font-num text-xl uppercase">Aún no hay carreras</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
                Añádela a mano o sincroniza tu reloj para seguir tu progreso.
            </p>
            <Button className="h-12 rounded-xl px-5 font-bold" asChild>
                <Link href={activitiesRoutes.create()}>
                    <Plus /> Registrar carrera
                </Link>
            </Button>
        </div>
    );
}

function PageButton({
    href,
    children,
}: {
    href: string | null;
    children: ReactNode;
}) {
    return href ? (
        <Button variant="outline" className="h-11" asChild>
            <Link href={href} preserveScroll>
                {children}
            </Link>
        </Button>
    ) : (
        <Button variant="outline" className="h-11" disabled>
            {children}
        </Button>
    );
}

function RecordCard({
    record,
    highlighted,
}: {
    record: RunningRecord;
    highlighted: boolean;
}) {
    if (!record.activity_id || !record.duration_label) {
        return (
            <div className="rounded-xl border border-dashed border-border p-4">
                <div className="text-[13px] font-bold text-muted-foreground">
                    {record.label}
                </div>
                <div className="mt-1 font-num text-2xl leading-tight text-muted-foreground/70">
                    Sin marca
                </div>
            </div>
        );
    }

    return (
        <Link
            href={activitiesRoutes.show(record.activity_id)}
            className={cn(
                'block rounded-xl p-4 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                highlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-card hover:bg-accent',
            )}
        >
            <div className="text-[13px] font-bold">{record.label}</div>
            <div className="mt-0.5 font-num text-[32px] leading-none tabular-nums lg:text-[34px]">
                {record.duration_label}
            </div>
            <div
                className={cn(
                    'mt-1.5 text-xs',
                    highlighted ? 'font-semibold' : 'text-muted-foreground',
                )}
            >
                {record.pace_label}
                {record.date && `, ${dayMonth(record.date)}`}
            </div>
        </Link>
    );
}

function rowSubtitle(activity: Activity): string {
    return [
        shortDay(activity.started_at),
        kmLabel(activity.distance_m),
        activity.type !== 'hyrox' ? activity.pace_label : null,
    ]
        .filter(Boolean)
        .join(', ');
}

function ActivityRow({
    activity,
    featured,
}: {
    activity: Activity;
    featured: boolean;
}) {
    return (
        <Link
            href={activitiesRoutes.show(activity.id)}
            className={cn(
                'flex min-h-16 items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                featured
                    ? 'border-primary max-lg:hidden'
                    : 'border-transparent lg:border-border',
            )}
        >
            <div className="min-w-0">
                <div className="truncate font-bold">{activity.name}</div>
                <div className="truncate text-sm text-muted-foreground">
                    {rowSubtitle(activity)}
                </div>
            </div>
            <div className="flex shrink-0 flex-col-reverse items-end gap-1 lg:flex-col">
                <span className="font-num text-xl leading-none tabular-nums">
                    {activity.duration_label}
                </span>
                <SourceBadge activity={activity} className="h-5 text-[11px]" />
            </div>
        </Link>
    );
}

/**
 * Latest race, with its main stats. The list has no splits; the per-km
 * chart lives in the race detail.
 */
function FeaturedRace({ activity }: { activity: Activity }) {
    const isHyrox = activity.type === 'hyrox';

    return (
        <article className="overflow-hidden rounded-xl bg-card">
            <div className="hidden h-[5px] bg-hazard lg:block" aria-hidden />
            <div className="flex flex-col gap-4 p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold lg:font-num lg:text-3xl lg:uppercase">
                            {activity.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {longDate(activity.started_at)}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        <TypeBadge activity={activity} />
                        <SourceBadge activity={activity} />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-4">
                    <Metric
                        label="Tiempo"
                        value={activity.duration_label}
                        size="lg"
                    />
                    {isHyrox ? (
                        <Metric
                            label="Distancia"
                            value={kmLabel(activity.distance_m)}
                            size="lg"
                        />
                    ) : (
                        <Metric
                            label="Ritmo"
                            value={paceNumber(activity.pace_seconds_per_km)}
                            size="lg"
                        />
                    )}
                    <Metric
                        label="Pulso medio"
                        value={activity.avg_hr ?? '—'}
                        size="lg"
                    />
                    <div className="hidden lg:block">
                        <Metric
                            label="Desnivel"
                            value={
                                activity.elevation_gain_m !== null
                                    ? `${activity.elevation_gain_m} m`
                                    : '—'
                            }
                            size="lg"
                        />
                    </div>
                </div>
                <Button
                    variant="secondary"
                    className="h-11 w-full rounded-xl font-bold"
                    asChild
                >
                    <Link href={activitiesRoutes.show(activity.id)}>
                        {isHyrox
                            ? 'Ver tiempo por tramo'
                            : 'Ver parciales por km'}
                        <ChevronRight />
                    </Link>
                </Button>
            </div>
        </article>
    );
}

ActivitiesIndex.layout = {
    breadcrumbs: [{ title: 'Carreras', href: activitiesRoutes.index() }],
};
