import { Link, router } from '@inertiajs/react';
import { toPng } from 'html-to-image';
import { Check, Link2, Pencil, Star, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { StatTile } from '@/components/gymrat/stat-tile';
import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import { StoryCard } from '@/components/share-dialog';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDate, formatKg, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import workouts from '@/routes/workouts';
import type { SessionRecord, WorkoutSession } from '@/types';
import type { Entry } from './workout-helpers';
import {
    bestSet,
    exerciseSummary,
    formatGrouped,
    formatRecordValue,
} from './workout-helpers';

/**
 * Summary shown once the workout is finished: stats, records, exercises and sharing.
 */
export function WorkoutFinished({
    session,
    entries,
    records,
    streakDays = null,
    onEdit,
}: {
    session: WorkoutSession;
    entries: Entry[];
    records: SessionRecord[];
    /** Consecutive training days, set once the workout is finished. */
    streakDays?: number | null;
    onEdit: () => void;
}) {
    const sets = session.sets ?? [];
    const workingSets = sets.filter((set) => !set.is_warmup);
    const performed = entries
        .map((entry) => {
            const own = sets.filter(
                (set) => set.exercise_id === entry.exercise.id,
            );

            return {
                exercise: entry.exercise,
                sets: own,
                best: bestSet(own, entry.exercise.tracking_type),
            };
        })
        .filter((item) => item.sets.length > 0);
    const volume = session.volume_kg ?? 0;
    const minutes = session.duration_minutes;

    const recordsLine =
        records.length === 0
            ? 'Sin récords esta vez. Cada serie suma para el próximo.'
            : `${records.length === 1 ? '1 récord nuevo' : `${records.length} récords nuevos`}. La rata está orgullosa.`;

    return (
        <div
            className={cn(
                'bg-background',
                'max-md:fixed max-md:inset-0 max-md:z-30 max-md:overflow-y-auto max-md:overscroll-contain',
            )}
        >
            <div className="mx-auto flex max-w-5xl flex-col gap-5 md:p-6 lg:p-8">
                {/* Hero */}
                <section className="relative overflow-hidden bg-primary text-primary-foreground max-md:pt-[env(safe-area-inset-top)] md:rounded-2xl">
                    <div className="relative z-10 flex flex-col gap-3 p-4 pb-8 sm:p-6 sm:pb-10">
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold first-letter:uppercase">
                                {formatDate(session.finished_at, {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                            <Button
                                asChild
                                size="icon"
                                className="size-11 shrink-0 rounded-md bg-black/10 text-primary-foreground shadow-none hover:bg-black/20"
                            >
                                <Link
                                    href={workouts.index()}
                                    aria-label="Cerrar resumen"
                                >
                                    <X className="size-5" />
                                </Link>
                            </Button>
                        </div>
                        <h1 className="max-w-[62%] font-num text-[44px] leading-[0.92] break-words uppercase sm:max-w-[70%] sm:text-6xl">
                            {session.name}, hecho
                        </h1>
                        <p className="max-w-[52%] text-[15px] leading-snug font-bold sm:max-w-[60%]">
                            {recordsLine}
                        </p>
                    </div>
                    <img
                        src={MASCOT_SRC}
                        alt=""
                        className="absolute right-0 bottom-3 w-[46%] max-w-64 -rotate-3 rounded-[24px] object-cover sm:right-6 sm:bottom-6 sm:h-[78%] sm:w-auto"
                    />
                    <div
                        className="absolute inset-x-0 bottom-0 z-10 h-3 bg-hazard"
                        aria-hidden
                    />
                </section>

                <div className="flex flex-col gap-5 px-4 md:px-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
                    <div className="flex flex-col gap-5">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <StatTile
                                label="Duración"
                                value={
                                    minutes !== null
                                        ? formatNumber(minutes)
                                        : '—'
                                }
                                unit={minutes !== null ? 'min' : undefined}
                            />
                            <StatTile
                                label="Volumen"
                                value={formatGrouped(Math.round(volume))}
                                unit="kg"
                                className={cn(
                                    Math.round(volume) >= 10_000 &&
                                        'max-sm:[&_.font-num]:text-[30px]',
                                )}
                            />
                            <StatTile
                                label="Series"
                                value={formatNumber(workingSets.length)}
                            />
                            {streakDays !== null ? (
                                <StatTile
                                    label="Racha"
                                    value={formatNumber(streakDays)}
                                    unit={streakDays === 1 ? 'día' : 'días'}
                                />
                            ) : (
                                <StatTile
                                    label="Ejercicios"
                                    value={formatNumber(performed.length)}
                                />
                            )}
                        </div>

                        {/* Records */}
                        {records.length > 0 && (
                            <section className="rounded-xl border-2 border-primary bg-card p-4">
                                <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                                    <Star
                                        className="size-5 fill-primary text-primary"
                                        aria-hidden
                                    />
                                    Récords de hoy
                                </h2>
                                <ul className="flex flex-col gap-3">
                                    {records.map((record) => (
                                        <li
                                            key={`${record.exercise_id}-${record.type}`}
                                            className="flex items-start justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="leading-tight font-bold">
                                                    {record.exercise}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {record.label}{' '}
                                                    {formatRecordValue(
                                                        record.type,
                                                        record.value,
                                                    )}
                                                    , antes{' '}
                                                    {formatRecordValue(
                                                        record.type,
                                                        record.previous,
                                                    )}
                                                </p>
                                            </div>
                                            <span className="shrink-0 font-num text-xl text-primary-text">
                                                {record.summary}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {session.notes && (
                            <section className="rounded-xl bg-card p-4">
                                <h2 className="mb-1 text-sm font-bold">
                                    Notas
                                </h2>
                                <p className="text-sm whitespace-pre-line text-muted-foreground">
                                    {session.notes}
                                </p>
                            </section>
                        )}
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Exercises */}
                        <section>
                            <div className="mb-1 flex items-center justify-between gap-3">
                                <h2 className="text-base font-bold">
                                    Ejercicios
                                </h2>
                                <Button
                                    variant="ghost"
                                    className="h-11 text-muted-foreground"
                                    onClick={onEdit}
                                >
                                    <Pencil /> Editar series
                                </Button>
                            </div>
                            {performed.length === 0 ? (
                                <p className="py-4 text-sm text-muted-foreground">
                                    No registraste ninguna serie.
                                </p>
                            ) : (
                                <ul className="divide-y border-b">
                                    {performed.map((item) => (
                                        <li
                                            key={item.exercise.id}
                                            className="flex items-center justify-between gap-3 py-3"
                                        >
                                            <span className="min-w-0 text-[15px]">
                                                {item.exercise.name}
                                            </span>
                                            <span className="shrink-0 font-num text-[15px]">
                                                {exerciseSummary(
                                                    item.sets,
                                                    item.exercise.tracking_type,
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <ShareBlock
                            session={session}
                            volume={volume}
                            setCount={workingSets.length}
                            exerciseCount={performed.length}
                            records={records}
                            streakDays={streakDays}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Inline share block: public link, social networks and the story image.
 */
function ShareBlock({
    session,
    volume,
    setCount,
    exerciseCount,
    records,
    streakDays,
}: {
    session: WorkoutSession;
    volume: number;
    setCount: number;
    exerciseCount: number;
    records: SessionRecord[];
    streakDays: number | null;
}) {
    const [copiedText, copy] = useClipboard();
    const [enabling, setEnabling] = useState(false);
    const [exporting, setExporting] = useState(false);
    const storyRef = useRef<HTMLDivElement>(null);
    const shareUrl = session.share_url;
    const record = records[0];
    const text = `He completado "${session.name}": ${setCount} series y ${formatKg(volume)} de volumen.`;

    const enable = () =>
        router.post(
            workouts.share.url(session.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setEnabling(true),
                onFinish: () => setEnabling(false),
            },
        );

    const copyLink = async () => {
        if (shareUrl && (await copy(shareUrl))) {
            toast.success('Enlace copiado');
        }
    };

    const downloadStory = async () => {
        if (!storyRef.current) {
            return;
        }

        setExporting(true);

        try {
            const dataUrl = await toPng(storyRef.current, {
                width: 1080,
                height: 1920,
                pixelRatio: 1,
                cacheBust: true,
            });
            const file = new File(
                [await (await fetch(dataUrl)).blob()],
                `entrenamiento-${session.id}.png`,
                { type: 'image/png' },
            );

            if (navigator.canShare?.({ files: [file] })) {
                await navigator
                    .share({ files: [file], title: session.name, text })
                    .catch(() => {});
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = file.name;
                link.click();
            }
        } catch {
            toast.error('No se pudo generar la imagen');
        } finally {
            setExporting(false);
        }
    };

    const encodedUrl = encodeURIComponent(shareUrl ?? '');
    const encodedText = encodeURIComponent(text);
    const networks = [
        {
            name: 'WhatsApp',
            href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
            className: 'bg-[#25d366] text-[#0b2e17]',
        },
        {
            name: 'X',
            href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            className: 'border border-input bg-black text-white',
        },
        {
            name: 'Facebook',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            className: 'bg-[#1877f2] text-white',
        },
        {
            name: 'Telegram',
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
            className: 'bg-[#229ed9] text-white',
        },
    ];

    return (
        <section className="-mx-4 flex flex-col gap-3 rounded-t-2xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:mx-0 md:rounded-2xl">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Compártelo</h2>
                {shareUrl && (
                    <Button
                        variant="outline"
                        className="h-11 font-bold"
                        onClick={copyLink}
                    >
                        {copiedText === shareUrl ? <Check /> : <Link2 />}
                        {copiedText === shareUrl
                            ? 'Enlace copiado'
                            : 'Copiar enlace'}
                    </Button>
                )}
            </div>

            {shareUrl ? (
                <div className="grid grid-cols-4 gap-2">
                    {networks.map((network) => (
                        <a
                            key={network.name}
                            href={network.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'grid h-12 place-items-center rounded-md px-1 text-[13px] font-extrabold transition-opacity hover:opacity-90 sm:text-sm',
                                network.className,
                            )}
                        >
                            {network.name}
                        </a>
                    ))}
                </div>
            ) : (
                <Button
                    variant="outline"
                    className="h-12 font-bold"
                    disabled={enabling}
                    onClick={enable}
                >
                    <Link2 />
                    {enabling
                        ? 'Creando enlace…'
                        : 'Crear enlace para compartir'}
                </Button>
            )}

            <Button size="workout" disabled={exporting} onClick={downloadStory}>
                {exporting ? 'Generando…' : 'Imagen para historias'}
            </Button>

            <div
                aria-hidden
                className="pointer-events-none fixed top-0 -left-[10000px]"
            >
                <div ref={storyRef} style={{ width: 1080, height: 1920 }}>
                    <StoryCard
                        badge="Entrenamiento terminado"
                        title={session.name}
                        date={formatDate(session.started_at)}
                        stats={[
                            {
                                label: 'Volumen',
                                value: formatGrouped(Math.round(volume)),
                                unit: 'kg',
                            },
                            {
                                label: 'Duración',
                                value:
                                    session.duration_minutes !== null
                                        ? formatNumber(session.duration_minutes)
                                        : '—',
                                unit:
                                    session.duration_minutes !== null
                                        ? 'min'
                                        : undefined,
                            },
                        ]}
                        highlight={
                            record
                                ? {
                                      label: 'Nuevo récord personal',
                                      title: `${record.exercise} ${record.summary}`,
                                      detail: `${record.label}: ${formatRecordValue(record.type, record.value)}, antes ${formatRecordValue(record.type, record.previous)}`,
                                  }
                                : undefined
                        }
                        tiles={[
                            { label: 'Series', value: formatNumber(setCount) },
                            {
                                label: 'Ejercicios',
                                value: formatNumber(exerciseCount),
                            },
                            ...(streakDays !== null
                                ? [
                                      {
                                          label: 'Racha',
                                          value: formatNumber(streakDays),
                                          unit: 'd',
                                      },
                                  ]
                                : []),
                        ]}
                    />
                </div>
            </div>
        </section>
    );
}
