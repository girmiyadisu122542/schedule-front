import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { readApiErrorMessage } from '@/utils/apiError';
import axiosInstance from '@/api/axiosInstance';
import { downloadBlob, generateExportFilename } from '@/utils/exportUtils';
import {
    DROPDOWN_PARAM_KEY,
    EXPORT_FORMAT_XLSX,
    RESPONSE_TYPE_BLOB,
    type ExportFormat
} from '@/config/appConfig';
import type { DropdownOption } from '@/types/CommonTypes';
import {
    fetchComparison,
    fetchTermSetup,
    fetchExceptions,
    fetchInstructorWorkload,
    fetchRoomUtilisation
} from '@/modules/reports/services/reportService';
import type {
    ComparisonReport,
    TermSetupChecklist,
    ExceptionGroupKey,
    ExceptionReport,
    InstructorWorkloadReport,
    RoomUtilisationReport
} from '@/modules/reports/types/report';

/** The four tabs, in the order a registrar reads them. */
export const REPORT_TABS = ['setup', 'exceptions', 'rooms', 'workload', 'compare'] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

/**
 * The reporting screen's state.
 *
 * Not a shared composable: reports are read on one screen and nothing else
 * needs them, so a per-mount instance keeps the fetches scoped to the page the
 * user is actually looking at.
 *
 * Every report is fetched on demand rather than all at once — a registrar opens
 * this for one question at a time, and three aggregate queries to answer one of
 * them is waste the user pays for in latency.
 */
export function useReports() {
    const { customizeLanguageData } = useLanguageStore();

    const label = (key: string, fallback: string) => customizeLanguageData(key, fallback);
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, label('somethingWentWrong', 'Something went wrong'));

    const activeTab = ref<ReportTab>('exceptions');
    const setup = ref<TermSetupChecklist | null>(null);
    const semesterId = ref<number | null>(null);
    const compareSemesterId = ref<number | null>(null);
    const isLoading = ref(false);

    const rooms = ref<RoomUtilisationReport | null>(null);
    const workload = ref<InstructorWorkloadReport | null>(null);
    const exceptions = ref<ExceptionReport | null>(null);
    const comparison = ref<ComparisonReport | null>(null);

    const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });

    /** Human labels for the exception groups, in reading order. */
    const exceptionGroups = computed<Array<{ key: ExceptionGroupKey; label: string; hint: string }>>(() => [
        {
            key: 'unscheduled_offerings',
            label: label('unscheduledOfferings', 'Approved offerings with no timetable'),
            hint: label('unscheduledOfferingsHint', 'Approved to run, but nothing has been scheduled for them yet.')
        },
        {
            key: 'sessions_over_capacity',
            label: label('sessionsOverCapacity', 'Sections that have outgrown their room'),
            hint: label(
                'sessionsOverCapacityHint',
                'The room fitted when it was scheduled. Headcounts move during add/drop, and nothing re-checks the fit — these need a bigger room.'
            )
        },
        {
            key: 'sessions_without_room',
            label: label('sessionsWithoutRoom', 'Sessions with no room'),
            hint: label('sessionsWithoutRoomHint', 'Scheduled at a time, but nobody has said where.')
        },
        {
            key: 'exams_short_of_invigilators',
            label: label('examsShortOfInvigilators', 'Exams short of invigilators'),
            hint: label('examsShortOfInvigilatorsHint', 'Fewer people on duty than the hall requires.')
        },
        {
            key: 'offerings_without_exam',
            label: label('offeringsWithoutExam', 'Offerings with no exam'),
            hint: label(
                'offeringsWithoutExamHint',
                'Expected for most courses; check the ones that should have a paper.'
            )
        },
        {
            key: 'clash_risk_courses',
            label: label('clashRiskCourses', 'Courses taught to several sections'),
            hint: label(
                'clashRiskCoursesHint',
                'A student taking one of these outside their own section can be double-booked without the system catching it. Worth a manual look.'
            )
        }
    ]);

    /**
     * What each checklist step is called, and where it is fixed.
     *
     * Kept here rather than on the backend because it is pure presentation —
     * the service returns keys and counts, which is the part worth being
     * authoritative about.
     */
    const setupLabels: Record<string, { label: string; hint: string; path: string }> = {
        campuses: {
            label: label('campuses', 'Campuses'),
            hint: label('campusesHint', 'Where the institution has sites.'),
            path: '/campuses'
        },
        buildings: {
            label: label('buildings', 'Buildings'),
            hint: label('buildingsHint', 'Each one belongs to a campus.'),
            path: '/buildings'
        },
        rooms: {
            label: label('rooms', 'Rooms'),
            hint: label('roomsHint', 'With a teaching capacity, so the generator can fit a section.'),
            path: '/rooms'
        },
        exam_venues: {
            label: label('examVenues', 'Exam venues'),
            hint: label('examVenuesHint', 'Rooms marked as exam halls. Only needed before exam scheduling.'),
            path: '/rooms'
        },
        departments: {
            label: label('departments', 'Departments'),
            hint: label('departmentsHint', 'Who owns courses, staff and offerings.'),
            path: '/departments'
        },
        programs: {
            label: label('programs', 'Programs'),
            hint: label('programsHint', 'Each carries the study mode that picks the timetable grid.'),
            path: '/programs'
        },
        academic_years: {
            label: label('academicYears', 'Academic years'),
            hint: label('academicYearsHint', 'Semesters and sections hang off these.'),
            path: '/academic-years'
        },
        sections: {
            label: label('sections', 'Sections'),
            hint: label('sectionsHint', 'The student groups this term, with expected sizes.'),
            path: '/sections'
        },
        courses: {
            label: label('courses', 'Courses'),
            hint: label('coursesHint', 'With weekly hours, so the generator knows how many sessions to place.'),
            path: '/courses'
        },
        instructors: {
            label: label('instructors', 'Instructors'),
            hint: label('instructorsHint', 'Staff who can teach. Set weekly hour limits here too.'),
            path: '/instructors'
        },
        schedule_settings: {
            label: label('scheduleSettings', 'Schedule settings'),
            hint: label('scheduleSettingsHint', 'Teaching days, day window, period length, lunch and the exam rules.'),
            path: '/schedule-settings'
        },
        offerings: {
            label: label('courseOfferings', 'Course offerings'),
            hint: label('offeringsHint', 'Which courses run this semester, to which sections.'),
            path: '/offerings'
        },
        approved_offerings: {
            label: label('approvedOfferings', 'Approved offerings'),
            hint: label('approvedOfferingsHint', 'Only registrar-approved offerings are scheduled.'),
            path: '/offerings'
        },
        class_schedules: {
            label: label('classSchedules', 'Class timetable'),
            hint: label('classSchedulesHint', 'Generated once everything above is in place.'),
            path: '/class-schedules'
        }
    };

    /** True once a semester is chosen — every figure is meaningless without one. */
    const hasSemester = computed(() => !!semesterId.value);

    const load = async (tab: ReportTab = activeTab.value) => {
        if (!semesterId.value) return;

        isLoading.value = true;
        try {
            if (tab === 'setup') setup.value = await fetchTermSetup(semesterId.value);
            else if (tab === 'rooms') rooms.value = await fetchRoomUtilisation(semesterId.value);
            else if (tab === 'workload') workload.value = await fetchInstructorWorkload(semesterId.value);
            else if (tab === 'exceptions') exceptions.value = await fetchExceptions(semesterId.value);
            else if (tab === 'compare' && compareSemesterId.value) {
                comparison.value = await fetchComparison(semesterId.value, compareSemesterId.value);
            }
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isLoading.value = false;
        }
    };

    const selectTab = async (tab: ReportTab) => {
        activeTab.value = tab;
        await load(tab);
    };

    const isExporting = ref(false);

    /**
     * Which endpoint each tab exports from.
     *
     * `compare` is absent deliberately: it is a two-semester diff rendered as
     * paired totals, not a row list, so a spreadsheet of it would be a worse
     * artefact than the screen. The export control hides rather than offering
     * a download that produces something useless.
     */
    const EXPORT_PATHS: Partial<Record<ReportTab, string>> = {
        setup: 'term-setup',
        exceptions: 'exceptions',
        rooms: 'room-utilisation',
        workload: 'instructor-workload'
    };

    const canExport = computed(() => !!EXPORT_PATHS[activeTab.value] && hasSemester.value);

    /**
     * Download the report currently on screen.
     *
     * Sends the SAME filters the view was built with, so the file matches what
     * the reader is looking at rather than a re-query with different arguments.
     *
     * `responseType: 'blob'` is essential — without it axios parses the binary
     * body as text and the saved workbook is corrupt.
     */
    const exportReport = async (format: ExportFormat = EXPORT_FORMAT_XLSX) => {
        const path = EXPORT_PATHS[activeTab.value];
        if (!path || !semesterId.value) return;

        isExporting.value = true;
        try {
            const response = await axiosInstance.get(`/reports/${path}`, {
                params: {
                    semester_id: semesterId.value,
                    ...(activeTab.value === 'compare' ? { compare_semester_id: compareSemesterId.value } : {}),
                    export: format
                },
                responseType: RESPONSE_TYPE_BLOB
            });

            downloadBlob(response.data, generateExportFilename(path, format));
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isExporting.value = false;
        }
    };

    /** Re-fetch whatever is on screen — used by the semester picker and refresh. */
    const reload = () => load(activeTab.value);

    return {
        activeTab,
        semesterId,
        compareSemesterId,
        isLoading,
        hasSemester,
        rooms,
        workload,
        exceptions,
        comparison,
        setup,
        setupLabels,
        exceptionGroups,
        semesterDropdown,
        selectTab,
        load,
        reload,
        isExporting,
        canExport,
        exportReport
    };
}
