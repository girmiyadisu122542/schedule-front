import { ref, computed, watch } from 'vue';
import { roomLabel } from '@/modules/scheduling/utils/roomLabel';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentSemester } from '@/composables/useCurrentSemester';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { useScheduleFilters } from '@/modules/scheduling/composables/useScheduleFilters';
import { EXAM_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import { CALENDAR_PAGE_LIMIT } from '@/modules/scheduling/constants/scheduleView';
import { fetchExamSchedules } from '@/modules/scheduling/services/examScheduleService';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';
import type { ScheduleEvent } from '@/modules/scheduling/types/calendar';
import { readApiErrorMessage } from '@/utils/apiError';

const DAYS_PER_WEEK = 7;

/**
 * The read-only exam calendar: published sittings for the current semester, on
 * a month grid with the selected day's sittings listed underneath.
 */
function examCalendarManager() {
    const { customizeLanguageData } = useLanguageStore();
    const currentSemester = useCurrentSemester();
    const schedulingConstants = useSchedulingConstants();
    /** College → Department → Program → Section, shared with every other scheduling screen. */
    const scheduleFilters = useScheduleFilters();

    const isLoading = ref(false);
    const sittings = ref<ExamSchedule[]>([]);

    const load = async () => {
        await currentSemester.load();
        // Only for its weekday names — the month grid's column headers.
        await schedulingConstants.load();

        if (!currentSemester.semesterId.value) {
            sittings.value = [];
            return;
        }

        isLoading.value = true;
        try {
            const result = await fetchExamSchedules({
                semester_id: currentSemester.semesterId.value,
                status_code: EXAM_SCHEDULE_STATUS.PUBLISHED,
                ...scheduleFilters.params.value,
                limit: CALENDAR_PAGE_LIMIT
            });

            sittings.value = result.data;
        } catch (error: unknown) {
            toast.error(
                readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'))
            );
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * The sittings as the month grid reads them. Colour comes from the exam
     * type's own lookup value, so a final and a makeup are told apart at a
     * glance without a legend.
     */
    const events = computed<ScheduleEvent[]>(() =>
        sittings.value.map((sitting) => ({
            id: sitting.id,
            title: sitting.course_offering?.course_code || sitting.course_offering?.name || '—',
            tooltip: sitting.course_offering?.name ?? undefined,
            courseCode: sitting.course_offering?.course_code ?? undefined,
            courseTitle: sitting.course_offering?.course_title ?? undefined,
            invigilators: sitting.invigilators ?? undefined,
            subtitle: [
                roomLabel(sitting.room),
                `${sitting.required_invigilators} ${customizeLanguageData('invigilators', 'Invigilators')}`
            ].join(' · '),
            badge: sitting.exam_type?.name || sitting.exam_type_code || undefined,
            start: sitting.start_time,
            end: sitting.end_time,
            date: sitting.exam_date,
            color: sitting.exam_type?.color ?? null,
            statusLabel: sitting.status?.name ?? sitting.status_code ?? undefined,
            cohort: {
                sectionId: sitting.section?.id ?? null,
                sectionLabel: sitting.section?.name ?? null,
                programId: sitting.program?.id ?? null,
                programLabel: sitting.program?.name ?? null,
                departmentId: sitting.department?.id ?? null,
                departmentLabel: sitting.department?.name ?? null
            },
            record: sitting
        }))
    );

    /**
     * Monday-first weekday names for the month grid's header. The backend
     * catalogue is ISO-ordered (1 = Monday), which is the order the grid lays
     * its columns out in; anything other than a full week is left to the grid's
     * own English fallback rather than rendered short.
     */
    const weekdayNames = computed(() => {
        const names = schedulingConstants.dayOptions.value.map((day) => day.name);

        return names.length === DAYS_PER_WEEK ? names : undefined;
    });

    const isEmpty = computed(() => !isLoading.value && sittings.value.length === 0);

    /** The filters apply themselves; no Apply click stands between them and the calendar. */
    watch(() => scheduleFilters.params.value, load);

    return {
        isLoading,
        sittings,
        events,
        weekdayNames,
        isEmpty,
        currentSemester,
        schedulingConstants,
        scheduleFilters,
        load
    };
}

export const useExamCalendar = createSharedComposable(examCalendarManager);
