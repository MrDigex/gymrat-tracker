import { router, useForm } from '@inertiajs/react';
import { Check, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { NumberStepper } from '@/components/gymrat/number-stepper';
import { RpePicker, WarmupToggle } from '@/components/gymrat/set-logger';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import workouts from '@/routes/workouts';
import type {
    Exercise,
    RoutineExercise,
    Suggestion,
    TrackingType,
    WorkoutSet,
} from '@/types';
import type { SetFormData, SetValues } from './workout-helpers';
import {
    defaultsFromSuggestion,
    formDataFromSet,
    isTypingTarget,
    parseInteger,
    parseNumber,
    toPayload,
} from './workout-helpers';

const WEIGHT_STEP = 2.5;

/**
 * "SERIE N" card: steppers, warm-up toggle, RPE and the big save button.
 * With `shortcuts`, ↑↓ change the weight, ←→ the reps and Enter saves
 * (only while focus is not in a text field).
 */
export function SetLoggerCard({
    sessionId,
    exercise,
    suggestion,
    target,
    nextSetNumber,
    shortcuts = false,
    onLogged,
    className,
}: {
    sessionId: number;
    exercise: Exercise;
    suggestion: Suggestion | null;
    target: RoutineExercise | null;
    nextSetNumber: number;
    shortcuts?: boolean;
    onLogged: (set: SetValues) => void;
    className?: string;
}) {
    const form = useForm<SetFormData>(
        defaultsFromSuggestion(suggestion, target),
    );
    const trackingType = exercise.tracking_type;
    const warmup = form.data.is_warmup;
    const setData = <K extends keyof SetFormData>(
        key: K,
        value: SetFormData[K],
    ) => form.setData((current) => ({ ...current, [key]: value }));

    const submit = (event?: FormEvent) => {
        event?.preventDefault();

        if (form.processing) {
            return;
        }

        const payload = toPayload(form.data, trackingType);

        form.transform(() => ({ ...payload, exercise_id: exercise.id }));
        form.post(workouts.sets.store.url(sessionId), {
            preserveScroll: true,
            onSuccess: () => {
                form.setData((current) => ({
                    ...current,
                    rpe: '',
                    is_warmup: false,
                }));
                onLogged(payload);
            },
        });
    };

    const latest = useRef({ submit, data: form.data, set: form.setData });

    useEffect(() => {
        latest.current = { submit, data: form.data, set: form.setData };
    });

    useEffect(() => {
        if (!shortcuts) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.defaultPrevented ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                isTypingTarget(event.target) ||
                (event.target instanceof Element &&
                    event.target.closest('[role="dialog"]')) ||
                document.querySelector('[role="dialog"]')
            ) {
                return;
            }

            const { data, set } = latest.current;
            const bump = (key: 'weight_kg' | 'reps', step: number, min = 0) => {
                const next = Math.max(
                    min,
                    Math.round(((parseNumber(data[key]) ?? 0) + step) * 100) /
                        100,
                );

                event.preventDefault();
                set((current) => ({
                    ...current,
                    [key]: next.toString(),
                }));
            };
            const usesWeight = trackingType === 'weight_reps';
            const usesReps = usesWeight || trackingType === 'reps';

            switch (event.key) {
                case 'ArrowUp':
                    if (usesWeight) {
                        bump('weight_kg', WEIGHT_STEP);
                    }

                    break;
                case 'ArrowDown':
                    if (usesWeight) {
                        bump('weight_kg', -WEIGHT_STEP);
                    }

                    break;
                case 'ArrowRight':
                    if (usesReps) {
                        bump('reps', 1);
                    }

                    break;
                case 'ArrowLeft':
                    if (usesReps) {
                        bump('reps', -1);
                    }

                    break;
                case 'Enter':
                    if (
                        event.target instanceof Element &&
                        event.target.closest('button, a, [role="button"]')
                    ) {
                        return;
                    }

                    event.preventDefault();
                    latest.current.submit();
                    break;
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [shortcuts, trackingType]);

    const title = warmup ? 'Calentamiento' : `Serie ${nextSetNumber}`;

    return (
        <form
            onSubmit={submit}
            aria-label={`Registrar serie ${nextSetNumber}`}
            className={cn(
                'flex flex-col gap-4 rounded-xl border border-input bg-card p-4',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-num text-xl uppercase">{title}</h3>
                <WarmupToggle
                    pressed={warmup}
                    onToggle={() => setData('is_warmup', !warmup)}
                />
            </div>

            <SetFields
                trackingType={trackingType}
                data={form.data}
                errors={form.errors}
                onChange={setData}
                idPrefix={`add-${exercise.id}`}
                compact
            />

            <RpePicker
                value={parseInteger(form.data.rpe)}
                onChange={(value) => setData('rpe', value?.toString() ?? '')}
            />
            <InputError message={form.errors.rpe} />

            {shortcuts &&
                (trackingType === 'weight_reps' || trackingType === 'reps') && (
                    <p className="text-xs text-muted-foreground">
                        Atajos de teclado:{' '}
                        {trackingType === 'weight_reps' && '↑ ↓ peso, '}← →
                        repeticiones, Intro guarda la serie.
                    </p>
                )}

            <Button type="submit" size="workout" disabled={form.processing}>
                <Check strokeWidth={3} />
                Guardar {warmup ? 'calentamiento' : `serie ${nextSetNumber}`}
            </Button>
        </form>
    );
}

export function EditSetForm({
    sessionId,
    set,
    trackingType,
    onDone,
}: {
    sessionId: number;
    set: WorkoutSet;
    trackingType: TrackingType;
    onDone: () => void;
}) {
    const form = useForm<SetFormData>(formDataFromSet(set));
    const [deleting, setDeleting] = useState(false);
    const route = { workout: sessionId, set: set.id };
    const setData = <K extends keyof SetFormData>(
        key: K,
        value: SetFormData[K],
    ) => form.setData((current) => ({ ...current, [key]: value }));

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => toPayload(data, trackingType));
        form.put(workouts.sets.update.url(route), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    const destroy = () =>
        router.delete(workouts.sets.destroy.url(route), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => setDeleting(false),
            onSuccess: onDone,
        });

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-4 overflow-y-auto pb-1"
        >
            <div className="flex justify-end">
                <WarmupToggle
                    pressed={form.data.is_warmup}
                    onToggle={() => setData('is_warmup', !form.data.is_warmup)}
                />
            </div>
            <SetFields
                trackingType={trackingType}
                data={form.data}
                errors={form.errors}
                onChange={setData}
                idPrefix={`edit-${set.id}`}
            />
            <RpePicker
                value={parseInteger(form.data.rpe)}
                onChange={(value) => setData('rpe', value?.toString() ?? '')}
            />
            <InputError message={form.errors.rpe} />
            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 text-destructive"
                    disabled={deleting}
                    onClick={destroy}
                >
                    <Trash2 /> Eliminar
                </Button>
                <Button
                    type="submit"
                    className="h-12 font-bold"
                    disabled={form.processing}
                >
                    <Check /> Guardar cambios
                </Button>
            </div>
        </form>
    );
}

/**
 * Value inputs for a set; which ones depend on how the exercise is tracked.
 */
function SetFields({
    trackingType,
    data,
    errors,
    onChange,
    idPrefix,
    compact = false,
}: {
    trackingType: TrackingType;
    data: SetFormData;
    errors: Partial<Record<string, string>>;
    onChange: <K extends keyof SetFormData>(
        key: K,
        value: SetFormData[K],
    ) => void;
    idPrefix: string;
    compact?: boolean;
}) {
    const stepper = (
        key: 'weight_kg' | 'reps' | 'distance_m',
        label: string,
        options: { step: number; max: number; unit?: string },
    ) => (
        <div className="min-w-0">
            <NumberStepper
                label={label}
                unit={options.unit}
                step={options.step}
                max={options.max}
                compact={compact}
                value={parseNumber(data[key]) ?? 0}
                onChange={(value) => onChange(key, value.toString())}
            />
            <InputError message={errors[key]} className="mt-1" />
        </div>
    );
    const single = trackingType === 'reps' || trackingType === 'time';

    return (
        <div
            className={cn(
                'grid gap-2.5',
                single ? 'grid-cols-1' : 'grid-cols-2',
            )}
        >
            {trackingType === 'weight_reps' &&
                stepper('weight_kg', 'Peso · kg', {
                    step: WEIGHT_STEP,
                    max: 1000,
                    unit: 'kg',
                })}
            {(trackingType === 'weight_reps' || trackingType === 'reps') &&
                stepper('reps', 'Repeticiones', {
                    step: 1,
                    max: 1000,
                    unit: 'reps',
                })}
            {trackingType === 'distance_time' &&
                stepper('distance_m', 'Distancia · m', {
                    step: 50,
                    max: 100000,
                    unit: 'm',
                })}
            {(trackingType === 'time' || trackingType === 'distance_time') && (
                <div className="flex min-w-0 flex-col gap-1.5">
                    <label
                        htmlFor={`${idPrefix}-duration`}
                        className="text-xs font-semibold text-muted-foreground"
                    >
                        Tiempo (mm:ss)
                    </label>
                    <input
                        id={`${idPrefix}-duration`}
                        value={data.duration_seconds}
                        inputMode="numeric"
                        placeholder="1:30"
                        className="h-16 w-full rounded-lg border border-input bg-transparent text-center font-num text-[28px] outline-none focus-visible:border-ring"
                        onChange={(event) =>
                            onChange('duration_seconds', event.target.value)
                        }
                    />
                    <InputError message={errors.duration_seconds} />
                </div>
            )}
        </div>
    );
}
