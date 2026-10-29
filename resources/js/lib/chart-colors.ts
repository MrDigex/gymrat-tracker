import type { ChartConfig } from '@/components/ui/chart';
import type { BodyZone } from '@/types';

/**
 * Categorical palette (validated for color-vision deficiency) with a light and
 * a dark step per hue. Slots are always assigned in this order, never cycled.
 */
export const SERIES_COLORS = [
    { light: '#2a78d6', dark: '#3987e5' }, // blue
    { light: '#eb6834', dark: '#d95926' }, // orange
    { light: '#1baf7a', dark: '#199e70' }, // aqua
    { light: '#eda100', dark: '#c98500' }, // yellow
] as const;

export const BODY_ZONES: BodyZone[] = [
    'superior',
    'inferior',
    'core',
    'cuerpo_completo',
];

export const BODY_ZONE_LABELS: Record<BodyZone, string> = {
    superior: 'Tren superior',
    inferior: 'Tren inferior',
    core: 'Core',
    cuerpo_completo: 'Cuerpo completo',
};

/**
 * One fixed color per body zone, shared by every chart in the app.
 */
export const BODY_ZONE_COLORS: Record<
    BodyZone,
    { light: string; dark: string }
> = {
    superior: SERIES_COLORS[0],
    inferior: SERIES_COLORS[1],
    core: SERIES_COLORS[2],
    cuerpo_completo: SERIES_COLORS[3],
};

export const bodyZoneChartConfig = Object.fromEntries(
    BODY_ZONES.map((zone) => [
        zone,
        { label: BODY_ZONE_LABELS[zone], theme: BODY_ZONE_COLORS[zone] },
    ]),
) satisfies ChartConfig;

/**
 * Chart configs for single-measure charts, so the same measure keeps its color.
 */
export const runningChartConfig = {
    km: { label: 'Kilómetros', theme: SERIES_COLORS[0] },
    pace: { label: 'Ritmo medio', theme: SERIES_COLORS[1] },
} satisfies ChartConfig;

export const progressChartConfig = {
    max_weight_kg: { label: 'Peso máximo', theme: SERIES_COLORS[0] },
    estimated_1rm: { label: '1RM estimado', theme: SERIES_COLORS[1] },
    max_reps: { label: 'Reps máximas', theme: SERIES_COLORS[0] },
    volume_kg: { label: 'Volumen', theme: SERIES_COLORS[0] },
    best_duration_seconds: { label: 'Mejor tiempo', theme: SERIES_COLORS[0] },
} satisfies ChartConfig;
