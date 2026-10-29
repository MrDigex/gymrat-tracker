import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Dumbbell,
    ListChecks,
    Play,
    Plus,
    Weight,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatKg } from '@/lib/format';
import workouts from '@/routes/workouts';
import type { Paginated, Routine, WorkoutSession } from '@/types';

export default function WorkoutsIndex({
    sessions,
    routines,
}: {
    sessions: Paginated<WorkoutSession>;
    routines: Routine[];
}) {
    return (
        <>
            <Head title="Entrenamientos" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Entrenamientos"
                        description="Tu historial de sesiones en el gimnasio."
                    />
                    <NewWorkoutDialog routines={routines} />
                </div>

                {sessions.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <Dumbbell className="size-10 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">
                                Aún no has registrado ningún entrenamiento
                            </h3>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                Empieza una sesión a partir de una de tus
                                rutinas o haz un entrenamiento libre.
                            </p>
                            <NewWorkoutDialog routines={routines} />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {sessions.data.map((session) => (
                            <SessionRow key={session.id} session={session} />
                        ))}
                    </div>
                )}

                {sessions.last_page > 1 && (
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            disabled={!sessions.prev_page_url}
                            asChild={!!sessions.prev_page_url}
                        >
                            {sessions.prev_page_url ? (
                                <Link href={sessions.prev_page_url}>
                                    <ChevronLeft /> Anterior
                                </Link>
                            ) : (
                                <span>
                                    <ChevronLeft /> Anterior
                                </span>
                            )}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {sessions.current_page} de{' '}
                            {sessions.last_page}
                        </span>
                        <Button
                            variant="outline"
                            disabled={!sessions.next_page_url}
                            asChild={!!sessions.next_page_url}
                        >
                            {sessions.next_page_url ? (
                                <Link href={sessions.next_page_url}>
                                    Siguiente <ChevronRight />
                                </Link>
                            ) : (
                                <span>
                                    Siguiente <ChevronRight />
                                </span>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

function SessionRow({ session }: { session: WorkoutSession }) {
    const inProgress = !session.finished_at;

    return (
        <Link
            href={workouts.show(session.id)}
            className="block rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="truncate font-semibold">{session.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                        {formatDate(session.started_at, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </div>
                </div>
                {inProgress ? (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        En curso
                    </Badge>
                ) : (
                    <Badge variant="secondary">Completado</Badge>
                )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {session.duration_minutes !== null
                        ? `${session.duration_minutes} min`
                        : '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <ListChecks className="size-4" />
                    {session.sets_count ?? 0} series ·{' '}
                    {session.exercises_count ?? 0} ejercicios
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Weight className="size-4" />
                    {formatKg(session.volume_kg ?? 0)}
                </span>
            </div>
        </Link>
    );
}

function NewWorkoutDialog({ routines }: { routines: Routine[] }) {
    const [name, setName] = useState('');
    const [processing, setProcessing] = useState(false);

    const start = (data: { routine_id: number } | { name: string | null }) => {
        router.post(workouts.store.url(), data, {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="lg">
                    <Plus /> Nuevo entrenamiento
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nuevo entrenamiento</DialogTitle>
                    <DialogDescription>
                        Elige una rutina o empieza un entrenamiento libre.
                    </DialogDescription>
                </DialogHeader>

                {routines.length > 0 && (
                    <div className="grid gap-2">
                        {routines.map((routine) => (
                            <Button
                                key={routine.id}
                                variant="outline"
                                className="h-auto justify-between py-3 text-left"
                                disabled={processing}
                                onClick={() =>
                                    start({ routine_id: routine.id })
                                }
                            >
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold">
                                        {routine.name}
                                    </span>
                                    {routine.exercises_count !== undefined && (
                                        <span className="block text-xs font-normal text-muted-foreground">
                                            {routine.exercises_count} ejercicios
                                        </span>
                                    )}
                                </span>
                                <Play />
                            </Button>
                        ))}
                    </div>
                )}

                {routines.length > 0 && <Separator />}

                <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        start({ name: name.trim() || null });
                    }}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="workout-name">
                            Entrenamiento libre
                        </Label>
                        <Input
                            id="workout-name"
                            value={name}
                            maxLength={120}
                            placeholder="Nombre (opcional)"
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                    <Button type="submit" size="lg" disabled={processing}>
                        <Play /> Empezar entrenamiento libre
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

WorkoutsIndex.layout = {
    breadcrumbs: [{ title: 'Entrenamientos', href: workouts.index() }],
};
