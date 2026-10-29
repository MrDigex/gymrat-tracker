import { useForm } from '@inertiajs/react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { NumberStepper } from '@/components/gymrat/number-stepper';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDuration, formatPace, parseDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import activities from '@/routes/activities';
import type { Activity, Option } from '@/types';

export type HyroxSplit = { label: string; distance_m: number };

type SplitRow = { label: string; distance_m: string; duration: string };

type ActivityFormData = {
    type: string;
    name: string;
    started_at: string;
    distance_km: string;
    duration: string;
    elevation_gain_m: string;
    avg_hr: string;
    max_hr: string;
    calories: string;
    splits: SplitRow[];
};

const RUN_TYPES = ['carrera', 'trail', 'cinta'];

function toLocalInput(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseNumber(value: string): number | null {
    const normalized = value.trim().replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string): number | null {
    const parsed = parseNumber(value);

    return parsed === null ? null : Math.round(parsed);
}

function initialData(activity?: Activity): ActivityFormData {
    if (!activity) {
        return {
            type: 'carrera',
            name: '',
            started_at: toLocalInput(new Date()),
            distance_km: '',
            duration: '',
            elevation_gain_m: '',
            avg_hr: '',
            max_hr: '',
            calories: '',
            splits: [],
        };
    }

    return {
        type: activity.type,
        name: activity.name,
        started_at: toLocalInput(new Date(activity.started_at)),
        distance_km: (activity.distance_m / 1000).toString(),
        duration: formatDuration(activity.duration_seconds),
        elevation_gain_m: activity.elevation_gain_m?.toString() ?? '',
        avg_hr: activity.avg_hr?.toString() ?? '',
        max_hr: activity.max_hr?.toString() ?? '',
        calories: activity.calories?.toString() ?? '',
        splits: (activity.splits ?? []).map((split) => ({
            label: split.label,
            distance_m: split.distance_m?.toString() ?? '',
            duration: formatDuration(split.duration_seconds),
        })),
    };
}

export function ActivityForm({
    types,
    hyroxSplits,
    activity,
}: {
    types: Option[];
    hyroxSplits: HyroxSplit[];
    activity?: Activity;
}) {
    const form = useForm<ActivityFormData>(() => initialData(activity));
    const { data } = form;
    const errors = form.errors as Record<string, string | undefined>;

    const distanceKm = parseNumber(data.distance_km);
    const durationSeconds = parseDuration(data.duration);
    const pace =
        distanceKm && durationSeconds
            ? Math.round(durationSeconds / distanceKm)
            : null;
    const isRun = RUN_TYPES.includes(data.type);
    const isHyrox = data.type === 'hyrox';
    const splitsSeconds = data.splits.reduce(
        (total, split) => total + (parseDuration(split.duration) ?? 0),
        0,
    );
    const splitsMeters = data.splits.reduce(
        (total, split) => total + (parseInteger(split.distance_m) ?? 0),
        0,
    );

    const setSplits = (splits: SplitRow[]) => form.setData('splits', splits);

    const updateSplit = (index: number, changes: Partial<SplitRow>) =>
        setSplits(
            data.splits.map((split, position) =>
                position === index ? { ...split, ...changes } : split,
            ),
        );

    const applyHyroxTemplate = () =>
        form.setData((current) => ({
            ...current,
            distance_km: current.distance_km || '8',
            splits: hyroxSplits.map((split) => ({
                label: split.label,
                distance_m: split.distance_m.toString(),
                duration: '',
            })),
        }));

    const generateKmSplits = () => {
        if (!distanceKm) {
            return;
        }

        const meters = Math.round(distanceKm * 1000);
        const fullKms = Math.floor(meters / 1000);
        const rest = meters - fullKms * 1000;
        const splits: SplitRow[] = Array.from(
            { length: fullKms },
            (_, index) => ({
                label: `Km ${index + 1}`,
                distance_m: '1000',
                duration: '',
            }),
        );

        if (rest > 0) {
            splits.push({
                label: `Km ${fullKms + 1} (${rest} m)`,
                distance_m: rest.toString(),
                duration: '',
            });
        }

        setSplits(splits);
    };

    const [showAllSplits, setShowAllSplits] = useState(false);
    const hasSplitErrors = Object.keys(errors).some((key) =>
        key.startsWith('splits.'),
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((values) => ({
            type: values.type,
            name: values.name.trim(),
            started_at: values.started_at
                ? new Date(values.started_at).toISOString()
                : null,
            distance_m: (() => {
                const km = parseNumber(values.distance_km);

                return km === null ? null : Math.round(km * 1000);
            })(),
            duration_seconds: parseDuration(values.duration),
            elevation_gain_m: parseInteger(values.elevation_gain_m),
            avg_hr: parseInteger(values.avg_hr),
            max_hr: parseInteger(values.max_hr),
            calories: parseInteger(values.calories),
            splits: values.splits
                .filter((split) => split.duration.trim() !== '')
                .map((split) => ({
                    label: split.label.trim(),
                    distance_m: parseInteger(split.distance_m),
                    duration_seconds: parseDuration(split.duration),
                })),
        }));

        if (activity) {
            form.put(activities.update.url(activity.id));
        } else {
            form.post(activities.store.url());
        }
    };

    const splitPaces = data.splits.map((split) => {
        const meters = parseInteger(split.distance_m);
        const seconds = parseDuration(split.duration);

        return meters && seconds ? seconds / (meters / 1000) : null;
    });
    const timedPaces = splitPaces.filter(
        (value): value is number => value !== null,
    );
    const fastestIndex =
        isRun && timedPaces.length > 1
            ? splitPaces.indexOf(Math.min(...timedPaces))
            : -1;
    const collapse =
        !showAllSplits && !hasSplitErrors && data.splits.length > 7;
    const visibleSplits = data.splits
        .map((split, index) => ({ split, index }))
        .filter(
            ({ index }) =>
                !collapse || index < 4 || index === data.splits.length - 1,
        );

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <div
                role="group"
                aria-label="Tipo"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
            >
                {types.map((type) => {
                    const selected = data.type === type.value;

                    return (
                        <button
                            key={type.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => form.setData('type', type.value)}
                            className={cn(
                                'h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                selected
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border hover:bg-accent',
                            )}
                        >
                            {type.label}
                        </button>
                    );
                })}
            </div>
            <InputError message={errors.type} />

            <div className="grid grid-cols-2 gap-3">
                <div className="grid content-start gap-1.5">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                        id="name"
                        className="h-14 rounded-xl text-base"
                        value={data.name}
                        maxLength={120}
                        placeholder={isHyrox ? 'Hyrox Madrid' : 'Tirada 10K'}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        required
                    />
                    <InputError message={errors.name} />
                </div>
                <div className="grid content-start gap-1.5">
                    <Label htmlFor="started_at">Fecha y hora</Label>
                    <Input
                        id="started_at"
                        type="datetime-local"
                        className="h-14 rounded-xl px-2 text-sm sm:px-3 sm:text-base"
                        value={data.started_at}
                        max={toLocalInput(new Date())}
                        onChange={(event) =>
                            form.setData('started_at', event.target.value)
                        }
                        required
                    />
                    <InputError message={errors.started_at} />
                </div>
            </div>

            <div className="grid gap-1.5">
                <NumberStepper
                    label="Distancia (km)"
                    size="md"
                    value={distanceKm ?? 0}
                    step={1}
                    min={0}
                    max={1000}
                    unit="km"
                    onChange={(value) =>
                        form.setData(
                            'distance_km',
                            value > 0 ? value.toString() : '',
                        )
                    }
                />
                <InputError message={errors.distance_m} />
            </div>

            <div className="flex items-end justify-between gap-3">
                <DurationBoxes
                    value={data.duration}
                    onChange={(value) => form.setData('duration', value)}
                />
                <div className="pb-1 text-right" aria-live="polite">
                    <div className="text-[13px] text-muted-foreground">
                        Ritmo
                    </div>
                    <div className="font-num text-2xl leading-none whitespace-nowrap text-primary-text tabular-nums sm:text-3xl">
                        {formatPace(pace)}
                    </div>
                </div>
            </div>
            <InputError className="-mt-3" message={errors.duration_seconds} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <NumberField
                    id="elevation_gain_m"
                    label="Desnivel (m)"
                    value={data.elevation_gain_m}
                    error={errors.elevation_gain_m}
                    onChange={(value) =>
                        form.setData('elevation_gain_m', value)
                    }
                />
                <NumberField
                    id="avg_hr"
                    label="Pulso medio"
                    value={data.avg_hr}
                    error={errors.avg_hr}
                    onChange={(value) => form.setData('avg_hr', value)}
                />
                <NumberField
                    id="max_hr"
                    label="Pulso máx."
                    value={data.max_hr}
                    error={errors.max_hr}
                    onChange={(value) => form.setData('max_hr', value)}
                />
                <NumberField
                    id="calories"
                    label="Calorías"
                    value={data.calories}
                    error={errors.calories}
                    onChange={(value) => form.setData('calories', value)}
                />
            </div>

            <section className="flex flex-col gap-3" aria-labelledby="splits">
                <div className="flex items-baseline justify-between gap-2">
                    <h2 id="splits" className="text-base font-bold">
                        Parciales
                    </h2>
                    <span className="text-[13px] text-muted-foreground">
                        {isHyrox
                            ? 'Tiempo de cada carrera y estación'
                            : data.splits.length > 0
                              ? 'Los vacíos no se guardan'
                              : 'Opcional'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {isRun && (
                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                'h-12 rounded-xl font-bold',
                                !isHyrox && 'col-span-2 sm:col-span-1',
                            )}
                            disabled={!distanceKm}
                            onClick={generateKmSplits}
                        >
                            Generar por km
                        </Button>
                    )}
                    {isHyrox && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-xl border-primary font-bold text-primary-text hover:text-primary-text"
                            onClick={applyHyroxTemplate}
                        >
                            Usar plantilla Hyrox
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            'h-12 rounded-xl',
                            !isRun && !isHyrox && 'col-span-2 justify-start',
                        )}
                        onClick={() =>
                            setSplits([
                                ...data.splits,
                                {
                                    label: `Parcial ${data.splits.length + 1}`,
                                    distance_m: '',
                                    duration: '',
                                },
                            ])
                        }
                    >
                        <Plus /> Añadir parcial
                    </Button>
                </div>

                {data.splits.length > 0 && (
                    <ol className="flex flex-col gap-1.5">
                        {visibleSplits.map(({ split, index }) => {
                            const fastest = index === fastestIndex;
                            const meters = parseInteger(split.distance_m);
                            const guess =
                                pace && meters
                                    ? formatDuration(
                                          Math.round((pace * meters) / 1000),
                                      )
                                    : 'm:ss';

                            return (
                                <li key={index} className="contents">
                                    {collapse &&
                                        index === data.splits.length - 1 && (
                                            <button
                                                type="button"
                                                className="flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                                onClick={() =>
                                                    setShowAllSplits(true)
                                                }
                                            >
                                                <span
                                                    className="w-5 text-muted-foreground"
                                                    aria-hidden
                                                >
                                                    …
                                                </span>
                                                {data.splits.length - 5}{' '}
                                                parciales más
                                                <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                                            </button>
                                        )}
                                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_3.75rem_4.5rem_2.75rem] items-center gap-1.5 rounded-lg bg-card py-1 pl-3">
                                        <span className="font-num text-xs text-muted-foreground tabular-nums">
                                            {index + 1}
                                        </span>
                                        <Input
                                            aria-label={`Nombre del parcial ${index + 1}`}
                                            className="h-11 border-transparent bg-transparent px-1.5 font-bold shadow-none dark:bg-transparent"
                                            value={split.label}
                                            maxLength={60}
                                            onChange={(event) =>
                                                updateSplit(index, {
                                                    label: event.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            aria-label={`Distancia del parcial ${index + 1} en metros`}
                                            className="h-11 border-transparent bg-transparent px-1 text-right text-xs text-muted-foreground tabular-nums shadow-none dark:bg-transparent"
                                            inputMode="numeric"
                                            placeholder="m"
                                            value={split.distance_m}
                                            onChange={(event) =>
                                                updateSplit(index, {
                                                    distance_m:
                                                        event.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            aria-label={`Tiempo del parcial ${index + 1}`}
                                            className={cn(
                                                'h-11 border-input bg-background px-1.5 text-right font-num text-base tabular-nums',
                                                fastest && 'text-primary-text',
                                            )}
                                            inputMode="numeric"
                                            placeholder={guess}
                                            value={split.duration}
                                            onChange={(event) =>
                                                updateSplit(index, {
                                                    duration:
                                                        event.target.value,
                                                })
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-11 text-muted-foreground"
                                            aria-label={`Quitar ${split.label || `parcial ${index + 1}`}`}
                                            onClick={() =>
                                                setSplits(
                                                    data.splits.filter(
                                                        (_, position) =>
                                                            position !== index,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 />
                                        </Button>
                                        {fastest && (
                                            <span className="col-start-2 col-end-6 -mt-1 pb-1 pl-1.5 text-xs font-bold text-primary-text">
                                                El más rápido
                                            </span>
                                        )}
                                        <InputError
                                            className="col-start-2 col-end-6 pb-1"
                                            message={
                                                errors[
                                                    `splits.${index}.duration_seconds`
                                                ] ??
                                                errors[`splits.${index}.label`]
                                            }
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}

                {data.splits.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3 text-sm">
                        <span>
                            Suma:{' '}
                            <strong className="font-num tabular-nums">
                                {splitsMeters > 0
                                    ? `${(splitsMeters / 1000).toLocaleString('es-ES')} km · `
                                    : ''}
                                {formatDuration(splitsSeconds)}
                            </strong>
                        </span>
                        <div className="flex gap-1">
                            {splitsSeconds > 0 &&
                                splitsSeconds !== durationSeconds && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11"
                                        onClick={() =>
                                            form.setData((current) => ({
                                                ...current,
                                                duration:
                                                    formatDuration(
                                                        splitsSeconds,
                                                    ),
                                                distance_km:
                                                    current.distance_km ||
                                                    (splitsMeters > 0
                                                        ? (
                                                              splitsMeters /
                                                              1000
                                                          ).toString()
                                                        : ''),
                                            }))
                                        }
                                    >
                                        Usar como tiempo total
                                    </Button>
                                )}
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-11 text-muted-foreground"
                                onClick={() => setSplits([])}
                            >
                                <Trash2 /> Quitar todos
                            </Button>
                        </div>
                    </div>
                )}
                <InputError message={errors.splits} />
            </section>

            <Button
                type="submit"
                size="workout"
                className="mt-2 w-full"
                disabled={form.processing}
            >
                {activity ? 'Guardar cambios' : 'Guardar carrera'}
            </Button>
        </form>
    );
}

function durationParts(value: string): [string, string, string] {
    const parts = value.split(':').slice(-3);

    while (parts.length < 3) {
        parts.unshift('');
    }

    return [parts[0], parts[1], parts[2]];
}

/**
 * Three boxes for h, mm and ss. Stored as "h:mm:ss" (parts may be empty).
 */
function DurationBoxes({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const parts = durationParts(value);
    const labels = ['Horas', 'Minutos', 'Segundos'];
    const placeholders = ['0', '00', '00'];

    const update = (position: number, next: string) => {
        const updated = [...parts];
        updated[position] = next.replace(/\D/g, '').slice(0, 2);
        onChange(updated.join(':'));
    };

    return (
        <fieldset className="flex min-w-0 flex-col gap-1.5">
            <legend className="mb-1.5 text-sm leading-none font-medium">
                Tiempo (h:mm:ss)
            </legend>
            <div className="flex items-center gap-1.5">
                {parts.map((part, position) => (
                    <div key={position} className="flex items-center gap-1.5">
                        {position > 0 && (
                            <span className="font-num text-xl" aria-hidden>
                                :
                            </span>
                        )}
                        <input
                            aria-label={labels[position]}
                            inputMode="numeric"
                            className="h-16 w-14 rounded-xl border border-input bg-transparent text-center font-num text-2xl tabular-nums outline-none placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-16"
                            placeholder={placeholders[position]}
                            value={part}
                            onFocus={(event) => event.currentTarget.select()}
                            onChange={(event) =>
                                update(position, event.target.value)
                            }
                        />
                    </div>
                ))}
            </div>
        </fieldset>
    );
}

function NumberField({
    id,
    label,
    value,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid content-start gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                className="h-14 rounded-xl text-center font-num text-xl tabular-nums"
                inputMode="numeric"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value.replace(/[^\d]/g, ''))
                }
            />
            <InputError message={error} />
        </div>
    );
}
