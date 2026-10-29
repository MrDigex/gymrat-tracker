import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card used by every settings section: title, short description, optional
 * action on the right, then the content.
 */
export function SettingsCard({
    title,
    description,
    action,
    children,
    className,
    id,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    children?: ReactNode;
    className?: string;
    id?: string;
}) {
    return (
        <section
            id={id}
            className={cn(
                'flex scroll-mt-4 flex-col gap-4 rounded-xl bg-card p-4 lg:p-5',
                className,
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg leading-tight font-bold">{title}</h2>
                    {description && (
                        <div className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </div>
                    )}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

/**
 * Small section label used between groups on mobile ("Apariencia", "Seguridad").
 */
export function SettingsGroupLabel({ children }: { children: ReactNode }) {
    return (
        <h2 className="px-1 text-sm font-bold text-muted-foreground">
            {children}
        </h2>
    );
}

const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/**
 * "hace 3 meses", "ayer"…
 */
export function timeAgo(value: string): string {
    const seconds = (new Date(value).getTime() - Date.now()) / 1000;
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 31_536_000],
        ['month', 2_592_000],
        ['week', 604_800],
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
    ];

    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) {
            return relativeFormat.format(Math.round(seconds / size), unit);
        }
    }

    return 'ahora mismo';
}
