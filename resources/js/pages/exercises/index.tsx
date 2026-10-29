import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { ExerciseImage } from '@/components/exercise-image';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import exercises from '@/routes/exercises';
import type { Exercise, MuscleGroup, Option, Paginated } from '@/types';

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

    const goTo = (url: string | null) => {
        if (url) {
            router.get(url, undefined, { preserveState: true });
        }
    };

    return (
        <>
            <Head title="Ejercicios" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Ejercicios"
                        description="Explora la biblioteca y crea tus propios ejercicios."
                    />
                    <Button asChild>
                        <Link href={exercises.create()}>
                            <Plus /> Crear ejercicio
                        </Link>
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) =>
                                changeSearch(event.target.value)
                            }
                            placeholder="Buscar por nombre…"
                            className="pl-9"
                            type="search"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <FilterSelect
                            placeholder="Zona del cuerpo"
                            allLabel="Todas las zonas"
                            value={filters.zone}
                            options={zones}
                            onChange={(zone) => apply({ zone, muscle: null })}
                        />
                        <FilterSelect
                            placeholder="Músculo"
                            allLabel="Todos los músculos"
                            value={filters.muscle?.toString()}
                            options={visibleMuscles.map((muscle) => ({
                                value: muscle.id.toString(),
                                label: muscle.name,
                            }))}
                            onChange={(muscle) => apply({ muscle })}
                        />
                        <FilterSelect
                            placeholder="Categoría"
                            allLabel="Todas las categorías"
                            value={filters.category}
                            options={categories}
                            onChange={(category) => apply({ category })}
                        />
                        <FilterSelect
                            placeholder="Equipamiento"
                            allLabel="Todo el equipamiento"
                            value={filters.equipment}
                            options={equipment}
                            onChange={(value) => apply({ equipment: value })}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="mine"
                                checked={mine}
                                onCheckedChange={(checked) =>
                                    apply({ mine: checked || null })
                                }
                            />
                            <Label htmlFor="mine">Solo mis ejercicios</Label>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                                {page.total}{' '}
                                {page.total === 1 ? 'ejercicio' : 'ejercicios'}
                            </span>
                            {hasFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    <X /> Limpiar filtros
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {page.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
                        <Dumbbell className="size-10 text-muted-foreground" />
                        <div>
                            <p className="font-medium">
                                No encontramos ejercicios
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Prueba con otros filtros o crea tu propio
                                ejercicio.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={exercises.create()}>
                                <Plus /> Crear ejercicio
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {page.data.map((exercise) => (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                            />
                        ))}
                    </div>
                )}

                {page.last_page > 1 && (
                    <nav className="flex items-center justify-between gap-2 pt-2">
                        <Button
                            variant="outline"
                            disabled={!page.prev_page_url}
                            onClick={() => goTo(page.prev_page_url)}
                        >
                            <ChevronLeft /> Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {page.current_page} de {page.last_page}
                        </span>
                        <Button
                            variant="outline"
                            disabled={!page.next_page_url}
                            onClick={() => goTo(page.next_page_url)}
                        >
                            Siguiente <ChevronRight />
                        </Button>
                    </nav>
                )}
            </div>
        </>
    );
}

function FilterSelect({
    placeholder,
    allLabel,
    value,
    options,
    onChange,
}: {
    placeholder: string;
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
            <SelectTrigger className="w-full" aria-label={placeholder}>
                <SelectValue placeholder={placeholder} />
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

function ExerciseCard({ exercise }: { exercise: Exercise }) {
    return (
        <Link
            href={exercises.show(exercise.id)}
            prefetch
            className="group block"
        >
            <Card
                className={cn(
                    'h-full gap-0 overflow-hidden py-0 transition-shadow group-hover:shadow-md',
                    exercise.is_hyrox && 'ring-2 ring-yellow-400/70',
                )}
            >
                <div className="relative">
                    <ExerciseImage exercise={exercise} />
                    <Badge
                        className={cn(
                            'absolute top-2 left-2',
                            exercise.is_hyrox
                                ? 'bg-yellow-400 text-yellow-950'
                                : 'bg-background/90 text-foreground',
                        )}
                    >
                        {exercise.category_label}
                    </Badge>
                    {exercise.is_custom && (
                        <Badge
                            variant="secondary"
                            className="absolute top-2 right-2"
                        >
                            Propio
                        </Badge>
                    )}
                </div>
                <div className="space-y-2 p-3">
                    <p className="line-clamp-2 text-sm leading-tight font-medium">
                        {exercise.name}
                    </p>
                    {exercise.primary_muscles &&
                        exercise.primary_muscles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {exercise.primary_muscles
                                    .slice(0, 3)
                                    .map((muscle) => (
                                        <Badge
                                            key={muscle.id}
                                            variant="outline"
                                            className="text-[0.65rem]"
                                        >
                                            {muscle.name}
                                        </Badge>
                                    ))}
                            </div>
                        )}
                </div>
            </Card>
        </Link>
    );
}

ExercisesIndex.layout = {
    breadcrumbs: [{ title: 'Ejercicios', href: exercises.index() }],
};
