import { Form, Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Eye, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/format';
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

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Rutinas"
                        description="Organiza tus entrenamientos y empieza con un toque."
                    />
                    <CreateRoutineDialog />
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
                        <ClipboardList className="size-10 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Aún no tienes rutinas</p>
                            <p className="text-sm text-muted-foreground">
                                Crea tu primera rutina y te sugeriremos pesos y
                                repeticiones según tu historial.
                            </p>
                        </div>
                        <CreateRoutineDialog />
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((routine) => (
                            <RoutineCard key={routine.id} routine={routine} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function RoutineCard({ routine }: { routine: Routine }) {
    const [starting, setStarting] = useState(false);
    const exercises = routine.exercises ?? [];
    const count = routine.exercises_count ?? exercises.length;

    const start = () => {
        setStarting(true);
        router.post(
            workouts.store.url(),
            { routine_id: routine.id },
            { onFinish: () => setStarting(false) },
        );
    };

    return (
        <Card className="gap-4">
            <CardHeader>
                <CardTitle className="text-lg">
                    <Link
                        href={routines.show(routine.id)}
                        className="hover:underline"
                    >
                        {routine.name}
                    </Link>
                </CardTitle>
                <CardDescription>
                    {count} {count === 1 ? 'ejercicio' : 'ejercicios'}
                    {routine.updated_at &&
                        ` · Actualizada el ${formatDate(routine.updated_at)}`}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                {routine.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {routine.description}
                    </p>
                )}
                {exercises.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                        {exercises.slice(0, 5).map((item) => (
                            <ExerciseImage
                                key={item.id}
                                exercise={item.exercise}
                                animate={false}
                                className="h-10 w-14 shrink-0 rounded-md border [&_svg]:size-4"
                            />
                        ))}
                        {exercises.length > 5 && (
                            <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium">
                                +{exercises.length - 5}
                            </span>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Sin ejercicios todavía.
                    </p>
                )}
            </CardContent>
            <CardFooter className="gap-2">
                <Button className="flex-1" onClick={start} disabled={starting}>
                    {starting ? <Spinner /> : <Play />} Empezar
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={routines.show(routine.id)}>
                        <Eye /> Ver
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function CreateRoutineDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus /> Nueva rutina
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nueva rutina</DialogTitle>
                    <DialogDescription>
                        Ponle un nombre; después podrás añadir ejercicios.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...routines.store.form()}
                    className="space-y-4"
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="routine-name">Nombre</Label>
                                <Input
                                    id="routine-name"
                                    name="name"
                                    placeholder="Ej. Pierna y glúteo"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="routine-description">
                                    Descripción (opcional)
                                </Label>
                                <Textarea
                                    id="routine-description"
                                    name="description"
                                    rows={3}
                                    placeholder="Objetivo, días de la semana…"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />} Crear rutina
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

RoutinesIndex.layout = {
    breadcrumbs: [{ title: 'Rutinas', href: routines.index() }],
};
