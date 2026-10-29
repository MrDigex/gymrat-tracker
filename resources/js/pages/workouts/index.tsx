import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight, Dumbbell, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { NewWorkoutPanel } from '@/components/workout/new-workout-panel';
import { useNow } from '@/components/workout/use-workout-hooks';
import { formatGrouped } from '@/components/workout/workout-helpers';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import workouts from '@/routes/workouts';
import type { Paginated, Routine, WorkoutSession } from '@/types';

export default function WorkoutsIndex({
    sessions,
    routines,
    suggestedRoutineId = null,
}: {
    sessions: Paginated<WorkoutSession>;
    routines: Routine[];
    suggestedRoutineId?: number | null;
}) {
    const { url } = usePage();
    // "Entrenar" links here with ?nuevo=1 when no workout is in progress.
    const [open, setOpen] = useState(() =>
        new URLSearchParams(url.split('?')[1] ?? '').has('nuevo'),
    );
    const now = useNow(
        sessions.data.some((session) => !session.finished_at),
        30_000,
    );
    const routineExercises = new Map(
        routines.map((routine) => [routine.id, routine.exercises_count ?? 0]),
    );

    const changeOpen = (value: boolean) => {
        setOpen(value);

        if (!value && window.location.search.includes('nuevo')) {
            const clean = new URL(window.location.href);

            clean.searchParams.delete('nuevo');
            window.history.replaceState(window.history.state, '', clean);
        }
    };

    const months = groupByMonth(sessions.data);
    const rowData = (session: WorkoutSession) => {
        const inProgress = !session.finished_at;
        const minutes = inProgress
            ? Math.max(
                  0,
                  Math.floor(
                      (now - new Date(session.started_at).getTime()) / 60_000,
                  ),
              )
            : session.duration_minutes;
        const planned = session.routine_id
            ? routineExercises.get(session.routine_id)
            : undefined;
        const exercises = session.exercises_count ?? 0;

        return {
            inProgress,
            date: formatDate(session.started_at, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            }).replace(',', ''),
            duration: minutes !== null ? `${minutes} min` : '—',
            series: `${session.sets_count ?? 0} · ${
                inProgress && planned
                    ? `${exercises} de ${planned} ej.`
                    : `${exercises} ej.`
            }`,
            volume: `${formatGrouped(session.volume_kg ?? 0)} kg`,
        };
    };

    return (
        <>
            <Head title="Entrenamientos" />
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-num text-[32px] leading-tight uppercase sm:text-4xl md:text-5xl">
                            Entrenamientos
                        </h1>
                        <p className="text-muted-foreground">
                            Tu historial de sesiones en el gimnasio.
                        </p>
                    </div>
                    <NewWorkoutPanel
                        routines={routines}
                        suggestedRoutineId={suggestedRoutineId}
                        open={open}
                        onOpenChange={changeOpen}
                        trigger={
                            <Button className="h-12 rounded-lg px-5 text-[15px] font-extrabold max-sm:w-full">
                                <Plus /> Nuevo entrenamiento
                            </Button>
                        }
                    />
                </div>

                {sessions.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-12 text-center">
                        <Dumbbell
                            className="size-10 text-muted-foreground"
                            aria-hidden
                        />
                        <h2 className="font-num text-xl uppercase">
                            Aún no hay entrenamientos
                        </h2>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Empieza una sesión a partir de una de tus rutinas o
                            haz un entrenamiento libre.
                        </p>
                        <Button
                            className="h-12 px-5 font-extrabold"
                            onClick={() => changeOpen(true)}
                        >
                            <Plus /> Nuevo entrenamiento
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden rounded-xl bg-card px-4 pb-2 md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-[13px] text-muted-foreground">
                                        <th className="py-3 pr-4 font-medium">
                                            Fecha
                                        </th>
                                        <th className="py-3 pr-4 font-medium">
                                            Sesión
                                        </th>
                                        <th className="py-3 pr-4 font-medium">
                                            Duración
                                        </th>
                                        <th className="py-3 pr-4 font-medium">
                                            Series · ejercicios
                                        </th>
                                        <th className="py-3 pr-4 text-right font-medium">
                                            Volumen
                                        </th>
                                        <th className="py-3 text-right font-medium">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                {months.map(([month, list]) => (
                                    <tbody key={month}>
                                        <tr>
                                            <th
                                                colSpan={6}
                                                scope="colgroup"
                                                className="pt-4 pb-1 text-left text-[13px] font-extrabold text-primary-text first-letter:uppercase"
                                            >
                                                {month}
                                            </th>
                                        </tr>
                                        {list.map((session) => {
                                            const row = rowData(session);

                                            return (
                                                <tr
                                                    key={session.id}
                                                    className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50"
                                                    onClick={() =>
                                                        router.visit(
                                                            workouts.show(
                                                                session.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <td className="py-3.5 pr-4 text-muted-foreground first-letter:uppercase">
                                                        {row.date}
                                                    </td>
                                                    <td className="py-3.5 pr-4">
                                                        <Link
                                                            href={workouts.show(
                                                                session.id,
                                                            )}
                                                            className="text-[15px] font-extrabold hover:underline"
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                        >
                                                            {session.name}
                                                        </Link>
                                                    </td>
                                                    <td
                                                        className="py-3.5 pr-4 font-num"
                                                        suppressHydrationWarning
                                                    >
                                                        {row.duration}
                                                    </td>
                                                    <td className="py-3.5 pr-4 text-muted-foreground">
                                                        {row.series}
                                                    </td>
                                                    <td className="py-3.5 pr-4 text-right font-num">
                                                        {row.volume}
                                                    </td>
                                                    <td className="py-3.5 text-right">
                                                        <StatusBadge
                                                            inProgress={
                                                                row.inProgress
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                ))}
                            </table>
                        </div>

                        {/* Phone cards */}
                        <div className="flex flex-col gap-5 md:hidden">
                            {months.map(([month, list]) => (
                                <section
                                    key={month}
                                    className="flex flex-col gap-2"
                                >
                                    <h2 className="text-[13px] font-extrabold text-primary-text first-letter:uppercase">
                                        {month}
                                    </h2>
                                    {list.map((session) => {
                                        const row = rowData(session);

                                        return (
                                            <Link
                                                key={session.id}
                                                href={workouts.show(session.id)}
                                                className={cn(
                                                    'flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors active:bg-muted',
                                                    row.inProgress &&
                                                        'border-primary',
                                                )}
                                            >
                                                <span className="flex items-start justify-between gap-3">
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-base font-extrabold">
                                                            {session.name}
                                                        </span>
                                                        <span className="block text-[13px] text-muted-foreground first-letter:uppercase">
                                                            {row.date}
                                                        </span>
                                                    </span>
                                                    <StatusBadge
                                                        inProgress={
                                                            row.inProgress
                                                        }
                                                    />
                                                </span>
                                                <span className="grid grid-cols-3 gap-2">
                                                    <Metric
                                                        label="Duración"
                                                        value={row.duration}
                                                    />
                                                    <Metric
                                                        label="Series"
                                                        value={row.series}
                                                    />
                                                    <Metric
                                                        label="Volumen"
                                                        value={row.volume}
                                                    />
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </section>
                            ))}
                        </div>
                    </>
                )}

                {sessions.last_page > 1 && (
                    <nav
                        aria-label="Paginación"
                        className="flex items-center justify-between gap-2"
                    >
                        <PageLink href={sessions.prev_page_url}>
                            <ChevronLeft /> Anterior
                        </PageLink>
                        <span className="text-sm text-muted-foreground">
                            Página {sessions.current_page} de{' '}
                            {sessions.last_page}
                        </span>
                        <PageLink href={sessions.next_page_url}>
                            Siguiente <ChevronRight />
                        </PageLink>
                    </nav>
                )}
            </div>
        </>
    );
}

function StatusBadge({ inProgress }: { inProgress: boolean }) {
    return inProgress ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-primary-text">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            En curso
        </span>
    ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold whitespace-nowrap text-muted-foreground">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
            Completado
        </span>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <span className="flex min-w-0 flex-col">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span
                className="truncate font-num text-[15px]"
                suppressHydrationWarning
            >
                {value}
            </span>
        </span>
    );
}

function PageLink({
    href,
    children,
}: {
    href: string | null;
    children: ReactNode;
}) {
    return href ? (
        <Button variant="outline" className="h-11" asChild>
            <Link href={href}>{children}</Link>
        </Button>
    ) : (
        <Button variant="outline" className="h-11" disabled>
            {children}
        </Button>
    );
}

/**
 * Sessions grouped by month ("octubre de 2026"), keeping their order.
 */
function groupByMonth(
    sessions: WorkoutSession[],
): [string, WorkoutSession[]][] {
    const groups = new Map<string, WorkoutSession[]>();

    for (const session of sessions) {
        const month = formatDate(session.started_at, {
            month: 'long',
            year: 'numeric',
        }).replace(' de ', ' ');

        groups.set(month, [...(groups.get(month) ?? []), session]);
    }

    return [...groups.entries()];
}

WorkoutsIndex.layout = {
    breadcrumbs: [{ title: 'Entrenamientos', href: workouts.index() }],
};
