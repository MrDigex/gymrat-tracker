import { Link, useForm } from '@inertiajs/react';
import { GripVertical, Plus, Upload, X } from 'lucide-react';
import type {
    DragEvent,
    FormEvent,
    KeyboardEvent,
    PointerEvent,
    ReactNode,
} from 'react';
import { useRef, useState } from 'react';
import { zoneStyle } from '@/components/exercises/muscle-chip';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import exercises from '@/routes/exercises';
import type { BodyZone, Exercise, MuscleGroup, Option } from '@/types';

export type ExerciseFormOptions = {
    muscleGroups: MuscleGroup[];
    categories: Option[];
    trackingTypes: Option[];
    zones: Option[];
    equipment: Option[];
    levels: Option[];
    mechanics: Option[];
};

type ExerciseFormData = {
    name: string;
    category: string;
    tracking_type: string;
    equipment: string | null;
    level: string | null;
    mechanic: string | null;
    instructions: string[];
    primary_muscles: number[];
    secondary_muscles: number[];
    image: File | null;
};

type MuscleRole = 'primary' | 'secondary' | null;

const NONE = 'none';
const MAX_STEPS = 20;

const TRACKING_EXAMPLES: Record<string, string> = {
    weight_reps: '67,5 kg × 10',
    reps: '15 dominadas',
    time: 'Plancha 1:15',
    distance_time: 'Remo 1000 m en 4:15',
};

export function ExerciseForm({
    options,
    exercise,
    values,
}: {
    options: ExerciseFormOptions;
    exercise?: Exercise;
    values?: {
        equipment: string | null;
        level: string | null;
        mechanic: string | null;
    };
}) {
    const form = useForm<ExerciseFormData>({
        name: exercise?.name ?? '',
        category: exercise?.category ?? 'fuerza',
        tracking_type: exercise?.tracking_type ?? 'weight_reps',
        equipment: values?.equipment ?? null,
        level: values?.level ?? null,
        mechanic: values?.mechanic ?? null,
        instructions: exercise?.instructions?.length
            ? exercise.instructions
            : [''],
        primary_muscles:
            exercise?.primary_muscles?.map((muscle) => muscle.id) ?? [],
        secondary_muscles:
            exercise?.secondary_muscles?.map((muscle) => muscle.id) ?? [],
        image: null,
    });
    const { data, setData, errors, processing } = form;
    const [preview, setPreview] = useState<string | null>(
        exercise?.image_url ?? null,
    );
    const [dropping, setDropping] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const stepsRef = useRef<HTMLOListElement>(null);
    const stepErrors = errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (exercise) {
            form.transform((current) => ({ ...current, _method: 'put' }));
            form.post(exercises.update.url(exercise.id), {
                forceFormData: true,
                preserveScroll: true,
            });
        } else {
            form.transform((current) => current);
            form.post(exercises.store.url(), {
                forceFormData: true,
                preserveScroll: true,
            });
        }
    };

    const changeImage = (file: File | null) => {
        if (preview?.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }

        setData('image', file);
        setPreview(
            file ? URL.createObjectURL(file) : (exercise?.image_url ?? null),
        );
    };

    const dropImage = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setDropping(false);
        const file = event.dataTransfer.files[0];

        if (file?.type.startsWith('image/')) {
            changeImage(file);
        }
    };

    // Steps -----------------------------------------------------------------

    const setStep = (index: number, value: string) =>
        setData(
            'instructions',
            data.instructions.map((step, i) => (i === index ? value : step)),
        );

    const moveStep = (from: number, to: number) => {
        if (to < 0 || to >= data.instructions.length || from === to) {
            return;
        }

        const steps = [...data.instructions];
        const [step] = steps.splice(from, 1);
        steps.splice(to, 0, step);
        setData('instructions', steps);
    };

    const removeStep = (index: number) =>
        setData(
            'instructions',
            data.instructions.length > 1
                ? data.instructions.filter((_, i) => i !== index)
                : [''],
        );

    const focusHandle = (index: number) =>
        window.requestAnimationFrame(() =>
            stepsRef.current
                ?.querySelector<HTMLElement>(`[data-handle="${index}"]`)
                ?.focus(),
        );

    const startDrag = (event: PointerEvent<HTMLElement>, index: number) => {
        if (event.button !== 0) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        setDragIndex(index);
    };

    const drag = (event: PointerEvent<HTMLElement>) => {
        if (dragIndex === null || !stepsRef.current) {
            return;
        }

        const rows = Array.from(stepsRef.current.children);
        let target = dragIndex;

        // Move past every row whose middle the pointer has crossed.
        rows.forEach((row, index) => {
            const { top, height } = row.getBoundingClientRect();
            const middle = top + height / 2;

            if (index > dragIndex && event.clientY > middle) {
                target = index;
            } else if (
                index < dragIndex &&
                event.clientY < middle &&
                target === dragIndex
            ) {
                target = index;
            }
        });

        if (target !== dragIndex) {
            moveStep(dragIndex, target);
            setDragIndex(target);
        }
    };

    const handleKeys = (event: KeyboardEvent<HTMLElement>, index: number) => {
        const offset =
            event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;

        if (offset === 0) {
            return;
        }

        event.preventDefault();
        const to = index + offset;

        if (to >= 0 && to < data.instructions.length) {
            moveStep(index, to);
            focusHandle(to);
        }
    };

    // Muscles ---------------------------------------------------------------

    const roleOf = (id: number): MuscleRole =>
        data.primary_muscles.includes(id)
            ? 'primary'
            : data.secondary_muscles.includes(id)
              ? 'secondary'
              : null;

    /** Off → principal → secundario → off. */
    const cycleMuscle = (id: number) => {
        form.clearErrors('primary_muscles', 'secondary_muscles');
        setData((current) => {
            const primary = current.primary_muscles.filter(
                (value) => value !== id,
            );
            const secondary = current.secondary_muscles.filter(
                (value) => value !== id,
            );
            const role = current.primary_muscles.includes(id)
                ? 'primary'
                : current.secondary_muscles.includes(id)
                  ? 'secondary'
                  : null;

            return {
                ...current,
                primary_muscles: role === null ? [...primary, id] : primary,
                secondary_muscles:
                    role === 'primary' ? [...secondary, id] : secondary,
            };
        });
    };

    const zoneOrder = options.zones.map((zone) => zone.value);
    const musclesByZone = Object.values(
        options.muscleGroups.reduce<
            Record<
                string,
                { zone: BodyZone; label: string; muscles: MuscleGroup[] }
            >
        >((groups, muscle) => {
            groups[muscle.body_zone] ??= {
                zone: muscle.body_zone,
                label: muscle.body_zone_label,
                muscles: [],
            };
            groups[muscle.body_zone].muscles.push(muscle);

            return groups;
        }, {}),
    ).sort((a, b) => {
        const rank = (zone: string) =>
            zoneOrder.includes(zone) ? zoneOrder.indexOf(zone) : 99;

        return rank(a.zone) - rank(b.zone);
    });

    return (
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
            {/* Image ------------------------------------------------------ */}
            <div className="space-y-2">
                <input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="peer sr-only"
                    onChange={(event) => {
                        changeImage(event.target.files?.[0] ?? null);
                        event.target.value = '';
                    }}
                />
                {preview ? (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring sm:aspect-[2/1]">
                        <img
                            src={preview}
                            alt="Vista previa de la imagen"
                            className="size-full bg-white object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded-sm bg-[#18181b] px-2 py-0.5 text-xs font-extrabold text-white">
                            Inicio
                        </span>
                        <div className="absolute top-2 right-2 flex gap-2">
                            <label
                                htmlFor="image"
                                className="inline-flex h-11 cursor-pointer items-center rounded-full bg-[#18181b]/85 px-4 text-sm font-bold text-white"
                            >
                                Cambiar
                            </label>
                            {data.image && (
                                <button
                                    type="button"
                                    onClick={() => changeImage(null)}
                                    aria-label="Quitar la imagen nueva"
                                    className="grid size-11 place-items-center rounded-full bg-[#18181b]/85 text-white outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                                >
                                    <X className="size-5" strokeWidth={2.6} />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Label
                        htmlFor="image"
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDropping(true);
                        }}
                        onDragLeave={() => setDropping(false)}
                        onDrop={dropImage}
                        className={cn(
                            'flex h-40 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring',
                            dropping
                                ? 'border-primary bg-accent'
                                : 'border-border hover:bg-muted',
                        )}
                    >
                        <Upload className="mb-1 size-6" aria-hidden />
                        <span className="text-[15px] font-bold">
                            Subir imagen
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            JPG o PNG, máx. 4 MB
                        </span>
                    </Label>
                )}
                {form.progress && (
                    <progress
                        value={form.progress.percentage}
                        max="100"
                        className="h-1.5 w-full accent-primary"
                    />
                )}
                <InputError message={errors.image} />
            </div>

            {/* Basics ----------------------------------------------------- */}
            <Field label="Nombre" htmlFor="name" error={errors.name}>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    placeholder="Ej. Press landmine a una mano"
                    required
                    autoFocus={!exercise}
                    aria-invalid={Boolean(errors.name)}
                    className="h-12 rounded-lg bg-card text-base md:text-base"
                />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <OptionSelect
                    id="category"
                    label="Categoría"
                    value={data.category}
                    options={options.categories}
                    onChange={(value) => setData('category', value ?? '')}
                    error={errors.category}
                />
                <OptionSelect
                    id="equipment"
                    label="Equipamiento"
                    value={data.equipment}
                    options={options.equipment}
                    onChange={(value) => setData('equipment', value)}
                    error={errors.equipment}
                    nullable
                />
            </div>

            <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-bold">
                    Cómo se registra
                </legend>
                <div className="grid grid-cols-2 gap-2">
                    {options.trackingTypes.map((type) => (
                        <label
                            key={type.value}
                            className="flex min-h-16 cursor-pointer flex-col justify-center rounded-lg border-2 border-border bg-card px-3 py-2.5 has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                        >
                            <input
                                type="radio"
                                name="tracking_type"
                                value={type.value}
                                checked={data.tracking_type === type.value}
                                onChange={() =>
                                    setData('tracking_type', type.value)
                                }
                                className="sr-only"
                            />
                            <span className="text-[15px] leading-tight font-bold">
                                {type.label}
                            </span>
                            {TRACKING_EXAMPLES[type.value] && (
                                <span className="text-[13px] text-muted-foreground">
                                    {TRACKING_EXAMPLES[type.value]}
                                </span>
                            )}
                        </label>
                    ))}
                </div>
                <InputError message={errors.tracking_type} />
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
                <Segmented
                    id="level"
                    label="Nivel"
                    value={data.level}
                    options={options.levels}
                    onChange={(value) => setData('level', value)}
                    error={errors.level}
                />
                <Segmented
                    id="mechanic"
                    label="Mecánica"
                    value={data.mechanic}
                    options={options.mechanics}
                    onChange={(value) => setData('mechanic', value)}
                    error={errors.mechanic}
                />
            </div>

            {/* Muscles ---------------------------------------------------- */}
            <fieldset className="space-y-3" aria-describedby="muscles-hint">
                <legend className="text-sm font-bold">
                    Músculos{' '}
                    <span id="muscles-hint" className="font-semibold">
                        (toca una vez: principal; dos: secundario)
                    </span>
                </legend>
                {musclesByZone.map((group) => (
                    <div key={group.zone} className="space-y-2">
                        <p className="text-[13px] text-muted-foreground">
                            {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {group.muscles.map((muscle) => (
                                <MuscleToggle
                                    key={muscle.id}
                                    muscle={muscle}
                                    role={roleOf(muscle.id)}
                                    onClick={() => cycleMuscle(muscle.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <InputError
                    message={
                        errors.primary_muscles ??
                        stepErrors['primary_muscles.0'] ??
                        errors.secondary_muscles
                    }
                />
            </fieldset>

            {/* Steps ------------------------------------------------------ */}
            <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-bold">
                    Instrucciones
                </legend>
                <p id="steps-hint" className="sr-only">
                    Arrastra el asa o usa las flechas arriba y abajo para
                    reordenar.
                </p>
                <ol ref={stepsRef} className="space-y-2">
                    {data.instructions.map((step, index) => (
                        <li
                            key={index}
                            className={cn(
                                'rounded-lg bg-card transition-shadow',
                                dragIndex === index &&
                                    'shadow-float ring-2 ring-primary',
                            )}
                        >
                            <div className="flex items-start gap-1 py-1 pr-1">
                                <button
                                    type="button"
                                    data-handle={index}
                                    aria-label={`Mover paso ${index + 1}`}
                                    aria-describedby="steps-hint"
                                    onPointerDown={(event) =>
                                        startDrag(event, index)
                                    }
                                    onPointerMove={drag}
                                    onPointerUp={() => setDragIndex(null)}
                                    onPointerCancel={() => setDragIndex(null)}
                                    onKeyDown={(event) =>
                                        handleKeys(event, index)
                                    }
                                    className="grid h-11 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:cursor-grabbing"
                                >
                                    <GripVertical className="size-5" />
                                </button>
                                <span
                                    aria-hidden
                                    className="w-5 shrink-0 pt-3 font-num text-[15px]"
                                >
                                    {index + 1}
                                </span>
                                <Textarea
                                    value={step}
                                    onChange={(event) =>
                                        setStep(index, event.target.value)
                                    }
                                    rows={1}
                                    placeholder={`Describe el paso ${index + 1}`}
                                    aria-label={`Paso ${index + 1}`}
                                    aria-invalid={Boolean(
                                        stepErrors[`instructions.${index}`],
                                    )}
                                    className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] shadow-none focus-visible:ring-[3px] md:text-[15px] dark:bg-transparent"
                                />
                                <button
                                    type="button"
                                    aria-label={`Eliminar paso ${index + 1}`}
                                    onClick={() => removeStep(index)}
                                    className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
                                >
                                    <X className="size-4" strokeWidth={2.6} />
                                </button>
                            </div>
                            <InputError
                                className="px-3 pb-2"
                                message={stepErrors[`instructions.${index}`]}
                            />
                        </li>
                    ))}
                </ol>
                <InputError message={errors.instructions} />
                <button
                    type="button"
                    disabled={data.instructions.length >= MAX_STEPS}
                    onClick={() =>
                        setData('instructions', [...data.instructions, ''])
                    }
                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-[15px] font-bold outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
                >
                    <Plus className="size-4" strokeWidth={3} /> Añadir paso
                </button>
            </fieldset>

            <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
                <Button
                    type="submit"
                    size="workout"
                    disabled={processing}
                    className="w-full"
                >
                    {processing && <Spinner />}
                    Guardar ejercicio
                </Button>
            </div>
        </form>
    );
}

/**
 * Page header for the create and edit screens: × close plus the title.
 */
export function ExerciseFormHeader({
    title,
    closeHref,
}: {
    title: string;
    closeHref: string;
}) {
    return (
        <header className="flex items-center gap-2">
            <Link
                href={closeHref}
                aria-label="Cerrar sin guardar"
                className="-ml-2 grid size-11 place-items-center rounded-lg outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
            >
                <X className="size-6" strokeWidth={2.6} />
            </Link>
            <h1 className="font-num text-[22px] leading-none uppercase lg:text-[28px]">
                {title}
            </h1>
        </header>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid content-start gap-2">
            <Label htmlFor={htmlFor} className="font-bold">
                {label}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function OptionSelect({
    id,
    label,
    value,
    options,
    onChange,
    error,
    nullable = false,
}: {
    id: string;
    label: string;
    value: string | null;
    options: Option[];
    onChange: (value: string | null) => void;
    error?: string;
    nullable?: boolean;
}) {
    return (
        <Field label={label} htmlFor={id} error={error}>
            <Select
                value={value ?? (nullable ? NONE : undefined)}
                onValueChange={(next) => onChange(next === NONE ? null : next)}
            >
                <SelectTrigger
                    id={id}
                    aria-invalid={Boolean(error)}
                    className="h-12! w-full rounded-lg bg-card text-base font-semibold"
                >
                    <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                    {nullable && (
                        <SelectItem value={NONE}>Sin especificar</SelectItem>
                    )}
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    );
}

/**
 * Segmented control for an optional value: tapping the active option clears it.
 */
function Segmented({
    id,
    label,
    value,
    options,
    onChange,
    error,
}: {
    id: string;
    label: string;
    value: string | null;
    options: Option[];
    onChange: (value: string | null) => void;
    error?: string;
}) {
    return (
        <div className="grid content-start gap-2">
            <span id={`${id}-label`} className="text-sm font-bold">
                {label}
            </span>
            <div
                role="group"
                aria-labelledby={`${id}-label`}
                className="flex gap-1 rounded-lg bg-card p-1"
            >
                {options.map((option) => {
                    const active = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                                onChange(active ? null : option.value)
                            }
                            className={cn(
                                'h-11 min-w-0 flex-1 truncate rounded-[10px] px-2 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                                active
                                    ? 'bg-foreground text-background'
                                    : 'text-foreground hover:bg-muted',
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
            <InputError message={error} />
        </div>
    );
}

function MuscleToggle({
    muscle,
    role,
    onClick,
}: {
    muscle: MuscleGroup;
    role: MuscleRole;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={zoneStyle(muscle.body_zone)}
            className={cn(
                'h-11 rounded-full border-2 px-4 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                role === 'primary' &&
                    'border-(--zone) bg-(--zone) text-[#18181b]',
                role === 'secondary' &&
                    'border-dashed border-(--zone) bg-(--zone)/15 text-[color-mix(in_oklab,var(--zone)_55%,var(--foreground))]',
                role === null && 'border-border hover:bg-muted',
            )}
        >
            {muscle.name}
            {role === 'primary' && ' · principal'}
            {role === 'secondary' && ' · secundario'}
        </button>
    );
}
