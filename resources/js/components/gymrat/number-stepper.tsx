import { Minus, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const numberFormat = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
});

type NumberStepperProps = {
    label: string;
    value: number;
    onChange: (value: number) => void;
    step?: number;
    min?: number;
    max?: number;
    unit?: string;
    /** "lg" = 64px for the set logger, "md" = 56px for forms. */
    size?: 'md' | 'lg';
    /** Narrower ± buttons (44px) so two steppers fit side by side on a phone. */
    compact?: boolean;
    className?: string;
};

/**
 * One-handed ± stepper. Tap = one step; press and hold repeats and speeds up.
 * Tapping the number opens the numeric keyboard to type a value.
 */
export function NumberStepper({
    label,
    value,
    onChange,
    step = 1,
    min = 0,
    max = 9999,
    unit,
    size = 'lg',
    compact = false,
    className,
}: NumberStepperProps) {
    const id = useId();
    const [draft, setDraft] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const clamp = (next: number) =>
        Math.min(max, Math.max(min, Math.round(next * 100) / 100));

    const change = (next: number) => {
        valueRef.current = clamp(next);
        onChange(valueRef.current);
    };

    const stopRepeat = () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }

        timer.current = null;
    };

    const startRepeat = (direction: 1 | -1) => {
        change(valueRef.current + direction * step);

        let delay = 400;
        const tick = () => {
            change(valueRef.current + direction * step);
            delay = Math.max(60, delay * 0.8);
            timer.current = setTimeout(tick, delay);
        };

        timer.current = setTimeout(tick, delay);
    };

    useEffect(() => stopRepeat, []);

    const height = size === 'lg' ? 'h-16' : 'h-14';
    const stepLabel = numberFormat.format(step);
    const buttonClass = cn(
        'grid shrink-0 place-items-center bg-secondary bg-knurl text-secondary-foreground',
        'transition-colors duration-[120ms] active:bg-border disabled:opacity-40',
        'focus-visible:relative focus-visible:z-10',
        compact ? 'w-11' : 'w-14',
        height,
    );
    const shown = draft ?? numberFormat.format(value);

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label
                htmlFor={id}
                className="text-xs font-semibold text-muted-foreground"
            >
                {label}
            </label>
            <div
                className={cn(
                    'flex items-stretch overflow-hidden rounded-lg border border-input',
                    height,
                )}
            >
                <button
                    type="button"
                    className={buttonClass}
                    aria-label={`Restar ${stepLabel}${unit ? ` ${unit}` : ''}`}
                    disabled={value <= min}
                    onPointerDown={(event) => {
                        event.preventDefault();
                        startRepeat(-1);
                    }}
                    onPointerUp={stopRepeat}
                    onPointerLeave={stopRepeat}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            change(value - step);
                        }
                    }}
                >
                    <Minus className="size-6" aria-hidden />
                </button>
                <div className="flex flex-1 items-center justify-center gap-1 px-1">
                    <input
                        id={id}
                        inputMode="decimal"
                        className={cn(
                            'h-full w-full min-w-0 bg-transparent text-center font-num leading-none outline-none',
                            compact && shown.length > 4
                                ? 'text-[22px]'
                                : 'text-[28px]',
                        )}
                        value={shown}
                        onFocus={(event) => {
                            setDraft(numberFormat.format(value));
                            event.currentTarget.select();
                        }}
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={() => {
                            const parsed = Number(
                                (draft ?? '')
                                    .replace(/\./g, '')
                                    .replace(',', '.'),
                            );

                            if (!Number.isNaN(parsed)) {
                                change(parsed);
                            }

                            setDraft(null);
                        }}
                    />
                    {unit && (
                        <span
                            className={cn(
                                '-ml-1 text-sm text-muted-foreground',
                                compact && 'sr-only',
                            )}
                        >
                            {unit}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className={buttonClass}
                    aria-label={`Sumar ${stepLabel}${unit ? ` ${unit}` : ''}`}
                    disabled={value >= max}
                    onPointerDown={(event) => {
                        event.preventDefault();
                        startRepeat(1);
                    }}
                    onPointerUp={stopRepeat}
                    onPointerLeave={stopRepeat}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            change(value + step);
                        }
                    }}
                >
                    <Plus className="size-6" aria-hidden />
                </button>
            </div>
        </div>
    );
}
