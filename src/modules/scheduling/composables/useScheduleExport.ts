import { ref } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { downloadBlob, generateExportFilename } from '@/utils/exportUtils';
import { toMinutes } from '@/modules/scheduling/composables/useCalendarLayout';
import { weeklyMasterColumns } from '@/modules/scheduling/composables/useMasterTimetable';
import type { DayOption, TimeSlot } from '@/modules/scheduling/types/classSchedule';
import type { MasterColumn, ScheduleEvent } from '@/modules/scheduling/types/calendar';

/** The brand blue, as the PDF and the workbook want it. */
const BRAND_HEX = '0B529C';
const BRAND_RGB: [number, number, number] = [11, 82, 156];
const HEADER_FILL = 'FFEFF4FB';

/** A4 landscape, in the millimetres jsPDF measures in. */
const PAGE_MARGIN = 10;

export interface ScheduleExportConfig {
    /** Filename stem, e.g. `'class-timetable'`. */
    filePrefix: string;
    /** Printed at the top of every PDF page and on the sheet's title row. */
    title: string;
    /** The semester (or whatever scope) the export was taken under. */
    subtitle?: string;
    /** Weekday columns; empty for a dated export like the exam calendar. */
    days?: DayOption[];
    /** The daily period grid; empty for a dated export. */
    slots?: TimeSlot[];
}

/** One column of the flat sheet — the same data an exam or a class row carries. */
interface FlatColumn {
    header: string;
    width: number;
    value: (event: ScheduleEvent) => string;
}

/**
 * Excel and PDF export for a schedule, built from exactly what is on screen.
 *
 * Client-side on purpose. The backend's export service exists to round-trip
 * MASTER DATA through its import column maps — a timetable is not that: it is a
 * printout, it has to match the filters the user is looking at, and the PDF has
 * to be a grid rather than a row dump. The whole semester is already in memory
 * for the calendar to draw, so there is nothing to fetch.
 *
 * Both libraries are imported dynamically — together they are most of a
 * megabyte, and a user who never exports should not pay for them.
 */
export function useScheduleExport(config: () => ScheduleExportConfig) {
    const { customizeLanguageData } = useLanguageStore();

    const isExporting = ref(false);

    const label = (key: string, fallback: string) => customizeLanguageData(key, fallback);

    /** The invigilators on one sitting, as codes and as names. */
    const dutyCodes = (event: ScheduleEvent) =>
        (event.invigilators ?? [])
            .map((duty) => duty.employee_no ?? '')
            .filter(Boolean)
            .join(', ');

    const dutyNames = (event: ScheduleEvent) =>
        (event.invigilators ?? [])
            .map((duty) => duty.name ?? '')
            .filter(Boolean)
            .join(', ');

    /**
     * The flat sheet's columns.
     *
     * An EXAM sheet and a CLASS sheet want different things. An exam timetable
     * is read to answer "which paper, when, which hall, who is invigilating" —
     * the course title and the programme are noise there, and the duty names
     * are the point. A class timetable has no invigilators and does want the
     * cohort's programme.
     */
    const flatColumns = (dated: boolean): FlatColumn[] => {
        // Code, not code + title: the code is what a registrar sorts and looks
        // up by, and it prints bare on every exam paper.
        const common: FlatColumn[] = [
            { header: label('courseCode', 'Course'), width: 14, value: (e) => e.courseCode ?? e.title }
        ];

        if (dated) {
            return [
                ...common,
                { header: label('examDate', 'Date'), width: 14, value: (e) => e.date ?? '' },
                { header: label('time', 'Time'), width: 16, value: (e) => `${e.start}–${e.end}` },
                { header: label('room', 'Hall'), width: 20, value: (e) => e.subtitle ?? '' },
                { header: label('section', 'Section'), width: 26, value: (e) => e.cohort?.sectionLabel ?? '' },
                { header: label('invigilatorCode', 'Invigilator Code'), width: 22, value: dutyCodes },
                { header: label('invigilatorName', 'Invigilator'), width: 34, value: dutyNames },
                { header: label('examType', 'Type'), width: 14, value: (e) => e.badge ?? '' },
                { header: label('status', 'Status'), width: 14, value: (e) => e.statusLabel ?? '' }
            ];
        }

        return [
            ...common,
            { header: label('courseTitle', 'Course Title'), width: 38, value: (e) => e.courseTitle ?? '' },
            { header: label('dayOfWeek', 'Day'), width: 14, value: (e) => e.dayLabel ?? '' },
            { header: label('time', 'Time'), width: 16, value: (e) => `${e.start}–${e.end}` },
            { header: label('section', 'Section'), width: 26, value: (e) => e.cohort?.sectionLabel ?? '' },
            { header: label('program', 'Program'), width: 26, value: (e) => e.cohort?.programLabel ?? '' },
            { header: label('department', 'Department'), width: 24, value: (e) => e.cohort?.departmentLabel ?? '' },
            { header: label('details', 'Details'), width: 34, value: (e) => e.subtitle ?? '' },
            { header: label('sessionType', 'Session'), width: 16, value: (e) => e.badge ?? '' },
            { header: label('status', 'Status'), width: 16, value: (e) => e.statusLabel ?? '' }
        ];
    };

    /**
     * Group events into one printable timetable per cohort.
     *
     * A cohort with no section still gets a page — an offering need not name
     * one, and dropping those would make the export disagree with the screen.
     */
    const byCohort = (events: ScheduleEvent[]) => {
        const groups = new Map<string, { label: string; band: string; events: ScheduleEvent[] }>();

        events.forEach((event) => {
            const key = String(event.cohort?.sectionId ?? 0);
            const existing = groups.get(key);

            if (existing) {
                existing.events.push(event);
                return;
            }

            groups.set(key, {
                label: event.cohort?.sectionLabel || label('unassignedCohort', 'Unassigned'),
                band: [event.cohort?.departmentLabel, event.cohort?.programLabel].filter(Boolean).join(' › '),
                events: [event]
            });
        });

        return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
    };

    /** Which master column an event sits in, or null when it is off-grid. */
    const cellFor = (columns: MasterColumn[], event: ScheduleEvent): MasterColumn | null => {
        const dayColumns = columns.filter((column) => column.groupKey === String(event.day));
        if (!dayColumns.length) return null;

        const start = toMinutes(event.start);
        let chosen = dayColumns[0]!;
        dayColumns.forEach((column) => {
            if (toMinutes(column.label.split('–')[0]!) <= start) chosen = column;
        });

        return chosen;
    };

    /** What one cell prints: the offering, then room / instructor beneath it. */
    const cellText = (events: ScheduleEvent[]): string =>
        events.map((event) => [event.title, event.subtitle].filter(Boolean).join('\n')).join('\n──\n');

    // ---- Excel ------------------------------------------------------------
    const toExcel = async (events: ScheduleEvent[]) => {
        const { default: ExcelJS } = await import('exceljs');
        const settings = config();
        const dated = !settings.days?.length;

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        // Sheet 1 — one timetable per cohort, laid out the way a timetable is
        // read and the way the PDF prints it: days down the side, periods
        // across the top, each cohort under its own title.
        if (!dated && settings.days?.length && settings.slots?.length) {
            const columns = weeklyMasterColumns(settings.days, settings.slots);
            const periods = settings.slots;
            const sheet = workbook.addWorksheet(label('timetable', 'Timetable'));

            const titleRow = sheet.addRow([settings.title]);
            titleRow.font = { bold: true, size: 14, color: { argb: `FF${BRAND_HEX}` } };

            if (settings.subtitle) {
                sheet.addRow([settings.subtitle]).font = { color: { argb: 'FF6B7280' } };
            }

            byCohort(events).forEach((cohort) => {
                sheet.addRow([]);

                // The cohort's own title, with its department › programme
                // underneath so a printed page says who it belongs to.
                const cohortRow = sheet.addRow([cohort.label]);
                cohortRow.font = { bold: true, size: 12, color: { argb: `FF${BRAND_HEX}` } };

                if (cohort.band) {
                    sheet.addRow([cohort.band]).font = { size: 9, color: { argb: 'FF6B7280' } };
                }

                const headRow = sheet.addRow([
                    label('dayOfWeek', 'Day'),
                    ...periods.map((slot) => `${slot.start}–${slot.end}`)
                ]);
                headRow.font = { bold: true };
                headRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                headRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
                });

                const placed = new Map<string, ScheduleEvent[]>();
                cohort.events.forEach((event) => {
                    const column = cellFor(columns, event);
                    if (column) placed.set(column.key, [...(placed.get(column.key) ?? []), event]);
                });

                // Every teaching day gets a row, even an empty one — a free day
                // is information, and a missing row reads as an oversight.
                settings.days!.forEach((day) => {
                    const dayRow = sheet.addRow([
                        day.name,
                        ...periods.map((slot) => cellText(placed.get(`${day.id}|${slot.start}`) ?? []))
                    ]);

                    dayRow.alignment = { vertical: 'top', wrapText: true };
                    dayRow.getCell(1).font = { bold: true };
                });
            });

            sheet.getColumn(1).width = 18;
            periods.forEach((_slot, index) => (sheet.getColumn(index + 2).width = 30));
        }

        // The exam-period equivalent: same per-cohort blocks, dates down the
        // side. Sittings are not placed on a repeating period grid — each one
        // sets its own window — so the time is a column rather than a heading.
        if (dated) {
            const sheet = workbook.addWorksheet(label('examCalendar', 'Exam Calendar'));
            const headers = [
                label('examDate', 'Date'),
                label('time', 'Time'),
                label('courseCode', 'Course'),
                label('room', 'Hall'),
                label('invigilatorCode', 'Invigilator Code'),
                label('invigilatorName', 'Invigilator')
            ];

            const titleRow = sheet.addRow([settings.title]);
            titleRow.font = { bold: true, size: 14, color: { argb: `FF${BRAND_HEX}` } };

            if (settings.subtitle) {
                sheet.addRow([settings.subtitle]).font = { color: { argb: 'FF6B7280' } };
            }

            byCohort(events).forEach((cohort) => {
                sheet.addRow([]);

                const cohortRow = sheet.addRow([cohort.label]);
                cohortRow.font = { bold: true, size: 12, color: { argb: `FF${BRAND_HEX}` } };

                if (cohort.band) {
                    sheet.addRow([cohort.band]).font = { size: 9, color: { argb: 'FF6B7280' } };
                }

                const headRow = sheet.addRow(headers);
                headRow.font = { bold: true };
                headRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
                });

                [...cohort.events]
                    .sort(
                        (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || toMinutes(a.start) - toMinutes(b.start)
                    )
                    .forEach((event) => {
                        const row = sheet.addRow([
                            event.date ?? '',
                            `${event.start}–${event.end}`,
                            event.courseCode ?? event.title,
                            event.subtitle ?? '',
                            dutyCodes(event),
                            dutyNames(event)
                        ]);

                        row.alignment = { vertical: 'top', wrapText: true };
                        row.getCell(1).font = { bold: true };
                    });
            });

            [16, 16, 16, 26, 22, 34].forEach((width, index) => (sheet.getColumn(index + 1).width = width));
        }

        // Sheet 2 — one row per schedule, for anyone doing data work.
        const columns = flatColumns(dated);
        const list = workbook.addWorksheet(label('schedules', 'Schedules'));

        list.addRow(columns.map((column) => column.header));
        events.forEach((event) => list.addRow(columns.map((column) => column.value(event))));

        columns.forEach((column, index) => (list.getColumn(index + 1).width = column.width));
        const head = list.getRow(1);
        head.font = { bold: true };
        head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };

        const buffer = await workbook.xlsx.writeBuffer();
        downloadBlob(
            new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            generateExportFilename(settings.filePrefix, 'xlsx')
        );
    };

    // ---- PDF --------------------------------------------------------------
    const toPdf = async (events: ScheduleEvent[]) => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const settings = config();
        const dated = !settings.days?.length;

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        /** The banner every page wears. */
        const header = (heading: string, sub: string) => {
            doc.setFontSize(14);
            doc.setTextColor(...BRAND_RGB);
            doc.text(heading, PAGE_MARGIN, 14);

            if (sub) {
                doc.setFontSize(9);
                doc.setTextColor(110);
                doc.text(sub, PAGE_MARGIN, 20);
            }

            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(settings.title, pageWidth - PAGE_MARGIN, 14, { align: 'right' });
        };

        if (dated) {
            // No weekly grid to draw — a dated export prints as a listing.
            const columns = flatColumns(true);
            header(settings.title, settings.subtitle ?? '');
            autoTable(doc, {
                startY: 26,
                head: [columns.map((column) => column.header)],
                body: events.map((event) => columns.map((column) => column.value(event))),
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: BRAND_RGB, textColor: 255 },
                margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
            });
        } else {
            const columns = weeklyMasterColumns(settings.days!, settings.slots!);
            const periods = settings.slots!;

            byCohort(events).forEach((cohort, index) => {
                if (index > 0) doc.addPage();

                header(cohort.label, [cohort.band, settings.subtitle].filter(Boolean).join(' · '));

                // Days down the side, periods across: an A4 landscape page fits
                // five periods comfortably but not twenty-five columns.
                const placed = new Map<string, ScheduleEvent[]>();
                cohort.events.forEach((event) => {
                    const column = cellFor(columns, event);
                    if (column) placed.set(column.key, [...(placed.get(column.key) ?? []), event]);
                });

                autoTable(doc, {
                    startY: 26,
                    head: [[label('dayOfWeek', 'Day'), ...periods.map((slot) => `${slot.start}–${slot.end}`)]],
                    body: settings.days!.map((day) => [
                        day.name,
                        ...periods.map((slot) => cellText(placed.get(`${day.id}|${slot.start}`) ?? []))
                    ]),
                    styles: { fontSize: 7.5, cellPadding: 2, valign: 'top', overflow: 'linebreak' },
                    headStyles: { fillColor: BRAND_RGB, textColor: 255, halign: 'center' },
                    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 26 } },
                    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
                });
            });
        }

        doc.save(generateExportFilename(settings.filePrefix, 'pdf'));
    };

    /**
     * @param format `'xlsx'` or `'pdf'`
     * @param events what is currently on screen
     */
    const exportSchedule = async (format: string, events: ScheduleEvent[]) => {
        if (!events.length) {
            toast.error(label('nothingToExport', 'There is nothing to export'));
            return;
        }

        isExporting.value = true;
        try {
            if (format === 'pdf') await toPdf(events);
            else await toExcel(events);
        } catch (error: unknown) {
            console.error('Schedule export failed:>>>>', error);
            toast.error(label('exportFailed', 'The export could not be produced'));
        } finally {
            isExporting.value = false;
        }
    };

    return { isExporting, exportSchedule };
}
