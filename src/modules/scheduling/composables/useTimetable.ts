import { ref, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentSemester } from '@/composables/useCurrentSemester';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { useScheduleFilters } from '@/modules/scheduling/composables/useScheduleFilters';
import { CLASS_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import { CALENDAR_PAGE_LIMIT } from '@/modules/scheduling/constants/scheduleView';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';
import { axisBoundsFromSlots, weekGridDays } from '@/modules/scheduling/composables/useCalendarLayout';
import type { ClassSchedule, DayOption } from '@/modules/scheduling/types/classSchedule';
import type { ScheduleEvent } from '@/modules/scheduling/types/calendar';
import { readApiErrorMessage } from '@/utils/apiError';

/**
 * The read-only weekly timetable: published meetings for the current semester,
 * drawn on an hour grid.
 *
 * No edit controls anywhere. Adjusting a meeting happens on the scheduling
 * screen, where the draft-only rule is enforced.
 */
function timetableManager() {
    const { customizeLanguageData } = useLanguageStore();
    const currentSemester = useCurrentSemester();
    const schedulingConstants = useSchedulingConstants();
    /** College → Department → Program → Section, shared with every other scheduling screen. */
    const scheduleFilters = useScheduleFilters();

    const isLoading = ref(false);
    const meetings = ref<ClassSchedule[]>([]);

    /** Narrow the grid to one teacher; the academic scope lives in the shared filter. */
    const instructorId = ref<number | null>(null);

    const load = async () => {
        await currentSemester.load();
        await schedulingConstants.load();

        if (!currentSemester.semesterId.value) {
            meetings.value = [];
            return;
        }

        isLoading.value = true;
        try {
            const result = await fetchClassSchedules({
                semester_id: currentSemester.semesterId.value,
                status_code: CLASS_SCHEDULE_STATUS.PUBLISHED,
                instructor_id: instructorId.value ?? undefined,
                ...scheduleFilters.params.value,
                limit: CALENDAR_PAGE_LIMIT
            });

            meetings.value = result.data;
        } catch (error: unknown) {
            toast.error(
                readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'))
            );
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * The meetings as the week grid reads them. Colour comes from the session
     * type's own lookup value, so a lab block looks like a lab everywhere the
     * institution has said it should.
     */
    const events = computed<ScheduleEvent[]>(() =>
        meetings.value.map((meeting) => ({
            id: meeting.id,
            // The block is small and prints on a wall chart: the code is the
            // identifier, the title only clutters it.
            title: meeting.course_offering?.course_code || meeting.course_offering?.name || '—',
            tooltip: meeting.course_offering?.name ?? undefined,
            courseCode: meeting.course_offering?.course_code ?? undefined,
            courseTitle: meeting.course_offering?.course_title ?? undefined,
            subtitle:
                [meeting.room?.name, meeting.instructor?.name].filter(Boolean).join(' · ') ||
                customizeLanguageData('noRoom', 'No room'),
            badge: meeting.session_type?.name ?? undefined,
            start: meeting.start_time,
            end: meeting.end_time,
            day: meeting.day_of_week,
            color: meeting.session_type?.color ?? null,
            dayLabel: schedulingConstants.dayName(meeting.day_of_week),
            statusLabel: meeting.status?.name ?? meeting.status_code ?? undefined,
            cohort: {
                sectionId: meeting.section?.id ?? null,
                sectionLabel: meeting.section?.name ?? null,
                programId: meeting.program?.id ?? null,
                programLabel: meeting.program?.name ?? null,
                departmentId: meeting.department?.id ?? null,
                departmentLabel: meeting.department?.name ?? null
            },
            record: meeting
        }))
    );

    const gridDays = computed<DayOption[]>(() =>
        weekGridDays(
            schedulingConstants.dayOptions.value,
            schedulingConstants.teachingDays.value,
            meetings.value.map((meeting) => meeting.day_of_week)
        )
    );

    const axisBounds = computed(() => axisBoundsFromSlots(schedulingConstants.timeSlots.value));

    const isEmpty = computed(() => !isLoading.value && meetings.value.length === 0);

    /**
     * The filters apply themselves — a grid that needs an Apply click to agree
     * with the controls above it just looks broken.
     *
     * One watcher over every control, so clearing them all reloads once rather
     * than once per control.
     */
    watch(() => ({ instructor_id: instructorId.value, ...scheduleFilters.params.value }), load);

    const clearFilters = () => {
        instructorId.value = null;
        scheduleFilters.clear();
    };

    return {
        isLoading,
        meetings,
        events,
        gridDays,
        axisBounds,
        isEmpty,
        instructorId,
        currentSemester,
        schedulingConstants,
        scheduleFilters,
        load,
        clearFilters
    };
}

export const useTimetable = createSharedComposable(timetableManager);
