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
export function TargetMetBanner({ children }: { children?: ReactNode }) {
    return (
        <div className="animate-pop overflow-hidden rounded-lg bg-primary text-primary-foreground">
            <div className="h-1 bg-hazard" />
            <p className="flex items-center gap-2 px-3.5 py-2.5">
                <Check className="size-5" strokeWidth={3} aria-hidden />
                <span className="font-num text-[17px] uppercase">
                    {children ?? '¡Objetivo cumplido!'}
                </span>
            </p>
        </div>
    );
}
