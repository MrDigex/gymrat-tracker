import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const options: { value: Appearance; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'system', label: 'Sistema' },
];

/**
 * Mini screen preview for each theme option (fixed colors on purpose: it
 * shows what the theme looks like, whatever theme is active).
 */
function Preview({ value }: { value: Appearance }) {
    const lines = (dark: boolean) => (
        <span className="flex flex-col gap-1.5 p-2.5">
            <span
                className={cn(
                    'h-1.5 w-3/4 rounded-full',
                    dark ? 'bg-white' : 'bg-zinc-900',
                )}
            />
            <span className="h-1.5 w-1/3 rounded-full bg-[#facc15]" />
        </span>
    );

    if (value === 'system') {
        return (
            <span className="grid h-14 grid-cols-2 overflow-hidden rounded-lg border border-border">
                <span className="bg-white" />
                <span className="bg-zinc-900" />
            </span>
        );
    }

    return (
        <span
            className={cn(
                'block h-14 overflow-hidden rounded-lg border border-border',
                value === 'light' ? 'bg-white' : 'bg-zinc-900',
            )}
        >
            {lines(value === 'dark')}
        </span>
    );
}

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div
            role="group"
            aria-label="Apariencia"
            className={cn('grid grid-cols-3 gap-2', className)}
            {...props}
        >
            {options.map(({ value, label }) => {
                const selected = appearance === value;

                return (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'flex flex-col gap-2 rounded-xl border-2 bg-card p-2 pb-2.5 text-sm font-bold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            selected
                                ? 'border-primary'
                                : 'border-transparent hover:border-border',
                        )}
                    >
                        <Preview value={value} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
