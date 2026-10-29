import { Head, Link, router } from '@inertiajs/react';
import { Check, ChevronDown, Dumbbell, Plus, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import { MuscleChip, zoneStyle } from '@/components/exercises/muscle-chip';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import exercises from '@/routes/exercises';
import type {
    BodyZone,
    Exercise,
    MuscleGroup,
    Option,
    Paginated,
} from '@/types';

type Filters = {
    search?: string | null;
    zone?: string | null;
    muscle?: string | number | null;
    category?: string | null;
    equipment?: string | null;
    mine?: string | boolean | null;
};

const ALL = 'all';

export default function ExercisesIndex({
    exercises: page,
    filters,
    muscleGroups,
    categories,
    zones,
    equipment,
}: {
    exercises: Paginated<Exercise>;
    filters: Filters;
    muscleGroups: MuscleGroup[];
    categories: Option[];
    trackingTypes: Option[];
    zones: Option[];
    equipment: Option[];
    levels: Option[];
    mechanics: Option[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const mine = filters.mine === true || filters.mine === '1';

    // "Cargar más" appends the next server page to the cards already shown.
    const [items, setItems] = useState(page.data);
    const [shownPage, setShownPage] = useState(page);
    const [appending, setAppending] = useState(false);

    if (page !== shownPage) {
        setShownPage(page);
        setAppending(false);
        setItems((current) => {
            if (!appending) {
                return page.data;
            }

            const seen = new Set(current.map((exercise) => exercise.id));

            return [
                ...current,
                ...page.data.filter((exercise) => !seen.has(exercise.id)),
            ];
        });
    }

    const apply = (changes: Partial<Filters>) => {
        const next = { ...filters, ...changes };
        const query = Object.fromEntries(
            Object.entries(next).filter(
                ([, value]) =>
                    value !== null &&
                    value !== undefined &&
                    value !== '' &&
                    value !== false,
            ),
        ) as Record<string, string | number | boolean>;

        if (query.mine === true) {
            query.mine = 1;
        }

        router.get(exercises.index.url({ query }), undefined, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const searchTimeout = useRef<number | undefined>(undefined);

    const changeSearch = (value: string) => {
        setSearch(value);
        window.clearTimeout(searchTimeout.current);
        searchTimeout.current = window.setTimeout(
            () => apply({ search: value.trim() || null }),
            350,
        );
    };

    const visibleMuscles = filters.zone
        ? muscleGroups.filter((muscle) => muscle.body_zone === filters.zone)
        : muscleGroups;
    const muscleOptions = visibleMuscles.map((muscle) => ({
        value: muscle.id.toString(),
        label: muscle.name,
    }));
    const muscleZones = new Map(
        muscleGroups.map((muscle) => [muscle.id, muscle.body_zone]),
    );

    const hasFilters = Boolean(
        filters.search ||
        filters.zone ||
        filters.muscle ||
        filters.category ||
        filters.equipment ||
        mine,
    );

    const clearFilters = () => {
        window.clearTimeout(searchTimeout.current);
        setSearch('');
        router.get(exercises.index.url(), undefined, {
            preserveState: true,
            replace: true,
        });
    };

    const loadMore = () => {
        if (!page.next_page_url) {
            return;
        }

        setAppending(true);
        router.get(page.next_page_url, undefined, {
            only: ['exercises'],
            preserveState: true,
            preserveScroll: true,
            preserveUrl: true,
            onError: () => setAppending(false),
            onCancel: () => setAppending(false),
        });
    };

    const remaining = page.total - (page.to ?? 0);
    const startsMidway = page.current_page > 1 && items === page.data;
    const countLabel = `${page.total} ${page.total === 1 ? 'ejercicio' : 'ejercicios'}`;

    const zoneFilter = (
        <FilterChip
            label="Zona"
            value={filters.zone}
            options={zones}
            onChange={(zone) => apply({ zone, muscle: null })}
            zone={filters.zone as BodyZone | null}
        />
    );

    return (
        <>
            <Head title="Ejercicios" />

            <div className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-6 lg:gap-6 lg:px-9 lg:pt-6">
                <header className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="font-num text-[34px] leading-none uppercase lg:text-[48px]">
                            Ejercicios
                        </h1>
                        <p className="mt-2 hidden text-muted-foreground lg:block">
                            Explora la biblioteca y crea tus propios ejercicios.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="h-12 rounded-lg px-4 text-base font-bold lg:h-12 lg:px-5"
                    >
                        <Link href={exercises.create()}>
                            <Plus className="size-5" />
                            <span className="lg:hidden">Crear</span>
                            <span className="hidden lg:inline">
                                Crear ejercicio
                            </span>
                        </Link>
                    </Button>
                </header>

                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-6">
                    <aside
                        aria-label="Filtros"
                        className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-4 lg:gap-5"
                    >
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                                aria-hidden
                            />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    changeSearch(event.target.value)
                                }
                                placeholder="Buscar por nombre"
                                aria-label="Buscar por nombre"
                                className="h-12 rounded-lg bg-card pl-11 text-base md:text-base"
                                type="search"
                            />
                        </div>

                        {/* Phone: one row of dropdown chips */}
                        <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
                            {zoneFilter}
                            <FilterChip
                                label="Músculo"
                                value={filters.muscle?.toString()}
                                options={muscleOptions}
                                onChange={(muscle) => apply({ muscle })}
                            />
                            <FilterChip
                                label="Categoría"
                                value={filters.category}
                                options={categories}
                                onChange={(category) => apply({ category })}
                            />
                            <FilterChip
                                label="Equipo"
                                value={filters.equipment}
                                options={equipment}
                                onChange={(value) =>
                                    apply({ equipment: value })
                                }
                            />
                        </div>

                        {/* Desktop: full filter panel */}
                        <fieldset className="hidden space-y-1 lg:block">
                            <legend className="mb-2 text-sm font-bold text-muted-foreground">
                                Zona
                            </legend>
                            {zones.map((zone) => {
                                const checked = filters.zone === zone.value;

                                return (
                                    <label
                                        key={zone.value}
                                        style={zoneStyle(
                                            zone.value as BodyZone,
                                        )}
                                        className="flex h-10 cursor-pointer items-center gap-3 rounded-md text-[15px] font-medium has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                                    >
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={checked}
                                            onChange={() =>
                                                apply({
                                                    zone: checked
                                                        ? null
                                                        : zone.value,
                                                    muscle: null,
                                                })
                                            }
                                        />
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'grid size-6 place-items-center rounded-[6px] border-2',
                                                checked
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-foreground/30 bg-background',
                                            )}
                                        >
                                            {checked && (
                                                <Check
                                                    className="size-4"
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </span>
                                        <span
                                            aria-hidden
                                            className="size-2.5 rounded-full bg-(--zone)"
                                        />
                                        {zone.label}
                                    </label>
                                );
                            })}
                        </fieldset>

                        <fieldset className="hidden lg:block">
                            <legend className="mb-2 text-sm font-bold text-muted-foreground">
                                Categoría
                            </legend>
                            <div className="flex flex-wrap gap-1.5">
                                {categories.map((category) => {
                                    const active =
                                        filters.category === category.value;

                                    return (
                                        <button
                                            key={category.value}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() =>
                                                apply({
                                                    category: active
                                                        ? null
                                                        : category.value,
                                                })
                                            }
                                            className={cn(
                                                'h-10 rounded-full border px-3 text-sm font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                                active
                                                    ? 'border-foreground bg-foreground text-background'
                                                    : category.value === 'hyrox'
                                                      ? 'border-primary text-primary-text hover:bg-accent'
                                                      : 'border-border hover:bg-muted',
                                            )}
                                        >
                                            {category.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="hidden space-y-2 lg:block">
                            <Label
                                htmlFor="filter-muscle"
                                className="font-bold text-muted-foreground"
                            >
                                Músculo
                            </Label>
                            <FilterSelect
                                id="filter-muscle"
                                allLabel="Todos"
                                value={filters.muscle?.toString()}
                                options={muscleOptions}
                                onChange={(muscle) => apply({ muscle })}
                            />
                        </div>

                        <div className="hidden space-y-2 lg:block">
                            <Label
                                htmlFor="filter-equipment"
                                className="font-bold text-muted-foreground"
                            >
                                Equipamiento
                            </Label>
                            <FilterSelect
                                id="filter-equipment"
                                allLabel="Todo"
                                value={filters.equipment}
                                options={equipment}
                                onChange={(value) =>
                                    apply({ equipment: value })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="mine"
                                    checked={mine}
                                    onCheckedChange={(checked) =>
                                        apply({ mine: checked || null })
                                    }
                                    className="h-7 w-12 [&>span]:size-6 [&>span]:data-[state=checked]:translate-x-5"
                                />
                                <Label
                                    htmlFor="mine"
                                    className="text-[15px] font-bold"
                                >
                                    Solo mis ejercicios
                                </Label>
                            </div>
                            <span className="text-sm text-muted-foreground lg:hidden">
                                {countLabel}
                            </span>
                        </div>
                    </aside>

                    <section className="flex min-w-0 flex-col gap-3">
                        <div className="flex items-center justify-between gap-3 max-lg:hidden">
                            <span className="text-[15px] text-muted-foreground">
                                {countLabel}
                            </span>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-sm text-[15px] font-semibold underline underline-offset-4 outline-none hover:text-primary-text focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>

                        {startsMidway && (
                            <button
                                type="button"
                                onClick={() => apply({})}
                                className="self-start text-sm font-semibold underline underline-offset-4"
                            >
                                Ver desde el principio
                            </button>
                        )}

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
                                <Dumbbell className="size-10 text-muted-foreground" />
                                <div>
                                    <p className="font-bold">
                                        No encontramos ejercicios
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Prueba con otros filtros o crea tu
                                        propio ejercicio.
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={exercises.create()}>
                                        <Plus /> Crear ejercicio
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:gap-3.5 xl:grid-cols-4">
                                {items.map((exercise) => (
                                    <li key={exercise.id}>
                                        <ExerciseCard
                                            exercise={exercise}
                                            muscleZones={muscleZones}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}

                        {page.next_page_url && (
                            <Button
                                variant="outline"
                                onClick={loadMore}
                                disabled={appending}
                                className="mt-2 h-12 self-center rounded-lg border-border bg-transparent px-6 text-[15px] font-bold"
                            >
                                {appending && <Spinner />}
                                Cargar {Math.min(page.per_page, remaining)} más
                            </Button>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

/**
 * Phone filter: a pill that opens a radio menu. When a value is selected it
 * shows the value and a separate × to clear it.
 */
function FilterChip({
    label,
    value,
    options,
    onChange,
    zone,
}: {
    label: string;
    value: string | null | undefined;
    options: Option[];
    onChange: (value: string | null) => void;
    zone?: BodyZone | null;
}) {
    const selected = options.find((option) => option.value === value);

    return (
        <div
            style={zone ? zoneStyle(zone) : undefined}
            className={cn(
                'flex h-11 shrink-0 items-center rounded-full border text-sm font-bold',
                selected
                    ? zone
                        ? 'border-(--zone) bg-(--zone)/20'
                        : 'border-foreground bg-foreground text-background'
                    : 'border-border bg-transparent',
            )}
        >
            <DropdownMenu>
                <DropdownMenuTrigger
                    className={cn(
                        'flex h-full items-center gap-1 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        selected ? 'pr-1 pl-4' : 'px-4',
                    )}
                    aria-label={
                        selected ? `${label}: ${selected.label}` : label
                    }
                >
                    {selected ? selected.label : label}
                    {!selected && (
                        <ChevronDown className="size-3.5" aria-hidden />
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    className="max-h-80 overflow-y-auto"
                >
                    <DropdownMenuRadioGroup
                        value={value ?? ALL}
                        onValueChange={(next) =>
                            onChange(next === ALL ? null : next)
                        }
                    >
                        <DropdownMenuRadioItem value={ALL}>
                            {label === 'Equipo' ? 'Todo' : 'Todos'}
                        </DropdownMenuRadioItem>
                        {options.map((option) => (
                            <DropdownMenuRadioItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            {selected && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    aria-label={`Quitar filtro de ${label.toLowerCase()}`}
                    className="grid h-full w-9 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <X className="size-4" strokeWidth={3} aria-hidden />
                </button>
            )}
        </div>
    );
}

function FilterSelect({
    id,
    allLabel,
    value,
    options,
    onChange,
}: {
    id: string;
    allLabel: string;
    value: string | null | undefined;
    options: Option[];
    onChange: (value: string | null) => void;
}) {
    return (
        <Select
            value={value || ALL}
            onValueChange={(next) => onChange(next === ALL ? null : next)}
        >
            <SelectTrigger
                id={id}
                className="h-12! w-full rounded-lg bg-card font-semibold"
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL}>{allLabel}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function muscleSummary(exercise: Exercise): string {
    return (exercise.primary_muscles ?? [])
        .map((muscle, index) =>
            index === 0 ? muscle.name : muscle.name.toLowerCase(),
        )
        .join(', ');
}

function ExerciseCard({
    exercise,
    muscleZones,
}: {
    exercise: Exercise;
    muscleZones: Map<number, BodyZone>;
}) {
    if (exercise.is_hyrox) {
        return (
            <Link
                href={exercises.show(exercise.id)}
                prefetch
                className="flex h-full flex-col overflow-hidden rounded-xl bg-primary text-primary-foreground outline-none hover:shadow-float focus-visible:ring-[3px] focus-visible:ring-ring/60"
            >
                <ExerciseImage
                    exercise={exercise}
                    animate={false}
                    className="aspect-[4/3] bg-[#18181b] object-left"
                />
                <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-[15px] leading-tight font-extrabold">
                        {exercise.name}
                    </p>
                    {exercise.primary_muscles &&
                        exercise.primary_muscles.length > 0 && (
                            <p className="line-clamp-2 text-xs font-semibold opacity-80">
                                {muscleSummary(exercise)}
                            </p>
                        )}
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={exercises.show(exercise.id)}
            prefetch
            className="group flex h-full flex-col overflow-hidden rounded-xl bg-card outline-none hover:shadow-float focus-visible:ring-[3px] focus-visible:ring-ring/60"
        >
            <div className="relative">
                <ExerciseImage exercise={exercise} className="aspect-[4/3]" />
                <span className="absolute top-2 left-2 rounded-sm bg-[#18181b] px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                    {exercise.category_label}
                </span>
                {exercise.is_custom && (
                    <span className="absolute top-2 right-2 rounded-sm bg-primary px-1.5 py-0.5 text-[11px] font-extrabold text-primary-foreground">
                        Propio
                    </span>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-[15px] leading-tight font-bold">
                    {exercise.name}
                </p>
                {exercise.primary_muscles &&
                    exercise.primary_muscles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {exercise.primary_muscles
                                .slice(0, 2)
                                .map((muscle) => (
                                    <MuscleChip
                                        key={muscle.id}
                                        zone={muscleZones.get(muscle.id)}
                                    >
                                        {muscle.name}
                                    </MuscleChip>
                                ))}
                        </div>
                    )}
            </div>
        </Link>
    );
}

ExercisesIndex.layout = {
    breadcrumbs: [{ title: 'Ejercicios', href: exercises.index() }],
};
