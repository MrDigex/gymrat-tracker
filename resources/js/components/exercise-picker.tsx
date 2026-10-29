import { usePage } from '@inertiajs/react';
import { Check, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import exercises from '@/routes/exercises';
import type { Exercise } from '@/types';

const CATEGORY_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'hyrox', label: 'Hyrox' },
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'powerlifting', label: 'Powerlifting' },
    { value: 'pliometria', label: 'Pliometría' },
    { value: 'estiramiento', label: 'Estiramiento' },
];

const ZONE_FILTERS = [
    { value: '', label: 'Todo el cuerpo' },
    { value: 'superior', label: 'Tren superior' },
    { value: 'inferior', label: 'Tren inferior' },
    { value: 'core', label: 'Core' },
];

/**
 * GET a JSON endpoint with the session cookie.
 */
export async function fetchJson<T>(url: string, signal?: AbortSignal) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        signal,
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted',
            )}
        >
            {children}
        </button>
    );
}

export function ExercisePicker({
    onSelect,
    trigger,
    title = 'Elegir ejercicio',
    excludeIds = [],
}: {
    onSelect: (exercise: Exercise) => void;
    trigger: ReactNode;
    title?: string;
    excludeIds?: number[];
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [zone, setZone] = useState('');
    const [muscle, setMuscle] = useState('');
    const { muscleGroups } = usePage().props;
    const muscleZones = ZONE_FILTERS.filter(
        (filter) =>
            filter.value &&
            (zone === '' || zone === filter.value) &&
            muscleGroups.some((group) => group.body_zone === filter.value),
    );

    const changeZone = (value: string) => {
        setZone(value);

        if (
            value &&
            muscleGroups.find((group) => String(group.id) === muscle)
                ?.body_zone !== value
        ) {
            setMuscle('');
        }
    };
    const [results, setResults] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(
            () => {
                setLoading(true);
                setFailed(false);

                fetchJson<Exercise[]>(
                    exercises.search.url({
                        query: {
                            search: search.trim() || undefined,
                            category: category || undefined,
                            zone: zone || undefined,
                            muscle: muscle || undefined,
                        },
                    }),
                    controller.signal,
                )
                    .then((data) => {
                        setResults(data);
                        setLoading(false);
                    })
                    .catch((error: unknown) => {
                        if (
                            error instanceof DOMException &&
                            error.name === 'AbortError'
                        ) {
                            return;
                        }

                        setFailed(true);
                        setLoading(false);
                    });
            },
            search ? 300 : 0,
        );

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [open, search, category, zone, muscle]);

    const select = (exercise: Exercise) => {
        onSelect(exercise);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="flex max-h-[90dvh] flex-col gap-3 p-4 sm:max-w-lg sm:p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Busca por nombre o filtra por categoría, zona y músculo.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative shrink-0">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        autoFocus
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar ejercicio…"
                        className="pl-9"
                    />
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                    {CATEGORY_FILTERS.map((filter) => (
                        <FilterChip
                            key={filter.value}
                            active={category === filter.value}
                            onClick={() => setCategory(filter.value)}
                        >
                            {filter.label}
                        </FilterChip>
                    ))}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                    {ZONE_FILTERS.map((filter) => (
                        <FilterChip
                            key={filter.value}
                            active={zone === filter.value}
                            onClick={() => changeZone(filter.value)}
                        >
                            {filter.label}
                        </FilterChip>
                    ))}
                </div>

                {muscleZones.length > 0 && (
                    <Select
                        value={muscle || 'all'}
                        onValueChange={(value) =>
                            setMuscle(value === 'all' ? '' : value)
                        }
                    >
                        <SelectTrigger
                            className="w-full shrink-0"
                            aria-label="Grupo muscular"
                        >
                            <SelectValue placeholder="Todos los músculos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todos los músculos
                            </SelectItem>
                            {muscleZones.map((filter) => (
                                <SelectGroup key={filter.value}>
                                    <SelectLabel>{filter.label}</SelectLabel>
                                    {muscleGroups
                                        .filter(
                                            (group) =>
                                                group.body_zone ===
                                                filter.value,
                                        )
                                        .map((group) => (
                                            <SelectItem
                                                key={group.id}
                                                value={String(group.id)}
                                            >
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <div className="-mx-2 min-h-48 flex-1 overflow-y-auto overscroll-contain">
                    {loading && results.length === 0 ? (
                        <div className="flex h-48 items-center justify-center">
                            <Spinner />
                        </div>
                    ) : failed ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            No se pudieron cargar los ejercicios. Inténtalo de
                            nuevo.
                        </p>
                    ) : results.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            No hay ejercicios que coincidan con tu búsqueda.
                        </p>
                    ) : (
                        <ul
                            className={cn(
                                'space-y-1 transition-opacity',
                                loading && 'opacity-60',
                            )}
                        >
                            {results.map((exercise) => {
                                const added = excludeIds.includes(exercise.id);

                                return (
                                    <li key={exercise.id}>
                                        <button
                                            type="button"
                                            disabled={added}
                                            onClick={() => select(exercise)}
                                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <ExerciseImage
                                                exercise={exercise}
                                                animate={false}
                                                className="h-12 w-[4.5rem] shrink-0 rounded-md [&_svg]:size-5"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">
                                                    {exercise.name}
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {exercise.primary_muscles
                                                        ?.map(
                                                            (muscle) =>
                                                                muscle.name,
                                                        )
                                                        .join(', ') ||
                                                        exercise.category_label}
                                                </span>
                                            </span>
                                            {added ? (
                                                <Badge variant="secondary">
                                                    <Check /> Añadido
                                                </Badge>
                                            ) : (
                                                exercise.is_hyrox && (
                                                    <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-400">
                                                        Hyrox
                                                    </Badge>
                                                )
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
