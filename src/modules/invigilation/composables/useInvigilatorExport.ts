import { ref } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { downloadBlob, generateExportFilename } from '@/utils/exportUtils';
import type { Assignment } from '@/modules/invigilation/types/assignment';

/** The brand blue, as the PDF and the workbook want it. */
const BRAND_HEX = '0B529C';
const BRAND_RGB: [number, number, number] = [11, 82, 156];
const HEADER_FILL = 'FFEFF4FB';
const PAGE_MARGIN = 10;

/** One column of the duty roster. */
interface RosterColumn {
    header: string;
    width: number;
    value: (duty: Assignment) => string;
}

/** One exam sitting and everyone on duty at it. */
interface RosterGroup {
    /** "CS101 · Final — 2026-08-20 09:00–12:00 · AB-EX1" */
    heading: string;
    duties: Assignment[];
}

/**
 * Excel and PDF export of the invigilator duty roster.
 *
 * A duty roster is read PER EXAM, not as a flat list of people: whoever is
 * standing at the door of hall AB-EX1 on the 20th wants that sitting's block,
 * so the sheet groups by sitting and repeats the exam as a heading. Filter the
 * screen to one exam and the export is that exam's sheet; filter to a semester
 * and it is the whole examination period, sitting by sitting.
 *
 * The rows come from the caller — `ManageAssignments` hands over every duty the
 * current filters match, not just the visible page.
 *
 * The invigilator is identified by `employee_no`, the institution's existing
 * staff number. No separate invigilator code was introduced for this.
 */
export function useInvigilatorExport(subtitle: () => string | undefined) {
    const { customizeLanguageData } = useLanguageStore();

    const isExporting = ref(false);

    const label = (key: string, fallback: string) => customizeLanguageData(key, fallback);

    /**
     * What an examinations office actually needs on a duty sheet: who, where,
     * when, and for which paper — not every column the table happens to hold.
     */
    const columns = (): RosterColumn[] => [
        {
            header: label('invigilatorCode', 'Invigilator Code'),
            width: 20,
            value: (duty) => duty.instructor?.employee_no ?? ''
        },
        { header: label('invigilatorName', 'Invigilator'), width: 34, value: (duty) => duty.instructor?.name ?? '' },
        {
            header: label('invigilatorRole', 'Role'),
            width: 16,
            value: (duty) => duty.role?.name ?? duty.role_code ?? ''
        },
        { header: label('status', 'Status'), width: 16, value: (duty) => duty.status?.name ?? duty.status_code ?? '' }
    ];

    /**
     * Group the duties by sitting, in exam order.
     *
     * Sorting by date and time rather than by whatever order the API returned
     * is what makes the sheet usable as a schedule: the blocks come out in the
     * order the exams are actually sat.
     */
    const groupBySitting = (duties: Assignment[]): RosterGroup[] => {
        const groups = new Map<number, RosterGroup>();

        duties.forEach((duty) => {
            const key = duty.exam_schedule_id;

            if (!groups.has(key)) {
                const exam = duty.exam_schedule;
                const where = exam?.room_code ?? exam?.room_name ?? '';
                const when = [duty.exam_date, duty.time_range].filter(Boolean).join(' ');

                groups.set(key, {
                    heading: [exam?.course_code ?? exam?.name ?? '', when, where].filter(Boolean).join(' · '),
                    duties: []
                });
            }

            groups.get(key)?.duties.push(duty);
        });

        // A group only exists because a duty created it, so `duties[0]` is
        // always there — TypeScript cannot see that, hence the fallbacks.
        const order = (group: RosterGroup) =>
            `${group.duties[0]?.exam_date ?? ''} ${group.duties[0]?.start_time ?? ''}`;

        return [...groups.values()].sort((a, b) => order(a).localeCompare(order(b)));
    };

    const title = () => label('invigilatorRoster', 'Invigilator Duty Roster');

    // ---- Excel ------------------------------------------------------------
    const toExcel = async (duties: Assignment[]) => {
        const { default: ExcelJS } = await import('exceljs');

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        const roster = columns();
        const sheet = workbook.addWorksheet(label('invigilators', 'Invigilators'));

        sheet.addRow([title()]).font = { bold: true, size: 14, color: { argb: `FF${BRAND_HEX}` } };

        const scope = subtitle();
        if (scope) {
            sheet.addRow([scope]).font = { color: { argb: 'FF6B7280' } };
        }

        sheet.addRow([]);

        groupBySitting(duties).forEach((group, index) => {
            // A blank line between blocks, but not before the first one.
            if (index > 0) sheet.addRow([]);

            const heading = sheet.addRow([group.heading]);
            heading.font = { bold: true, color: { argb: `FF${BRAND_HEX}` } };
            sheet.mergeCells(heading.number, 1, heading.number, roster.length);

            const head = sheet.addRow(roster.map((column) => column.header));
            head.font = { bold: true };
            head.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
            });

            group.duties.forEach((duty) => sheet.addRow(roster.map((column) => column.value(duty))));
        });

        roster.forEach((column, index) => (sheet.getColumn(index + 1).width = column.width));

        const buffer = await workbook.xlsx.writeBuffer();
        downloadBlob(
            new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            generateExportFilename('invigilator-roster', 'xlsx')
        );
    };

    // ---- PDF --------------------------------------------------------------
    const toPdf = async (duties: Assignment[]) => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

        // Portrait: a roster is a list, not a grid, and eight narrow columns fit.
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const roster = columns();

        doc.setFontSize(14);
        doc.setTextColor(...BRAND_RGB);
        doc.text(title(), PAGE_MARGIN, 14);

        const scope = subtitle();
        if (scope) {
            doc.setFontSize(9);
            doc.setTextColor(110);
            doc.text(scope, PAGE_MARGIN, 20);
        }

        let cursor = 26;

        groupBySitting(duties).forEach((group) => {
            // The sitting titles its own block. `head` carries it as a spanning
            // first row so autoTable reprints it whenever the block runs over a
            // page break — a heading drawn with doc.text() would not.
            autoTable(doc, {
                startY: cursor,
                head: [
                    [{ content: group.heading, colSpan: roster.length, styles: { halign: 'left' } }],
                    roster.map((column) => column.header)
                ],
                body: group.duties.map((duty) => roster.map((column) => column.value(duty))),
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: BRAND_RGB, textColor: 255 },
                margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
                showHead: 'everyPage'
            });

            // `lastAutoTable` is where the plugin records the table it just
            // drew — the only way to stack the next block under this one.
            cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        });

        doc.save(generateExportFilename('invigilator-roster', 'pdf'));
    };

    /**
     * @param format `'xlsx'` or `'pdf'`
     * @param duties what is currently on screen
     */
    const exportRoster = async (format: string, duties: Assignment[]) => {
        if (!duties.length) {
            toast.error(label('nothingToExport', 'There is nothing to export'));
            return;
        }

        isExporting.value = true;
        try {
            if (format === 'pdf') await toPdf(duties);
            else await toExcel(duties);
        } catch (error: unknown) {
            console.error('Invigilator export failed:>>>>', error);
            toast.error(label('exportFailed', 'The export could not be produced'));
        } finally {
            isExporting.value = false;
        }
    };

    return { isExporting, exportRoster };
}
