/**
 * Module-agnostic dashboard contracts shared by the reusable dashboard kit
 * (src/components/common/dashboard). Each module extends these with its own
 * domain-specific dashboard payload type.
 */

export type MetricTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';

/** A single KPI tile: value + delta + tone. */
export interface DashboardMetric {
    key: string;
    label: string;
    value: number;
    formatted: string;
    delta_percent: number;
    trend: 'up' | 'down' | 'flat';
    tone: MetricTone;
    is_currency: boolean;
}

/** Generic breakdown slice -- the shape every donut/polar/bar report card consumes. */
export interface BreakdownSlice {
    code: string;
    label: string;
    value: number;
    count: number;
    color: string;
}
