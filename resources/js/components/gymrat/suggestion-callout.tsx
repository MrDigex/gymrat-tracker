import type { LucideIcon } from 'lucide-react';
import {
    ArrowUp,
    Plus,
    Sparkles,
    Timer,
    TriangleAlert,
    Weight,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Suggestion, SuggestionReason } from '@/types';

const REASONS: Record<
    SuggestionReason,
    { label: string; icon: LucideIcon; swatch: string }
> = {
    first_time: {
        label: 'Primera vez',
        icon: Sparkles,
        swatch: 'bg-tip-first',
    },
    increase_weight: {
        label: 'Sube el peso',
        icon: ArrowUp,
        swatch: 'bg-tip-weight',
    },
    increase_reps: {
        label: 'Suma repeticiones',
        icon: Plus,
        swatch: 'bg-tip-reps',
    },
    add_load: { label: 'Añade lastre', icon: Weight, swatch: 'bg-tip-load' },
    increase_time: { label: 'Aguanta más', icon: Timer, swatch: 'bg-tip-hold' },
    decrease_time: { label: 'Más rápido', icon: Zap, swatch: 'bg-tip-faster' },
    deload: {
        label: 'Semana de descarga',
        icon: TriangleAlert,
        swatch: 'bg-tip-deload',
    },
};

export const MASCOT_SRC = '/images/mascot-ink.png';

/**
 * Coach suggestion. "inline" sits inside an exercise card; "coach" is the
 * speech bubble with the mascot used when adding an exercise.
 */
export function SuggestionCallout({
    suggestion,
    variant = 'inline',
    className,
}: {
    suggestion: Pick<Suggestion, 'reason' | 'message' | 'last_performance'>;
    variant?: 'inline' | 'coach';
    className?: string;
}) {
    const reason = REASONS[suggestion.reason];
    const Icon = reason.icon;
    const lastTime = suggestion.last_performance
        ? `Última vez: ${suggestion.last_performance}`
        : null;

    if (variant === 'coach') {
        return (
            <div
                className={cn(
                    'grid grid-cols-[52px_1fr] items-start gap-3',
                    className,
                )}
            >
                <img
                    src={MASCOT_SRC}
                    alt=""
                    className="size-[52px] rounded-[14px] object-cover"
                />
                <div
                    role="status"
                    className="animate-pop rounded-[6px_20px_20px_20px] bg-foreground p-3.5 text-background"
                >
                    <span
                        className={cn(
                            'mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-[#18181b]',
                            reason.swatch,
                        )}
                    >
                        <Icon className="size-3.5" aria-hidden />
                        {reason.label}
                    </span>
                    <p className="text-[17px] leading-snug font-bold">
                        {suggestion.message}
                    </p>
                    {lastTime && (
                        <p className="mt-2 text-[13px] opacity-70">
                            {lastTime}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'rounded-lg',
                suggestion.reason === 'deload' && 'p-1 bg-hazard',
                className,
            )}
        >
            <div className="flex gap-3 rounded-[10px] bg-muted p-3">
                <span
                    className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-[10px] text-[#18181b]',
                        reason.swatch,
                    )}
                >
                    <Icon className="size-5" strokeWidth={2.6} aria-hidden />
                </span>
                <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-extrabold text-primary-text">
                        {reason.label}
                    </span>
                    <p className="text-sm leading-snug">{suggestion.message}</p>
                    {lastTime && (
                        <p className="text-xs text-muted-foreground">
                            {lastTime}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
