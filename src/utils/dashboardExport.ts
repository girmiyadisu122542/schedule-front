import { jsPDF } from 'jspdf';
import ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';

import { compactNumber } from '@/config/chartTheme';

/**
 * Module-agnostic plumbing for dashboard exports (Excel/PDF/PNG). Each module's
 * export composable supplies its own data + sheet/table definitions and reuses
 * these helpers for download, off-screen chart rendering and PDF chart blocks.
 */

export const BRAND_HEX = '0B529C';
export const BRAND_RGB: [number, number, number] = [11, 82, 156];

/** jsPDF gains `lastAutoTable` once jspdf-autotable is loaded. */
export interface AutoTableDoc extends jsPDF {
    lastAutoTable: { finalY: number };
}

export function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

/** Date stamp for export filenames, e.g. "20260618". */
export function exportStamp(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

/** Render an ApexCharts spec off-screen and return a PNG data-URI for embedding. */
export async function chartToImage(options: ApexOptions): Promise<string> {
    const width = typeof options.chart?.width === 'number' ? options.chart.width : 480;
    const height = typeof options.chart?.height === 'number' ? options.chart.height : 300;
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-10000px';
    host.style.top = '0';
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    document.body.appendChild(host);
    const chart = new ApexCharts(host, options);
    await chart.render();
    const result = (await chart.dataURI({ scale: 2 })) as { imgURI: string };
    chart.destroy();
    host.remove();
    return result.imgURI;
}

/** Load a data-URI into an HTMLImageElement (for canvas composition). */
export function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
    });
}

/** A print-friendly donut spec (no animation/tooltip, white background). */
export function pdfDonut(
    series: number[],
    labels: string[],
    colors: string[],
    imgW: number,
    imgH: number
): ApexOptions {
    return {
        chart: {
            type: 'donut',
            width: imgW * 2,
            height: imgH * 2,
            animations: { enabled: false },
            background: '#ffffff',
            fontFamily: 'Helvetica'
        },
        series,
        labels,
        colors,
        legend: { show: true, position: 'right', fontSize: '10px' },
        dataLabels: {
            enabled: true,
            formatter: (value: number | string | number[]) => `${Math.round(Number(value))}%`,
            style: { fontSize: '9px' }
        },
        stroke: { width: 0 },
        plotOptions: { pie: { donut: { size: '62%' } } },
        tooltip: { enabled: false }
    };
}

/** A print-friendly horizontal bar spec. */
export function pdfBar(
    series: number[],
    labels: string[],
    colors: string[],
    imgW: number,
    imgH: number,
    seriesName: string = 'Value'
): ApexOptions {
    return {
        chart: {
            type: 'bar',
            width: imgW * 2,
            height: imgH * 2,
            animations: { enabled: false },
            background: '#ffffff',
            fontFamily: 'Helvetica'
        },
        series: [{ name: seriesName, data: series }],
        colors,
        plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4, barHeight: '58%' } },
        xaxis: {
            categories: labels,
            labels: {
                formatter: (value: string) => compactNumber(Number(value)),
                style: { fontSize: '9px', colors: '#6B7280' }
            }
        },
        yaxis: { labels: { style: { fontSize: '9px', colors: '#6B7280' } } },
        legend: { show: false },
        dataLabels: { enabled: false },
        grid: { borderColor: '#E5E7EB' },
        tooltip: { enabled: false }
    };
}
