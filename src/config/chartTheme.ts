import type { ApexOptions } from 'apexcharts';

/**
 * On-brand charting palette shared by every module dashboard. The dashboards
 * deliberately stay low-chroma: a monochrome brand-blue ramp carries every
 * multi-series chart, and the semantic accents are reserved for meaning
 * (in vs out, +/- deltas, healthy vs critical).
 */
export const BRAND_PRIMARY = '#0B529C';

export const CHART_PALETTE = ['#0B529C', '#2B6CB0', '#4A90D9', '#74B3F5', '#A8D0FB', '#CFE4FD'];

// Multi-hue "smart" palette for categorical reports -- brand-led, drawn from style.css tokens.
export const SMART_PALETTE = ['#0B529C', '#00A6F4', '#00BC7D', '#AD46FF', '#FE9A00', '#0069A8', '#E7000B'];

export const CHART_ACCENT = {
    brand: '#0B529C',
    success: '#00BC7D',
    warning: '#FE9A00',
    danger: '#FB2C36',
    info: '#00A6F4',
    neutral: '#94A3B8'
} as const;

interface ChartChrome {
    foreColor: string;
    grid: string;
    track: string;
    tooltip: 'light' | 'dark';
}

export function chartChrome(isDark: boolean): ChartChrome {
    return isDark
        ? { foreColor: '#94A3B8', grid: '#1E293B', track: '#1E293B', tooltip: 'dark' }
        : { foreColor: '#6B7280', grid: '#E5E7EB', track: '#F3F4F6', tooltip: 'light' };
}

/** Common ApexCharts options shared by every dashboard chart (theme-aware). */
export function baseChartOptions(isDark: boolean): ApexOptions {
    const chrome = chartChrome(isDark);
    return {
        chart: {
            fontFamily: 'inherit',
            foreColor: chrome.foreColor,
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: true, speed: 450 }
        },
        grid: {
            borderColor: chrome.grid,
            strokeDashArray: 4,
            padding: { left: 12, right: 12 }
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        tooltip: { theme: chrome.tooltip },
        states: { hover: { filter: { type: 'lighten' } } }
    };
}

/** Compact axis/tooltip number, e.g. 1_240_000 -> "1.2M", 12_400 -> "12.4k". */
export function compactNumber(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(Math.round(value));
}
