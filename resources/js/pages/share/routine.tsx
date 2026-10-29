import { Head } from '@inertiajs/react';
import { Target, Timer } from 'lucide-react';
import { ExerciseImage } from '@/components/exercise-image';
import { PublicShareLayout } from '@/components/public-share-layout';
import { Badge } from '@/components/ui/badge';
import { formatTarget } from '@/lib/format';
import type { Routine } from '@/types';

export default function ShareRoutine({
    routine,
    author,
    shareUrl,
}: {
    routine: Routine;
    author: string;
    shareUrl: string;
}) {
    const items = routine.exercises ?? [];

    return (
        <>
            <Head title={routine.name} />
            <PublicShareLayout
                badge="Rutina"
                title={routine.name}
                subtitle={
                    <>
                        {routine.description && (
                            <p className="mb-1">{routine.description}</p>
                        )}
                        <p className="text-sm">
                            {items.length}{' '}
                            {items.length === 1 ? 'ejercicio' : 'ejercicios'}
                        </p>
                    </>
                }
                author={author}
                shareUrl={shareUrl}
                shareText={`Mira la rutina "${routine.name}" de ${author}`}
            >
                <ol className="space-y-3">
                    {items.map((item, index) => {
                        const muscles = [
                            ...(item.exercise.primary_muscles ?? []),
                            ...(item.exercise.secondary_muscles ?? []),
                        ];

                        return (
                            <li
                                key={item.id}
                                className="flex gap-4 overflow-hidden rounded-xl border bg-card p-3"
                            >
                                <div className="relative w-28 shrink-0 sm:w-36">
                                    <ExerciseImage
                                        exercise={item.exercise}
                                        className="rounded-lg"
                                    />
                                    <span className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 space-y-2 py-1">
                                    <h2 className="leading-tight font-semibold">
                                        {item.exercise.name}
                                    </h2>
                                    <div className="flex flex-wrap gap-1.5">
                                        <Badge className="gap-1">
                                            <Target className="size-3" />
                                            {formatTarget(item)}
                                        </Badge>
                                        {item.rest_seconds && (
                                            <Badge
                                                variant="outline"
                                                className="gap-1"
                                            >
                                                <Timer className="size-3" />
                                                {item.rest_seconds} s descanso
                                            </Badge>
                                        )}
                                    </div>
                                    {muscles.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {muscles
                                                .map((muscle) => muscle.name)
                                                .join(' · ')}
                                        </p>
                                    )}
                                    {item.notes && (
                                        <p className="text-sm text-muted-foreground italic">
                                            {item.notes}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </PublicShareLayout>
        </>
    );
}
