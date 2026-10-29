import { Head } from '@inertiajs/react';
import { ExerciseImage } from '@/components/exercise-image';
import {
    initials,
    PublicShareLayout,
    PublicStat,
} from '@/components/public-share-layout';
import { formatNumber, formatTarget } from '@/lib/format';
import type { Routine } from '@/types';

function formatRest(seconds: number): string {
    return seconds >= 120
        ? `${formatNumber(seconds / 60)} min`
        : `${seconds} s`;
}

export default function ShareRoutine({
    routine,
    author,
}: {
    routine: Routine;
    author: string;
}) {
    const items = routine.exercises ?? [];
    const totalSets =
        routine.total_sets ??
        items.reduce((total, item) => total + item.target_sets, 0);

    return (
        <>
            <Head title={routine.name} />
            <PublicShareLayout pitch="Copia esta rutina y GymRat te dirá cuándo subir peso.">
                <div className="flex items-center gap-2 text-[15px]">
                    <span
                        aria-hidden
                        className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground"
                    >
                        {initials(author)}
                    </span>
                    Rutina de {author}
                </div>
                <h1 className="mt-1 font-num text-[56px] leading-[0.95] break-words uppercase sm:text-[72px]">
                    {routine.name}
                </h1>
                {routine.description && (
                    <p className="mt-2 text-base leading-relaxed text-foreground/85">
                        {routine.description}
                    </p>
                )}

                <div className="mt-4 flex gap-6">
                    <PublicStat label="Ejercicios" value={items.length} />
                    <PublicStat label="Series" value={totalSets} />
                    {routine.estimated_minutes ? (
                        <PublicStat
                            label="Duración"
                            value={`~${routine.estimated_minutes} min`}
                        />
                    ) : null}
                </div>

                <ol className="mt-5 grid gap-2.5">
                    {items.map((item, index) => {
                        const muscles = [
                            ...(item.exercise.primary_muscles ?? []),
                            ...(item.exercise.secondary_muscles ?? []),
                        ].slice(0, 3);

                        return (
                            <li
                                key={item.id}
                                className="flex gap-3 rounded-[14px] bg-card p-2"
                            >
                                <div className="relative size-[76px] shrink-0 overflow-hidden rounded-[10px]">
                                    <ExerciseImage
                                        exercise={item.exercise}
                                        className="size-full"
                                    />
                                    <span className="absolute bottom-1 left-1 rounded-[6px] bg-[#18181b]/80 px-1.5 font-num text-sm text-[#fafafa]">
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 py-1">
                                    <h2 className="leading-tight font-bold">
                                        {item.exercise.name}
                                    </h2>
                                    <p className="mt-0.5">
                                        <span className="font-num text-[15px] text-primary-text">
                                            {formatTarget(item)}
                                        </span>
                                        {item.rest_seconds ? (
                                            <span className="ml-1.5 text-xs text-muted-foreground">
                                                descanso{' '}
                                                {formatRest(item.rest_seconds)}
                                            </span>
                                        ) : null}
                                    </p>
                                    {muscles.length > 0 && (
                                        <ul className="mt-1.5 flex flex-wrap gap-1">
                                            {muscles.map((muscle) => (
                                                <li
                                                    key={muscle.id}
                                                    className="rounded-md bg-tip-first/20 px-1.5 py-0.5 text-[11px] font-bold"
                                                >
                                                    {muscle.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {item.notes && (
                                        <p className="mt-1 text-sm text-muted-foreground italic">
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
