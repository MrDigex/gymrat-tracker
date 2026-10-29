import { Link, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import exercises from '@/routes/exercises';
import type { Exercise, MuscleGroup, Option } from '@/types';

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

const NONE = 'none';

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

    const setStep = (index: number, value: string) =>
        setData(
            'instructions',
            data.instructions.map((step, i) => (i === index ? value : step)),
        );

    const moveStep = (index: number, offset: number) => {
        const steps = [...data.instructions];
        const [step] = steps.splice(index, 1);
        steps.splice(index + offset, 0, step);
        setData('instructions', steps);
    };

    const removeStep = (index: number) =>
        setData(
            'instructions',
            data.instructions.length > 1
                ? data.instructions.filter((_, i) => i !== index)
                : [''],
        );

    const toggleMuscle = (
        field: 'primary_muscles' | 'secondary_muscles',
        id: number,
        checked: boolean,
    ) => {
        const other =
            field === 'primary_muscles'
                ? 'secondary_muscles'
                : 'primary_muscles';

        setData((current) => ({
            ...current,
            [field]: checked
                ? [...current[field], id]
                : current[field].filter((value) => value !== id),
            [other]: checked
                ? current[other].filter((value) => value !== id)
                : current[other],
        }));
    };

    const musclesByZone = options.zones
        .map((zone) => ({
            ...zone,
            muscles: options.muscleGroups.filter(
                (muscle) => muscle.body_zone === zone.value,
            ),
        }))
        .filter((zone) => zone.muscles.length > 0);

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Datos básicos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            placeholder="Ej. Sled push"
                            required
                            autoFocus={!exercise}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <OptionSelect
                        id="category"
                        label="Categoría"
                        value={data.category}
                        options={options.categories}
                        onChange={(value) => setData('category', value ?? '')}
                        error={errors.category}
                    />
                    <OptionSelect
                        id="tracking_type"
                        label="Tipo de registro"
                        value={data.tracking_type}
                        options={options.trackingTypes}
                        onChange={(value) =>
                            setData('tracking_type', value ?? '')
                        }
                        error={errors.tracking_type}
                        hint="Define qué anotarás en cada serie: peso, repeticiones, tiempo o distancia."
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
                    <OptionSelect
                        id="level"
                        label="Nivel"
                        value={data.level}
                        options={options.levels}
                        onChange={(value) => setData('level', value)}
                        error={errors.level}
                        nullable
                    />
                    <OptionSelect
                        id="mechanic"
                        label="Mecánica"
                        value={data.mechanic}
                        options={options.mechanics}
                        onChange={(value) => setData('mechanic', value)}
                        error={errors.mechanic}
                        nullable
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Imagen</CardTitle>
                    <CardDescription>
                        Opcional. JPG o PNG de hasta 4 MB.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted sm:w-56">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Vista previa"
                                className="size-full bg-white object-cover"
                            />
                        ) : (
                            <ImagePlus className="size-8 text-muted-foreground" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="image"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                            <ImagePlus className="size-4" />
                            {data.image ? 'Cambiar imagen' : 'Subir imagen'}
                        </Label>
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) =>
                                changeImage(event.target.files?.[0] ?? null)
                            }
                        />
                        {data.image && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="truncate">
                                    {data.image.name}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => changeImage(null)}
                                >
                                    Quitar
                                </Button>
                            </div>
                        )}
                        {form.progress && (
                            <progress
                                value={form.progress.percentage}
                                max="100"
                                className="w-full"
                            />
                        )}
                        <InputError message={errors.image} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Músculos</CardTitle>
                    <CardDescription>
                        Marca al menos un músculo principal. Un músculo no puede
                        ser principal y secundario a la vez.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <MuscleChecklist
                        title="Principales"
                        groups={musclesByZone}
                        selected={data.primary_muscles}
                        onToggle={(id, checked) =>
                            toggleMuscle('primary_muscles', id, checked)
                        }
                        error={
                            errors.primary_muscles ??
                            stepErrors['primary_muscles.0']
                        }
                    />
                    <MuscleChecklist
                        title="Secundarios"
                        groups={musclesByZone}
                        selected={data.secondary_muscles}
                        onToggle={(id, checked) =>
                            toggleMuscle('secondary_muscles', id, checked)
                        }
                        error={errors.secondary_muscles}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Instrucciones</CardTitle>
                    <CardDescription>
                        Describe la técnica paso a paso.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <ol className="space-y-3">
                        {data.instructions.map((step, index) => (
                            <li key={index} className="flex gap-2">
                                <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                    {index + 1}
                                </span>
                                <div className="flex-1 space-y-1">
                                    <Textarea
                                        value={step}
                                        onChange={(event) =>
                                            setStep(index, event.target.value)
                                        }
                                        rows={2}
                                        placeholder={`Paso ${index + 1}`}
                                        aria-label={`Paso ${index + 1}`}
                                    />
                                    <InputError
                                        message={
                                            stepErrors[`instructions.${index}`]
                                        }
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        aria-label="Subir paso"
                                        disabled={index === 0}
                                        onClick={() => moveStep(index, -1)}
                                    >
                                        <ArrowUp />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        aria-label="Bajar paso"
                                        disabled={
                                            index ===
                                            data.instructions.length - 1
                                        }
                                        onClick={() => moveStep(index, 1)}
                                    >
                                        <ArrowDown />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        aria-label="Eliminar paso"
                                        onClick={() => removeStep(index)}
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <InputError message={errors.instructions} />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={data.instructions.length >= 20}
                        onClick={() =>
                            setData('instructions', [...data.instructions, ''])
                        }
                    >
                        <Plus /> Añadir paso
                    </Button>
                </CardContent>
            </Card>

            <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
                <Button type="button" variant="outline" asChild>
                    <Link
                        href={
                            exercise
                                ? exercises.show(exercise.id)
                                : exercises.index()
                        }
                    >
                        Cancelar
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing && <Spinner />}
                    {exercise ? 'Guardar cambios' : 'Crear ejercicio'}
                </Button>
            </div>
        </form>
    );
}

function OptionSelect({
    id,
    label,
    value,
    options,
    onChange,
    error,
    hint,
    nullable = false,
}: {
    id: string;
    label: string;
    value: string | null;
    options: Option[];
    onChange: (value: string | null) => void;
    error?: string;
    hint?: string;
    nullable?: boolean;
}) {
    return (
        <div className="grid content-start gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Select
                value={value ?? (nullable ? NONE : undefined)}
                onValueChange={(next) => onChange(next === NONE ? null : next)}
            >
                <SelectTrigger id={id} className="w-full">
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
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

function MuscleChecklist({
    title,
    groups,
    selected,
    onToggle,
    error,
}: {
    title: string;
    groups: (Option & { muscles: MuscleGroup[] })[];
    selected: number[];
    onToggle: (id: number, checked: boolean) => void;
    error?: string;
}) {
    const prefix = title.toLowerCase();

    return (
        <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{title}</legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {groups.map((group) => (
                    <div key={group.value} className="space-y-2">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {group.label}
                        </p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-1">
                            {group.muscles.map((muscle) => {
                                const id = `${prefix}-${muscle.id}`;

                                return (
                                    <div
                                        key={muscle.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={id}
                                            checked={selected.includes(
                                                muscle.id,
                                            )}
                                            onCheckedChange={(checked) =>
                                                onToggle(
                                                    muscle.id,
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor={id}
                                            className="font-normal"
                                        >
                                            {muscle.name}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <InputError message={error} />
        </fieldset>
    );
}
