import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, Pencil, Share2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    Metric,
    SourceBadge,
    TypeBadge,
    longDate,
    paceNumber,
} from '@/components/activities/activity-ui';
import {
    PaceChart,
    SegmentBars,
    hyroxBreakdown,
    paceInsight,
    pacePoints,
    stationInsight,
} from '@/components/activities/split-charts';
import { ShareDialog, StoryCard } from '@/components/share-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    formatDate,
    formatDuration,
    formatKm,
    formatNumber,
    formatPace,
} from '@/lib/format';
import activities from '@/routes/activities';
import type { Activity } from '@/types';

export default function ActivityShow({ activity }: { activity: Activity }) {
    const splits = activity.splits ?? [];
    const isHyrox = activity.type === 'hyrox';

    return (
        <>
            <Head title={activity.name} />
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 lg:p-6">
                <header className="flex flex-wrap items-start gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 size-11 lg:hidden"
                        asChild
                    >
                        <Link
                            href={activities.index()}
                            aria-label="Volver a carreras"
                        >
                            <ChevronLeft className="size-6" />
                        </Link>
                    </Button>
                    <div className="order-last flex w-full min-w-0 flex-col gap-1 lg:order-none lg:w-auto lg:flex-1">
                        <div className="flex flex-wrap gap-1.5">
                            <TypeBadge activity={activity} />
                            <SourceBadge activity={activity} />
                        </div>
                        <h1 className="font-num text-[32px] leading-none break-words uppercase lg:text-4xl">
                            {activity.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {longDate(activity.started_at, true)}
                        </p>
                    </div>
                    <Actions activity={activity} />
                </header>

                {isHyrox ? (
                    <HyroxSummary activity={activity} />
                ) : (
                    <RunSummary activity={activity} />
                )}

                {splits.length > 0 &&
                    (isHyrox || pacePoints(splits).length === 0 ? (
                        <section className="rounded-xl bg-card p-4 lg:p-5">
                            <SegmentBars splits={splits} hyrox={isHyrox} />
                            {isHyrox && stationInsight(splits) && (
                                <p className="mt-3 text-[13px] font-semibold text-primary-text">
                                    {stationInsight(splits)}
                                </p>
                            )}
                        </section>
                    ) : null)}
            </div>
        </>
    );
}

function Actions({ activity }: { activity: Activity }) {
    const iconButton = 'size-11 lg:w-auto lg:px-4';

    return (
        <div className="ml-auto flex gap-2">
            <ShareDialog
                shareUrl={activity.share_url}
                enableShare={activities.share(activity.id)}
                title={activity.name}
                text={`${activity.name}: ${formatKm(activity.distance_m)} en ${activity.duration_label} (${formatPace(activity.pace_seconds_per_km)})`}
                fileName={`carrera-${activity.id}`}
                trigger={
                    <Button variant="outline" className={iconButton}>
                        <Share2 aria-hidden />
                        <span className="sr-only lg:not-sr-only">
                            Compartir
                        </span>
                    </Button>
                }
                storyCard={
                    <StoryCard
                        badge={activity.type_label}
                        title={activity.name}
                        subtitle={formatDate(activity.started_at)}
                    >
                        {[
                            ['Distancia', formatKm(activity.distance_m)],
                            ['Tiempo', activity.duration_label],
                            ['Ritmo', formatPace(activity.pace_seconds_per_km)],
                            ...(activity.avg_hr
                                ? [['FC media', `${activity.avg_hr} ppm`]]
                                : []),
                        ].map(([label, value]) => (
                            <div key={label}>
                                <div
                                    style={{
                                        fontSize: 36,
                                        color: '#a1a1aa',
                                        textTransform: 'uppercase',
                                        letterSpacing: 4,
                                    }}
                                >
                                    {label}
                                </div>
                                <div
                                    style={{
                                        fontSize: 120,
                                        fontWeight: 900,
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {value}
                                </div>
                            </div>
                        ))}
                    </StoryCard>
                }
            />
            <Button variant="outline" className={iconButton} asChild>
                <Link href={activities.edit(activity.id)}>
                    <Pencil aria-hidden />
                    <span className="sr-only lg:not-sr-only">Editar</span>
                </Link>
            </Button>
            <DeleteActivityButton activity={activity} className={iconButton} />
        </div>
    );
}

function HazardCard({ children }: { children: ReactNode }) {
    return (
        <section className="overflow-hidden rounded-xl bg-card">
            <div className="h-[5px] bg-hazard" aria-hidden />
            <div className="flex flex-col gap-4 p-4 lg:p-5">{children}</div>
        </section>
    );
}

function HyroxSummary({ activity }: { activity: Activity }) {
    const splits = activity.splits ?? [];
    const breakdown = hyroxBreakdown(splits, activity.duration_seconds);

    return (
        <HazardCard>
            <div>
                <div className="text-[13px] text-muted-foreground">
                    Tiempo total
                </div>
                <div className="font-num text-6xl leading-none tabular-nums lg:text-7xl">
                    {activity.duration_label}
                </div>
            </div>
            {splits.length > 0 && (
                <dl className="grid grid-cols-3 gap-3">
                    <BreakdownItem
                        label="Carrera"
                        value={formatDuration(breakdown.runSeconds)}
                        className="text-chart-4"
                    />
                    <BreakdownItem
                        label="Estaciones"
                        value={formatDuration(breakdown.stationSeconds)}
                        className="text-chart-5"
                    />
                    {breakdown.transitionSeconds > 0 && (
                        <BreakdownItem
                            label="Transiciones"
                            value={formatDuration(breakdown.transitionSeconds)}
                        />
                    )}
                </dl>
            )}
            <OptionalStats activity={activity} />
        </HazardCard>
    );
}

function BreakdownItem({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div>
            <dt className="text-[13px] text-muted-foreground">{label}</dt>
            <dd className={`font-num text-xl tabular-nums ${className ?? ''}`}>
                {value}
            </dd>
        </div>
    );
}

/**
 * Secondary stats shown under the Hyrox total when present.
 */
function OptionalStats({ activity }: { activity: Activity }) {
    const items = [
        ['Distancia', formatKm(activity.distance_m)],
        activity.avg_hr !== null
            ? [
                  'Pulso medio / máx.',
                  `${activity.avg_hr}${activity.max_hr ? ` / ${activity.max_hr}` : ''}`,
              ]
            : null,
        activity.calories !== null
            ? ['Calorías', `${formatNumber(activity.calories)} kcal`]
            : null,
    ].filter((item): item is string[] => item !== null);

    return (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm">
            {items.map(([label, value]) => (
                <div key={label} className="flex gap-1.5">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

function RunSummary({ activity }: { activity: Activity }) {
    const splits = activity.splits ?? [];
    const insight = paceInsight(splits);
    const tiles = [
        { label: 'Distancia', value: formatKm(activity.distance_m) },
        { label: 'Ritmo', value: paceNumber(activity.pace_seconds_per_km) },
        activity.elevation_gain_m !== null
            ? {
                  label: 'Desnivel',
                  value: `${formatNumber(activity.elevation_gain_m)} m`,
              }
            : null,
        activity.avg_hr !== null || activity.max_hr !== null
            ? {
                  label: 'Pulso medio / máx.',
                  value: `${activity.avg_hr ?? '—'} / ${activity.max_hr ?? '—'}`,
              }
            : null,
    ].filter((tile): tile is { label: string; value: string } => tile !== null);

    return (
        <HazardCard>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 lg:grid-cols-5">
                <Metric
                    label="Tiempo"
                    value={activity.duration_label}
                    highlight
                    size="lg"
                />
                {tiles.map((tile) => (
                    <div
                        key={tile.label}
                        className={
                            tile.label.startsWith('Pulso')
                                ? 'col-span-2 lg:col-span-1'
                                : undefined
                        }
                    >
                        <Metric
                            label={tile.label}
                            value={tile.value}
                            size="lg"
                        />
                    </div>
                ))}
            </div>
            {activity.calories !== null && (
                <p className="-mt-2 text-sm text-muted-foreground">
                    {formatNumber(activity.calories)} kcal
                </p>
            )}
            {pacePoints(splits).length > 0 && (
                <>
                    <PaceChart splits={splits} />
                    {insight && (
                        <p className="text-[13px] font-semibold text-primary-text">
                            {insight}
                        </p>
                    )}
                </>
            )}
        </HazardCard>
    );
}

function DeleteActivityButton({
    activity,
    className,
}: {
    activity: Activity;
    className?: string;
}) {
    const [processing, setProcessing] = useState(false);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={`text-destructive hover:text-destructive ${className ?? ''}`}
                >
                    <Trash2 aria-hidden />
                    <span className="sr-only lg:not-sr-only">Eliminar</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Eliminar esta carrera?</DialogTitle>
                    <DialogDescription>
                        Se borrarán también sus parciales. Esta acción no se
                        puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={processing}
                        onClick={() =>
                            router.delete(activities.destroy.url(activity.id), {
                                onStart: () => setProcessing(true),
                                onFinish: () => setProcessing(false),
                            })
                        }
                    >
                        <Trash2 /> Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

ActivityShow.layout = ({ activity }: { activity: Activity }) => ({
    breadcrumbs: [
        { title: 'Carreras', href: activities.index() },
        { title: activity.name, href: activities.show(activity.id) },
    ],
});
