import type { ChartConfig } from '@/components/ui/chart';
import type { BodyZone, ChartZone } from '@/types';

/**
 * Theme chart colors (see --chart-1…5 in app.css; they adapt to light/dark).
 * Yellow is never a data series: it only highlights records or the current value.
 */
export const CHART_COLORS = {
    upper: 'var(--chart-1)',
    lower: 'var(--chart-2)',
    core: 'var(--chart-3)',
    run: 'var(--chart-4)',
    hyrox: 'var(--chart-5)',
} as const;

/**
 * Zones drawn in charts. Volume of exercises spanning several zones is split
 * across them by the backend, so there is no "cuerpo completo" series.
 */
export const BODY_ZONES: ChartZone[] = ['superior', 'inferior', 'core'];

export const BODY_ZONE_LABELS: Record<BodyZone, string> = {
    superior: 'Tren superior',
    inferior: 'Tren inferior',
    core: 'Core',
    cuerpo_completo: 'Cuerpo completo',
};

/**
 * One fixed color per body zone, shared by every chart in the app.
 */
export const BODY_ZONE_COLORS: Record<BodyZone, string> = {
    superior: CHART_COLORS.upper,
    inferior: CHART_COLORS.lower,
    core: CHART_COLORS.core,
    cuerpo_completo: CHART_COLORS.hyrox,
};

export const bodyZoneChartConfig = Object.fromEntries(
    BODY_ZONES.map((zone) => [
        zone,
        { label: BODY_ZONE_LABELS[zone], color: BODY_ZONE_COLORS[zone] },
    ]),
) satisfies ChartConfig;

/**
 * Chart configs for single-measure charts, so the same measure keeps its color.
 */
export const runningChartConfig = {
    km: { label: 'Kilómetros', color: CHART_COLORS.run },
    pace: { label: 'Ritmo medio', color: CHART_COLORS.run },
} satisfies ChartConfig;

export const progressChartConfig = {
    max_weight_kg: { label: 'Peso máximo', color: CHART_COLORS.upper },
    estimated_1rm: { label: '1RM estimado', color: CHART_COLORS.lower },
    max_reps: { label: 'Reps máximas', color: CHART_COLORS.upper },
    volume_kg: { label: 'Volumen', color: CHART_COLORS.upper },
    best_duration_seconds: { label: 'Mejor tiempo', color: CHART_COLORS.run },
} satisfies ChartConfig;
