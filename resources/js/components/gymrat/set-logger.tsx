import { Check, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Logged set row: warm-up, target met and personal record states.
 */
export function SetRow({
    index,
    summary,
    rpe,
    warmup,
    targetMet,
    personalRecord,
    onEdit,
}: {
    index: number;
    /** Formatted set, e.g. "60 kg × 10" or "1:30". */
    summary: string;
    rpe?: number | null;
    warmup?: boolean;
    targetMet?: boolean;
    personalRecord?: boolean;
    onEdit?: () => void;
}) {
    const tone = warmup
        ? 'text-muted-foreground'
        : personalRecord
          ? 'bg-primary text-primary-foreground'
          : targetMet
            ? 'bg-primary/12 text-amber-800 dark:text-amber-200'
            : 'bg-muted';

    return (
        <button
            type="button"
            onClick={onEdit}
            className={cn(
                'grid h-11 w-full grid-cols-[36px_1fr_44px_24px] items-center gap-2 rounded-[10px] px-2.5 text-left',
                'transition-transform duration-[120ms] active:scale-[.99]',
                tone,
            )}
            aria-label={`Serie ${warmup ? 'de calentamiento' : index}: ${summary}. Toca para editar`}
        >
            {warmup ? (
                <span className="rounded-md border border-dashed border-current text-center text-xs font-bold">
                    C
                </span>
            ) : (
                <span className="text-center font-num text-[15px]">
                    {index}
                </span>
            )}
            <span className="truncate font-num text-lg">{summary}</span>
            <span className="text-[13px] font-bold">
                {rpe ? `@${rpe}` : '—'}
            </span>
            {personalRecord ? (
                <Star
                    className="size-5 fill-current"
                    aria-label="Récord personal"
                />
            ) : targetMet ? (
                <Check
                    className="size-5"
                    strokeWidth={3}
                    aria-label="Objetivo cumplido"
                />
            ) : (
                <span />
            )}
        </button>
    );
}

export function WarmupToggle({
    pressed,
    onToggle,
}: {
    pressed: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onToggle}
            className={cn(
                'h-9 rounded-full border px-3 text-[13px] font-bold transition-colors duration-[120ms]',
                pressed
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-input text-muted-foreground',
            )}
        >
            Calentamiento
        </button>
    );
}

export function RpePicker({
    value,
    onChange,
}: {
    value: number | null;
    onChange: (value: number | null) => void;
}) {
    return (
        <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">
                RPE (opcional)
            </legend>
            <div className="grid grid-cols-5 gap-1.5">
                {[6, 7, 8, 9, 10].map((option) => (
                    <button
                        key={option}
                        type="button"
                        aria-pressed={value === option}
                        onClick={() =>
                            onChange(value === option ? null : option)
                        }
                        className={cn(
                            'h-11 rounded-[10px] border font-num text-base transition-colors duration-[120ms]',
                            value === option
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-input bg-muted',
                        )}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

/**
 * "¡Objetivo cumplido!" banner with the hazard stripe.
 */
export function TargetMetBanner({
    children,
    detail,
}: {
    children?: ReactNode;
    /** Short text on the right, e.g. "9 reps @ 67,5". */
    detail?: ReactNode;
}) {
    return (
        <div className="animate-pop overflow-hidden rounded-lg bg-primary text-primary-foreground">
            <div className="h-1.5 bg-hazard" />
            <p className="flex items-center gap-2 px-3.5 py-2.5">
                <Check
                    className="size-5 shrink-0"
                    strokeWidth={3}
                    aria-hidden
                />
                <span className="flex-1 font-num text-[17px] leading-tight uppercase">
                    {children ?? '¡Objetivo cumplido!'}
                </span>
                {detail && (
                    <span className="max-w-[45%] text-right text-[13px] leading-tight font-bold">
                        {detail}
                    </span>
                )}
            </p>
        </div>
    );
}

export type SetsTableRow = {
    key: number | string;
    /** Working set number; ignored for warm-ups (shown as "C"). */
    index: number;
    values: string[];
    rpe?: number | null;
    warmup?: boolean;
    targetMet?: boolean;
    personalRecord?: boolean;
    /** Accessible description of the set, e.g. "60 kg × 10". */
    summary: string;
    onEdit?: () => void;
};

/**
 * Sets of one exercise as a table: SERIE / values / RPE / status. Logged rows
 * are tinted; `planned` adds dashed empty rows for the sets still to do.
 */
export function SetsTable({
    columns,
    rows,
    planned = 0,
    nextIndex,
    className,
}: {
    columns: string[];
    rows: SetsTableRow[];
    planned?: number;
    /** Number of the first planned row. */
    nextIndex?: number;
    className?: string;
}) {
    const grid = {
        gridTemplateColumns: `44px repeat(${columns.length}, minmax(0, 1fr)) 40px 28px`,
    };
    const firstPlanned =
        nextIndex ?? rows.filter((row) => !row.warmup).length + 1;

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <div
                className="grid items-center gap-2 px-2.5 text-[13px] font-bold tracking-wide text-muted-foreground uppercase"
                style={grid}
                aria-hidden
            >
                <span>Serie</span>
                {columns.map((column) => (
                    <span key={column}>{column}</span>
                ))}
                <span>RPE</span>
                <span />
            </div>
            <ul
                className="flex flex-col gap-1.5"
                aria-label="Series registradas"
            >
                {rows.map((row) => (
                    <li key={row.key}>
                        <button
                            type="button"
                            onClick={row.onEdit}
                            disabled={!row.onEdit}
                            style={grid}
                            aria-label={`Serie ${row.warmup ? 'de calentamiento' : row.index}: ${row.summary}${row.rpe ? `, RPE ${row.rpe}` : ''}${row.personalRecord ? '. Récord personal' : row.targetMet ? '. Objetivo cumplido' : ''}${row.onEdit ? '. Toca para editar' : ''}`}
                            className={cn(
                                'grid min-h-12 w-full items-center gap-2 rounded-[10px] px-2.5 text-left',
                                'transition-transform duration-[120ms] active:scale-[.99] disabled:active:scale-100',
                                row.warmup
                                    ? 'text-muted-foreground'
                                    : row.personalRecord
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-primary/12 text-amber-800 dark:text-primary',
                            )}
                        >
                            <span className="font-num text-[15px]">
                                {row.warmup ? 'C' : row.index}
                            </span>
                            {row.values.map((value, position) => (
                                <span
                                    key={position}
                                    className="truncate font-num text-lg"
                                >
                                    {value}
                                </span>
                            ))}
                            <span className="text-[13px] font-bold">
                                {row.rpe ?? '—'}
                            </span>
                            {row.personalRecord ? (
                                <Star
                                    className="size-5 fill-current"
                                    aria-hidden
                                />
                            ) : row.targetMet ? (
                                <Check
                                    className="size-5"
                                    strokeWidth={3}
                                    aria-hidden
                                />
                            ) : (
                                <span />
                            )}
                        </button>
                    </li>
                ))}
                {Array.from({ length: planned }, (_, offset) => (
                    <li
                        key={`planned-${offset}`}
                        style={grid}
                        className="grid min-h-12 items-center gap-2 rounded-[10px] border border-dashed border-input px-2.5 text-muted-foreground/70"
                    >
                        <span className="font-num text-[15px]">
                            {firstPlanned + offset}
                        </span>
                        {columns.map((column) => (
                            <span key={column}>—</span>
                        ))}
                        <span />
                        <span className="sr-only">pendiente</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
