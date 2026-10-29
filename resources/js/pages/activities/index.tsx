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
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatKm } from '@/lib/format';
import { cn } from '@/lib/utils';
import activitiesRoutes from '@/routes/activities';
import integrations from '@/routes/integrations';
import type { Activity, Paginated, RunningRecord } from '@/types';

const sourceBadgeClass: Record<Activity['source'], string> = {
    strava: 'border-orange-500/50 text-orange-600 dark:text-orange-400',
    shortcut: 'border-sky-500/50 text-sky-600 dark:text-sky-400',
    manual: 'text-muted-foreground',
};

export default function ActivitiesIndex({
    activities,
    personalRecords,
    hasStrava,
}: {
    activities: Paginated<Activity>;
    personalRecords: RunningRecord[];
    hasStrava: boolean;
}) {
    return (
        <>
            <Head title="Carreras" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Carreras"
                        description="Tus carreras, rodajes y competiciones Hyrox."
                    />
                    <Button size="lg" asChild>
                        <Link href={activitiesRoutes.create()}>
                            <Plus /> Registrar carrera
                        </Link>
                    </Button>
                </div>

                {!hasStrava && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Watch className="size-8 shrink-0 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="font-semibold">
                                    Sincroniza tu Apple Watch
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Conecta Strava o usa el atajo de iOS para
                                    importar tus carreras automáticamente.
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href={integrations.index()}>
                                    Configurar
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Trophy className="size-5 text-amber-500" /> Marcas
                        personales
                    </h2>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {personalRecords.map((record) => (
                            <RecordCard key={record.label} record={record} />
                        ))}
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Historial</h2>
                    {activities.data.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                                <Footprints className="size-10 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">
                                    Aún no has registrado ninguna carrera
                                </h3>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Añádela a mano o sincroniza tu reloj para
                                    seguir tu progreso.
                                </p>
                                <Button asChild>
                                    <Link href={activitiesRoutes.create()}>
                                        <Plus /> Registrar carrera
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {activities.data.map((activity) => (
                                <ActivityRow
                                    key={activity.id}
                                    activity={activity}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {activities.last_page > 1 && (
                    <div className="flex items-center justify-between gap-2">
                        <PageButton href={activities.prev_page_url}>
                            <ChevronLeft /> Anterior
                        </PageButton>
                        <span className="text-sm text-muted-foreground">
                            Página {activities.current_page} de{' '}
                            {activities.last_page}
                        </span>
                        <PageButton href={activities.next_page_url}>
                            Siguiente <ChevronRight />
                        </PageButton>
                    </div>
                )}
            </div>
        </>
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
        <Button variant="outline" asChild>
            <Link href={href} preserveScroll>
                {children}
            </Link>
        </Button>
    ) : (
        <Button variant="outline" disabled>
            {children}
        </Button>
    );
}

function RecordCard({ record }: { record: RunningRecord }) {
    const content = (
        <>
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {record.label}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
                {record.duration_label ?? '—'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
                {record.pace_label
                    ? `${record.pace_label} · ${formatDate(record.date)}`
                    : 'Sin marca todavía'}
            </div>
        </>
    );

    const className = cn(
        'block rounded-xl border bg-card p-4',
        record.activity_id && 'transition-colors hover:bg-accent/50',
    );

    return record.activity_id ? (
        <Link
            href={activitiesRoutes.show(record.activity_id)}
            className={className}
        >
            {content}
        </Link>
    ) : (
        <div className={className}>{content}</div>
    );
}

function ActivityRow({ activity }: { activity: Activity }) {
    return (
        <Link
            href={activitiesRoutes.show(activity.id)}
            className="block rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="truncate font-semibold">
                        {activity.name}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                        {formatDate(activity.started_at, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{activity.type_label}</Badge>
                    <Badge
                        variant="outline"
                        className={sourceBadgeClass[activity.source]}
                    >
                        {activity.source_label}
                    </Badge>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <Metric
                    label="Distancia"
                    value={formatKm(activity.distance_m)}
                />
                <Metric label="Tiempo" value={activity.duration_label} />
                <Metric label="Ritmo" value={activity.pace_label ?? '—'} />
            </div>
        </Link>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-semibold tabular-nums">{value}</div>
        </div>
    );
}

ActivitiesIndex.layout = {
    breadcrumbs: [{ title: 'Carreras', href: activitiesRoutes.index() }],
};
