import type { CSSProperties, ReactNode } from 'react';
import { BODY_ZONE_COLORS } from '@/lib/chart-colors';
import { cn } from '@/lib/utils';
import type { BodyZone } from '@/types';

/**
 * Inline style exposing the body zone color as `--zone`, so chips can be
 * tinted with `bg-(--zone)/20`, `border-(--zone)`, etc. Falls back to the
 * neutral foreground color when the zone is unknown.
 */
export function zoneStyle(zone: BodyZone | null | undefined): CSSProperties {
    return {
        '--zone': zone ? BODY_ZONE_COLORS[zone] : 'var(--muted-foreground)',
    } as CSSProperties;
}

/**
 * Muscle badge tinted with the color of its body zone.
 * "solid" for primary muscles, "outline" for secondary ones.
 */
export function MuscleChip({
    zone,
    variant = 'solid',
    className,
    children,
}: {
    zone: BodyZone | null | undefined;
    variant?: 'solid' | 'outline';
    className?: string;
    children: ReactNode;
}) {
    return (
        <span
            style={zoneStyle(zone)}
            className={cn(
                'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold',
                'text-[color-mix(in_oklab,var(--zone)_55%,var(--foreground))]',
                variant === 'solid'
                    ? 'bg-(--zone)/20'
                    : 'border border-(--zone)/60 bg-transparent',
                className,
            )}
        >
            {children}
        </span>
    );
}
