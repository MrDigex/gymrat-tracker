import { router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ResponsivePanel } from '@/components/responsive-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import workouts from '@/routes/workouts';
import type { Routine } from '@/types';

type Choice = number | 'free';

function lastPerformedLabel(value: string | null | undefined): string {
    if (!value) {
        return 'aún sin hacer';
    }

    const startOfDay = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round(
        (startOfDay(new Date()) - startOfDay(new Date(value))) / 86_400_000,
    );

    if (days <= 0) {
        return 'hecho hoy';
    }

    return days === 1 ? 'último ayer' : `último hace ${days} días`;
}

/**
 * "Nuevo entrenamiento": pick a routine (the suggested one first) or a free workout.
 */
export function NewWorkoutPanel({
    routines,
    suggestedRoutineId,
    open,
    onOpenChange,
    trigger,
}: {
    routines: Routine[];
    suggestedRoutineId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: ReactNode;
}) {
    const ordered = [...routines].sort(
        (a, b) =>
            Number(b.id === suggestedRoutineId) -
            Number(a.id === suggestedRoutineId),
    );
    const [choice, setChoice] = useState<Choice>(
        suggestedRoutineId ?? ordered[0]?.id ?? 'free',
    );
    const [name, setName] = useState('');
    const [processing, setProcessing] = useState(false);

    const start = () =>
        router.post(
            workouts.store.url(),
            choice === 'free'
                ? { name: name.trim() || null }
                : { routine_id: choice },
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );

    const option = (
        value: Choice,
        title: string,
        subtitle: string,
        badge?: string,
    ) => {
        const selected = choice === value;

        return (
            <label
                key={value}
                className={cn(
                    'flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors',
                    'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                    value === 'free' && 'border-dashed',
                    selected
                        ? 'border-primary bg-primary/12'
                        : 'border-border hover:border-foreground/40',
                )}
            >
                <input
                    type="radio"
                    name="new-workout"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setChoice(value)}
                />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-extrabold">
                        {title}
                    </span>
                    <span className="block text-[13px] text-muted-foreground">
                        {subtitle}
                    </span>
                </span>
                {badge && (
                    <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-extrabold text-primary-foreground">
                        {badge}
                    </span>
                )}
            </label>
        );
    };

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            trigger={trigger}
            title="Nuevo entrenamiento"
            className="sm:max-w-lg"
        >
            <form
                className="flex min-h-0 flex-col gap-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    start();
                }}
            >
                <fieldset className="flex min-h-0 flex-col gap-2 overflow-y-auto p-0.5">
                    <legend className="sr-only">
                        Elige una rutina o un entrenamiento libre
                    </legend>
                    {ordered.map((routine) => {
                        const count = routine.exercises_count ?? 0;
                        const exercises = `${count} ${count === 1 ? 'ejercicio' : 'ejercicios'}`;
                        const suggested = routine.id === suggestedRoutineId;

                        return option(
                            routine.id,
                            routine.name,
                            suggested
                                ? `${exercises}, toca hoy`
                                : `${exercises}, ${lastPerformedLabel(routine.last_performed_at)}`,
                            suggested ? 'Siguiente' : undefined,
                        );
                    })}
                    {option(
                        'free',
                        'Entrenamiento libre',
                        'Añade ejercicios sobre la marcha',
                    )}
                </fieldset>

                {choice === 'free' && (
                    <Input
                        value={name}
                        maxLength={120}
                        aria-label="Nombre del entrenamiento (opcional)"
                        placeholder="Nombre (opcional)"
                        className="h-12"
                        onChange={(event) => setName(event.target.value)}
                    />
                )}

                <Button
                    type="submit"
                    size="workout"
                    className="mt-1 shrink-0"
                    disabled={processing}
                >
                    {processing ? 'Empezando…' : 'Empezar'}
                </Button>
            </form>
        </ResponsivePanel>
    );
}
