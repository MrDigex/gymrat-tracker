import { Head } from '@inertiajs/react';
import {
    PublicShareLayout,
    PublicStat,
} from '@/components/public-share-layout';
import { formatDate, formatKm, formatNumber, formatPace } from '@/lib/format';
import type { Activity } from '@/types';

export default function ShareActivity({
    activity,
    author,
    shareUrl,
}: {
    activity: Activity;
    author: string;
    shareUrl: string;
}) {
    const splits = activity.splits ?? [];
    const isHyrox = activity.type === 'hyrox';
    const metric = (split: (typeof splits)[number]) =>
        isHyrox ? split.duration_seconds : (split.pace_seconds_per_km ?? 0);
    const max = Math.max(1, ...splits.map(metric));
    const fastest = splits.length
        ? Math.min(...splits.map(metric).filter((value) => value > 0))
        : null;
    const date = formatDate(activity.started_at, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const extras = [
        activity.elevation_gain_m !== null && {
            label: 'Desnivel',
            value: `${formatNumber(activity.elevation_gain_m)} m`,
        },
        activity.avg_hr !== null && {
            label: 'FC media',
            value: `${activity.avg_hr} ppm`,
        },
        activity.max_hr !== null && {
            label: 'FC máxima',
            value: `${activity.max_hr} ppm`,
        },
        activity.calories !== null && {
            label: 'Calorías',
            value: `${formatNumber(activity.calories)} kcal`,
        },
    ].filter((item): item is { label: string; value: string } => Boolean(item));

    return (
        <>
            <Head title={activity.name} />
            <PublicShareLayout
                badge={activity.type_label}
                title={activity.name}
                subtitle={<p className="capitalize">{date}</p>}
                author={author}
                shareUrl={shareUrl}
                shareText={`${activity.name}: ${formatKm(activity.distance_m)} en ${activity.duration_label}`}
            >
                <div className="grid grid-cols-3 gap-3">
                    <PublicStat
                        label="Distancia"
                        value={formatKm(activity.distance_m)}
                        className="sm:[&>div:last-child]:text-4xl"
                    />
                    <PublicStat
                        label="Tiempo"
                        value={activity.duration_label}
                        className="sm:[&>div:last-child]:text-4xl"
                    />
                    <PublicStat
                        label="Ritmo"
                        value={formatPace(activity.pace_seconds_per_km)}
                        className="sm:[&>div:last-child]:text-4xl"
                    />
                </div>

                {extras.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {extras.map((item) => (
                            <PublicStat
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                className="[&>div:last-child]:text-lg"
                            />
                        ))}
                    </div>
                )}

                {splits.length > 0 && (
                    <section className="rounded-xl border bg-card p-4">
                        <h2 className="mb-1 font-semibold">
                            {isHyrox ? 'Tiempo por tramo' : 'Parciales'}
                        </h2>
                        <p className="mb-4 text-xs text-muted-foreground">
                            {isHyrox
                                ? 'Carreras y estaciones'
                                : 'Barra más corta = parcial más rápido'}
                        </p>
                        <ul className="space-y-2">
                            {splits.map((split) => {
                                const value = metric(split);

                                return (
                                    <li
                                        key={split.id}
                                        className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm"
                                    >
                                        <span className="truncate">
                                            {split.label}
                                        </span>
                                        <span className="h-3 overflow-hidden rounded-full bg-muted">
                                            <span
                                                className={
                                                    value === fastest
                                                        ? 'block h-full rounded-full bg-yellow-400'
                                                        : 'block h-full rounded-full bg-[var(--chart-1)]'
                                                }
                                                style={{
                                                    width: `${(value / max) * 100}%`,
                                                }}
                                            />
                                        </span>
                                        <span className="text-right font-medium tabular-nums">
                                            {isHyrox
                                                ? split.duration_label
                                                : formatPace(
                                                      split.pace_seconds_per_km,
                                                  )}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}
            </PublicShareLayout>
        </>
    );
}
