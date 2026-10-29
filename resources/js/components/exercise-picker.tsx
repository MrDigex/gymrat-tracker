import { usePage } from '@inertiajs/react';
import { Check, MousePointerClick, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import { ResponsivePanel } from '@/components/responsive-panel';
import { Badge } from '@/components/ui/badge';
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
import { useIsMobile } from '@/hooks/use-mobile';
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
            aria-pressed={active}
            className={cn(
                'min-h-10 shrink-0 rounded-full border px-3.5 text-[13px] font-bold transition-colors md:min-h-9',
                active
                    ? 'border-foreground bg-foreground text-background'
                    : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}

export type PickerControls = {
    /** Back to the list (phones) or clear the selection (desktop). */
    back: () => void;
    close: () => void;
    /**
     * "split": shown in the right pane of the desktop dialog, next to the
     * list. "stacked": replaces the list (phones).
     */
    layout: 'split' | 'stacked';
};

/**
 * Exercise search with filters. With `renderSelected` it becomes a two-step
 * flow: a bottom sheet that moves to the second step on phones, and a
 * two-pane dialog (list on the left, second step on the right) on desktop.
 */
export function ExercisePicker({
    onSelect,
    trigger,
    title = 'Elegir ejercicio',
    excludeIds = [],
    renderSelected,
}: {
    onSelect?: (exercise: Exercise) => void;
    trigger: ReactNode;
    title?: string;
    excludeIds?: number[];
    /**
     * Second step shown in the same panel after choosing an exercise
     * (instead of closing the picker).
     */
    renderSelected?: (
        exercise: Exercise,
        controls: PickerControls,
    ) => ReactNode;
}) {
    const isMobile = useIsMobile();
    const split = Boolean(renderSelected) && !isMobile;
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Exercise | null>(null);
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
        onSelect?.(exercise);

        if (renderSelected) {
            setSelected(exercise);
        } else {
            setOpen(false);
        }
    };

    const changeOpen = (value: boolean) => {
        setOpen(value);

        if (!value) {
            setSelected(null);
        }
    };

    const list = (
        <>
            <div className="relative shrink-0">
                <Search
                    className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
                <Input
                    autoFocus
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar ejercicio…"
                    aria-label="Buscar ejercicio"
                    className="h-12 rounded-lg pl-10 text-base"
                />
            </div>

            <div className="-mx-1 flex shrink-0 [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-0.5">
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
            <div className="-mx-1 flex shrink-0 [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-0.5">
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

            {muscleZones.length > 0 && (
                <Select
                    value={muscle || 'all'}
                    onValueChange={(value) =>
                        setMuscle(value === 'all' ? '' : value)
                    }
                >
                    <SelectTrigger
                        className={cn(
                            'h-10 w-full shrink-0 rounded-lg font-bold',
                            muscle && 'border-foreground',
                        )}
                        aria-label="Grupo muscular"
                    >
                        <SelectValue placeholder="Todos los músculos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los músculos</SelectItem>
                        {muscleZones.map((filter) => (
                            <SelectGroup key={filter.value}>
                                <SelectLabel>{filter.label}</SelectLabel>
                                {muscleGroups
                                    .filter(
                                        (group) =>
                                            group.body_zone === filter.value,
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

            <div className="-mx-1 min-h-48 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
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
                            'space-y-1.5 transition-opacity',
                            loading && 'opacity-60',
                        )}
                    >
                        {results.map((exercise) => {
                            const added = excludeIds.includes(exercise.id);
                            const isSelected = selected?.id === exercise.id;

                            return (
                                <li key={exercise.id}>
                                    <button
                                        type="button"
                                        disabled={added}
                                        onClick={() => select(exercise)}
                                        aria-pressed={
                                            split ? isSelected : undefined
                                        }
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg border-2 border-transparent bg-muted/60 p-1.5 pr-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
                                            isSelected &&
                                                split &&
                                                'border-primary bg-muted',
                                        )}
                                    >
                                        <ExerciseImage
                                            exercise={exercise}
                                            animate={false}
                                            className="h-12 w-[4.5rem] shrink-0 rounded-md [&_svg]:size-5"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold">
                                                {exercise.name}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {exercise.primary_muscles
                                                    ?.map(
                                                        (muscle) => muscle.name,
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
                                                <Badge className="bg-primary text-primary-foreground hover:bg-primary">
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
        </>
    );

    if (split && renderSelected) {
        return (
            <ResponsivePanel
                open={open}
                onOpenChange={changeOpen}
                trigger={trigger}
                title={title}
                description="Busca por nombre o filtra por zona, categoría y músculo."
                aside={
                    selected ? (
                        <>
                            <h3 className="shrink-0 pr-8 font-num text-xl leading-tight uppercase">
                                {selected.name}
                            </h3>
                            <div className="min-h-0 flex-1">
                                {renderSelected(selected, {
                                    back: () => setSelected(null),
                                    close: () => changeOpen(false),
                                    layout: 'split',
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                            <img
                                src={MASCOT_SRC}
                                alt=""
                                className="size-28 rounded-2xl object-cover opacity-90"
                            />
                            <p className="flex max-w-64 items-center gap-2 text-sm text-muted-foreground">
                                <MousePointerClick
                                    className="size-4 shrink-0"
                                    aria-hidden
                                />
                                Elige un ejercicio de la lista y tu coach te
                                propondrá series, repeticiones y peso.
                            </p>
                        </div>
                    )
                }
            >
                {list}
            </ResponsivePanel>
        );
    }

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={changeOpen}
            trigger={trigger}
            title={selected ? `Añadir ${selected.name}` : title}
            description={
                selected
                    ? undefined
                    : 'Busca por nombre o filtra por zona, categoría y músculo.'
            }
        >
            {selected && renderSelected ? (
                <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                    {renderSelected(selected, {
                        back: () => setSelected(null),
                        close: () => changeOpen(false),
                        layout: 'stacked',
                    })}
                </div>
            ) : (
                list
            )}
        </ResponsivePanel>
    );
}
