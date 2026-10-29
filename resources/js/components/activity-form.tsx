import { Link, useForm } from '@inertiajs/react';
import { Gauge, ListPlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDuration, formatPace, parseDuration } from '@/lib/format';
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

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Datos principales</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                            value={data.type}
                            onValueChange={(value) =>
                                form.setData('type', value)
                            }
                        >
                            <SelectTrigger id="type" className="h-11 w-full">
                                <SelectValue placeholder="Elige un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map((type) => (
                                    <SelectItem
                                        key={type.value}
                                        value={type.value}
                                    >
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="started_at">Fecha y hora</Label>
                        <Input
                            id="started_at"
                            type="datetime-local"
                            className="h-11"
                            value={data.started_at}
                            max={toLocalInput(new Date())}
                            onChange={(event) =>
                                form.setData('started_at', event.target.value)
                            }
                            required
                        />
                        <InputError message={errors.started_at} />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            className="h-11"
                            value={data.name}
                            maxLength={120}
                            placeholder={
                                isHyrox
                                    ? 'Hyrox Madrid'
                                    : 'Rodaje suave por el parque'
                            }
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="distance">Distancia (km)</Label>
                        <Input
                            id="distance"
                            className="h-11 text-lg tabular-nums"
                            inputMode="decimal"
                            placeholder="10,5"
                            value={data.distance_km}
                            onChange={(event) =>
                                form.setData('distance_km', event.target.value)
                            }
                            required
                        />
                        <InputError message={errors.distance_m} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="duration">Tiempo (h:mm:ss)</Label>
                        <Input
                            id="duration"
                            className="h-11 text-lg tabular-nums"
                            inputMode="numeric"
                            placeholder="0:52:30"
                            value={data.duration}
                            onChange={(event) =>
                                form.setData('duration', event.target.value)
                            }
                            required
                        />
                        <InputError message={errors.duration_seconds} />
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-3 sm:col-span-2">
                        <Gauge className="size-5 text-muted-foreground" />
                        <div>
                            <div className="text-xs text-muted-foreground">
                                Ritmo medio
                            </div>
                            <div className="text-lg font-semibold tabular-nums">
                                {formatPace(pace)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Más datos</CardTitle>
                    <CardDescription>Opcional</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                        label="FC media (ppm)"
                        value={data.avg_hr}
                        error={errors.avg_hr}
                        onChange={(value) => form.setData('avg_hr', value)}
                    />
                    <NumberField
                        id="max_hr"
                        label="FC máx. (ppm)"
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Parciales</CardTitle>
                    <CardDescription>
                        {isHyrox
                            ? 'Registra el tiempo de cada carrera y cada estación.'
                            : 'Tiempos por tramo (opcional).'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {isHyrox && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={applyHyroxTemplate}
                            >
                                <Sparkles /> Usar plantilla Hyrox
                            </Button>
                        )}
                        {isRun && (
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={!distanceKm}
                                onClick={generateKmSplits}
                            >
                                <ListPlus /> Generar parciales por km
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
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
                        {data.splits.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSplits([])}
                            >
                                <Trash2 /> Quitar todos
                            </Button>
                        )}
                    </div>

                    {data.splits.length > 0 && (
                        <div className="space-y-2">
                            <div className="hidden grid-cols-[1fr_6rem_7rem_2.5rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
                                <span>Tramo</span>
                                <span>Distancia (m)</span>
                                <span>Tiempo</span>
                                <span />
                            </div>
                            {data.splits.map((split, index) => {
                                const splitPace =
                                    parseInteger(split.distance_m) &&
                                    parseDuration(split.duration)
                                        ? Math.round(
                                              (parseDuration(split.duration) ??
                                                  0) /
                                                  ((parseInteger(
                                                      split.distance_m,
                                                  ) ?? 1) /
                                                      1000),
                                          )
                                        : null;

                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[1fr_5.5rem_2.5rem] gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_6rem_7rem_2.5rem] sm:border-0 sm:p-0"
                                    >
                                        <Input
                                            aria-label="Tramo"
                                            className="col-span-3 h-11 sm:col-span-1"
                                            value={split.label}
                                            maxLength={60}
                                            onChange={(event) =>
                                                updateSplit(index, {
                                                    label: event.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            aria-label="Distancia (m)"
                                            className="h-11 tabular-nums"
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
                                            aria-label="Tiempo"
                                            className="order-first col-span-3 h-11 text-base font-semibold tabular-nums sm:order-none sm:col-span-1"
                                            inputMode="numeric"
                                            placeholder={
                                                splitPace
                                                    ? formatPace(splitPace)
                                                    : 'm:ss'
                                            }
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
                                            className="size-11"
                                            aria-label="Quitar parcial"
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
                                        <InputError
                                            className="col-span-full"
                                            message={
                                                errors[
                                                    `splits.${index}.duration_seconds`
                                                ] ??
                                                errors[`splits.${index}.label`]
                                            }
                                        />
                                    </div>
                                );
                            })}

                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3 text-sm">
                                <span>
                                    Suma de parciales:{' '}
                                    <strong className="tabular-nums">
                                        {splitsMeters > 0
                                            ? `${(splitsMeters / 1000).toLocaleString('es-ES')} km · `
                                            : ''}
                                        {formatDuration(splitsSeconds)}
                                    </strong>
                                </span>
                                {splitsSeconds > 0 &&
                                    splitsSeconds !== durationSeconds && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
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
                            </div>
                        </div>
                    )}
                    <InputError message={errors.splits} />
                </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" size="lg" asChild>
                    <Link
                        href={
                            activity
                                ? activities.show(activity.id)
                                : activities.index()
                        }
                    >
                        Cancelar
                    </Link>
                </Button>
                <Button type="submit" size="lg" disabled={form.processing}>
                    {activity ? 'Guardar cambios' : 'Guardar carrera'}
                </Button>
            </div>
        </form>
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
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                className="h-11 tabular-nums"
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
