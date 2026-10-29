import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { PublicShareLayout } from '@/components/public-share-layout';
import { formatDate, formatDuration, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Activity, RunningRecord } from '@/types';

const RUNNING_TYPES = ['carrera', 'trail', 'cinta'];

export default function ShareActivity({
    activity,
    record,
    author,
}: {
    activity: Activity;
    record: RunningRecord | null;
    author: string;
}) {
    const splits = activity.splits ?? [];
    const isHyrox = activity.type === 'hyrox';
    const metric = (split: (typeof splits)[number]) =>
        isHyrox ? split.duration_seconds : (split.pace_seconds_per_km ?? 0);
    const values = splits.map(metric).filter((value) => value > 0);
    const max = Math.max(1, ...values);
    const fastest = values.length ? Math.min(...values) : null;
    const fastestSplit = splits.find((split) => metric(split) === fastest);
    const splitValue = (split: (typeof splits)[number]) =>
        isHyrox
            ? split.duration_label
            : formatDuration(split.pace_seconds_per_km);
    const verb = RUNNING_TYPES.includes(activity.type) ? 'corrió' : 'entrenó';
    const weekday = formatDate(activity.started_at, { weekday: 'long' });
    const date = formatDate(activity.started_at);
    const km = formatNumber(Math.round(activity.distance_m / 10) / 100);

    return (
        <>
            <Head title={activity.name} />
            <PublicShareLayout pitch="Importa tus carreras del Apple Watch o Strava.">
                <p className="text-[15px] text-foreground/85">
                    {author} {verb} el {weekday} {date}
                </p>
                <h1 className="sr-only">{activity.name}</h1>
                <div className="mt-1 flex flex-wrap items-end justify-between gap-x-3">
                    <p className="font-num leading-none">
                        <span className="text-[104px] tracking-tight">
                            {km}
                        </span>
                        <span className="ml-2 text-[34px]">km</span>
                    </p>
                    {record ? (
                        <span className="mb-3 rounded-full bg-primary px-3 py-1 text-[13px] font-bold text-primary-foreground">
                            ★ Récord personal · {record.label}
                        </span>
                    ) : (
                        <span className="mb-3 rounded-full bg-muted px-3 py-1 text-[13px] font-bold">
                            {activity.name}
                        </span>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <Tile label="Tiempo">
                        <span className="text-primary-text">
                            {activity.duration_label}
                        </span>
                    </Tile>
                    {activity.pace_seconds_per_km ? (
                        <Tile label="Ritmo medio" unit="/km">
                            {formatDuration(activity.pace_seconds_per_km)}
                        </Tile>
                    ) : null}
                    {activity.elevation_gain_m !== null && (
                        <Tile label="Desnivel" unit="m" small>
                            {formatNumber(activity.elevation_gain_m)}
                        </Tile>
                    )}
                    {activity.avg_hr !== null && (
                        <Tile label="Pulso medio" unit="ppm" small>
                            {activity.avg_hr}
                        </Tile>
                    )}
                    {activity.calories !== null && (
                        <Tile label="Calorías" unit="kcal" small>
                            {formatNumber(activity.calories)}
                        </Tile>
                    )}
                </div>

                {splits.length > 0 && (
                    <section className="mt-3 rounded-[20px] bg-card p-4">
                        <div className="mb-3 flex items-baseline justify-between gap-3">
                            <h2 className="text-[17px] font-bold">
                                {isHyrox ? 'Tiempo por tramo' : 'Parciales'}
                            </h2>
                            <span className="text-[13px] text-muted-foreground">
                                barra corta = más rápido
                            </span>
                        </div>
                        <ul className="grid gap-2.5">
                            {splits.map((split) => {
                                const value = metric(split);
                                const isFastest =
                                    value > 0 && value === fastest;

                                return (
                                    <li
                                        key={split.id}
                                        className="grid grid-cols-[minmax(3rem,7rem)_1fr_3.25rem] items-center gap-3 text-[13px]"
                                    >
                                        <span className="truncate text-muted-foreground">
                                            {split.label}
                                        </span>
                                        <span
                                            aria-hidden
                                            className="h-3 overflow-hidden rounded-full"
                                        >
                                            <span
                                                className={cn(
                                                    'block h-full rounded-full',
                                                    isFastest
                                                        ? 'bg-primary'
                                                        : 'bg-chart-4',
                                                )}
                                                style={{
                                                    width: `${Math.max(4, (value / max) * 100)}%`,
                                                }}
                                            />
                                        </span>
                                        <span
                                            className={cn(
                                                'text-right font-num text-[15px]',
                                                isFastest &&
                                                    'text-primary-text',
                                            )}
                                        >
                                            {splitValue(split)}
                                            {isFastest && (
                                                <span className="sr-only">
                                                    {' '}
                                                    (el más rápido)
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                        {fastestSplit && (
                            <p className="mt-3 text-[13px] font-bold text-primary-text">
                                El más rápido: {fastestSplit.label},{' '}
                                {splitValue(fastestSplit)} (resaltado en
                                amarillo).
                            </p>
                        )}
                    </section>
                )}
            </PublicShareLayout>
        </>
    );
}

function Tile({
    label,
    unit,
    small = false,
    children,
}: {
    label: string;
    unit?: string;
    small?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="rounded-[16px] bg-card px-4 py-3.5">
            <div className="text-[13px] text-muted-foreground">{label}</div>
            <div
                className={cn(
                    'mt-1 font-num leading-none',
                    small ? 'text-[26px]' : 'text-[34px]',
                )}
            >
                {children}
                {unit && (
                    <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}
