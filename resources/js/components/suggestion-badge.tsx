import { ArrowDown, ArrowUp, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Suggestion } from '@/types';

const icons = {
    first_time: Sparkles,
    increase_weight: ArrowUp,
    increase_reps: TrendingUp,
    add_load: ArrowUp,
    increase_time: TrendingUp,
    decrease_time: ArrowDown,
    deload: ArrowDown,
} as const;

export function SuggestionBadge({
    suggestion,
    className,
}: {
    suggestion: Pick<Suggestion, 'reason' | 'reason_label'>;
    className?: string;
}) {
    const Icon = icons[suggestion.reason];

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1',
                suggestion.reason === 'deload'
                    ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                    : suggestion.reason === 'first_time'
                      ? 'text-muted-foreground'
                      : 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400',
                className,
            )}
        >
            <Icon className="size-3" />
            {suggestion.reason_label}
        </Badge>
    );
}

/**
 * Suggestion message with its badge and the last logged performance.
 */
export function SuggestionCallout({
    suggestion,
    className,
}: {
    suggestion: Suggestion;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'space-y-1.5 rounded-lg border border-dashed bg-muted/40 p-3 text-sm',
                className,
            )}
        >
            <SuggestionBadge suggestion={suggestion} />
            <p>{suggestion.message}</p>
            {suggestion.last_performance && (
                <p className="text-xs text-muted-foreground">
                    Última vez: {suggestion.last_performance}
                </p>
            )}
        </div>
    );
}
