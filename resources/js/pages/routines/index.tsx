import { Form, Head, Link, router } from '@inertiajs/react';
import { Globe, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import InputError from '@/components/input-error';
import { ResponsivePanel } from '@/components/responsive-panel';
import { routineSummary, timeAgo } from '@/components/routines/routine-meta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import routines from '@/routes/routines';
import workouts from '@/routes/workouts';
import type { Routine } from '@/types';

export default function RoutinesIndex({
    routines: items,
}: {
    routines: Routine[];
}) {
    return (
        <>
            <Head title="Rutinas" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:gap-6 md:p-6 lg:p-8">
                <header className="flex items-end justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        <h1 className="font-num text-[40px] leading-none uppercase md:text-6xl">
                            Rutinas
                        </h1>
                        <p className="text-[15px] text-muted-foreground">
                            Tus planes de entrenamiento. Empieza con un toque.
                        </p>
                    </div>
                    {items.length > 0 && (
                        <CreateRoutinePanel
                            trigger={
                                <Button className="h-11 shrink-0 rounded-lg px-4 font-bold md:h-12 md:px-5 md:text-[15px]">
                                    <Plus aria-hidden />
                                    <span className="sr-only sm:not-sr-only">
                                        Nueva rutina
                                    </span>
                                </Button>
                            }
                        />
                    )}
                </header>

                {items.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {items.map((routine) => (
                            <RoutineCard key={routine.id} routine={routine} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function EmptyState() {
    return (
        <section className="mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#18181b] text-white">
            <div className="flex justify-center px-6 pt-4">
                <img
                    src={MASCOT_SRC}
                    alt=""
                    className="h-48 w-auto object-contain md:h-56"
                />
            </div>
            <div className="h-2.5 bg-hazard" aria-hidden />
            <div className="space-y-4 p-5 md:p-6">
                <div className="space-y-2">
                    <h2 className="font-num text-[28px] leading-tight">
                        Aún no tienes rutinas
                    </h2>
                    <p className="text-[15px] leading-relaxed text-white/80">
                        Crea tu primera rutina con los ejercicios que ya haces.
                        En cada sesión te sugeriremos peso y repeticiones según
                        tu historial.
                    </p>
                </div>
                <CreateRoutinePanel
                    trigger={
                        <Button className="h-14 w-full rounded-lg text-base font-bold">
                            <Plus aria-hidden />
                            Crear mi primera rutina
                        </Button>
                    }
                />
            </div>
        </section>
    );
}

function RoutineCard({ routine }: { routine: Routine }) {
    const [starting, setStarting] = useState(false);
    const exercises = routine.exercises ?? [];
    const count = routine.exercises_count ?? exercises.length;
    const visible = exercises.slice(0, 4);
    const extra = exercises.length - visible.length;

    const start = () => {
        setStarting(true);
        router.post(
            workouts.store.url(),
            { routine_id: routine.id },
            { onFinish: () => setStarting(false) },
        );
    };

    return (
        <article className="flex flex-col gap-4 rounded-xl bg-card p-5 text-card-foreground">
            <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 font-num text-[28px] leading-none break-words uppercase">
                        <Link
                            href={routines.show(routine.id)}
                            className="rounded-sm hover:underline"
                        >
                            {routine.name}
                        </Link>
                    </h2>
                    {routine.is_public && (
                        <Badge variant="secondary" className="shrink-0">
                            <Globe aria-hidden /> Pública
                        </Badge>
                    )}
                </div>
                {routine.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {routine.description}
                    </p>
                )}
                <p className="text-[13px] font-bold">
                    {routineSummary(routine, count, ' · ')}
                    <span className="font-medium text-muted-foreground">
                        {' · '}
                        {routine.last_performed_at
                            ? `último ${timeAgo(routine.last_performed_at)}`
                            : 'sin estrenar'}
                    </span>
                </p>
            </div>

            {visible.length > 0 ? (
                <ul
                    aria-label="Ejercicios"
                    className="grid grid-cols-4 gap-1.5"
                >
                    {visible.map((item, index) => (
                        <li key={item.id} className="relative">
                            <ExerciseImage
                                exercise={item.exercise}
                                animate={false}
                                className="aspect-[4/3] w-full rounded-md [&_svg]:size-5"
                            />
                            {index === visible.length - 1 && extra > 0 && (
                                <span className="absolute inset-0 grid place-items-center rounded-md bg-black/65 font-num text-lg text-white">
                                    +{extra}
                                    <span className="sr-only">
                                        {' '}
                                        ejercicios más
                                    </span>
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-lg border-2 border-dashed p-4 text-center text-sm text-muted-foreground">
                    Sin ejercicios todavía. Ábrela para añadirlos.
                </p>
            )}

            <div className="mt-auto flex gap-2">
                <Button
                    className="h-12 flex-1 rounded-lg text-[15px] font-bold"
                    onClick={start}
                    disabled={starting}
                >
                    {starting ? (
                        <Spinner />
                    ) : (
                        <Play className="fill-current" aria-hidden />
                    )}
                    Empezar
                </Button>
                <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-lg text-[15px] font-bold"
                    asChild
                >
                    <Link href={routines.show(routine.id)}>Ver</Link>
                </Button>
            </div>
        </article>
    );
}

function CreateRoutinePanel({ trigger }: { trigger: ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={setOpen}
            trigger={trigger}
            title="Nueva rutina"
            description="Ponle un nombre; después podrás añadir ejercicios."
        >
            <Form
                {...routines.store.form()}
                className="flex flex-col gap-4"
                onSuccess={() => setOpen(false)}
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="routine-name" className="font-bold">
                                Nombre
                            </Label>
                            <Input
                                id="routine-name"
                                name="name"
                                placeholder="Ej. Pierna y glúteo"
                                required
                                autoFocus
                                className="h-12 rounded-lg text-base"
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="routine-description"
                                className="font-bold"
                            >
                                Descripción (opcional)
                            </Label>
                            <Textarea
                                id="routine-description"
                                name="description"
                                rows={3}
                                placeholder="Objetivo, días de la semana…"
                                className="rounded-lg"
                            />
                            <InputError message={errors.description} />
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-lg px-5 font-bold"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-12 rounded-lg px-6 font-num text-base uppercase"
                            >
                                {processing && <Spinner />} Crear rutina
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </ResponsivePanel>
    );
}

RoutinesIndex.layout = {
    breadcrumbs: [{ title: 'Rutinas', href: routines.index() }],
};
