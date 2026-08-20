import { ref, computed, watch } from 'vue';
import { roomLabel } from '@/modules/scheduling/utils/roomLabel';
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
 * The read-only weekly timetable: published sessions for the current semester,
 * drawn on an hour grid.
 *
 * No edit controls anywhere. Adjusting a session happens on the scheduling
 * screen, where the draft-only rule is enforced.
 */
function timetableManager() {
    const { customizeLanguageData } = useLanguageStore();
    const currentSemester = useCurrentSemester();
    const schedulingConstants = useSchedulingConstants();
    /** College → Department → Program → Section, shared with every other scheduling screen. */
    const scheduleFilters = useScheduleFilters();

    const isLoading = ref(false);
    const sessions = ref<ClassSchedule[]>([]);

    /** Narrow the grid to one teacher; the academic scope lives in the shared filter. */
    const instructorId = ref<number | null>(null);

    const load = async () => {
        await currentSemester.load();
        await schedulingConstants.load();

        if (!currentSemester.semesterId.value) {
            sessions.value = [];
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

            sessions.value = result.data;
        } catch (error: unknown) {
            toast.error(
                readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'))
            );
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * The sessions as the week grid reads them. Colour comes from the session
     * type's own lookup value, so a lab block looks like a lab everywhere the
     * institution has said it should.
     */
    const events = computed<ScheduleEvent[]>(() =>
        sessions.value.map((session) => ({
            id: session.id,
            // The block is small and prints on a wall chart: the code is the
            // identifier, the title only clutters it.
            title: session.course_offering?.course_code || session.course_offering?.name || '—',
            tooltip: session.course_offering?.name ?? undefined,
            courseCode: session.course_offering?.course_code ?? undefined,
            courseTitle: session.course_offering?.course_title ?? undefined,
            // Always leads with the room, so an unplaced session reads
            // "NRA · Dr Alemu" rather than hiding that it has nowhere to go.
            subtitle: [roomLabel(session.room), session.instructor?.name].filter(Boolean).join(' · '),
            badge: session.session_type?.name ?? undefined,
            start: session.start_time,
            end: session.end_time,
            day: session.day_of_week,
            color: session.session_type?.color ?? null,
            dayLabel: schedulingConstants.dayName(session.day_of_week),
            statusLabel: session.status?.name ?? session.status_code ?? undefined,
            cohort: {
                sectionId: session.section?.id ?? null,
                sectionLabel: session.section?.name ?? null,
                programId: session.program?.id ?? null,
                programLabel: session.program?.name ?? null,
                departmentId: session.department?.id ?? null,
                departmentLabel: session.department?.name ?? null
            },
            record: session
        }))
    );

    const gridDays = computed<DayOption[]>(() =>
        weekGridDays(
            schedulingConstants.dayOptions.value,
            schedulingConstants.teachingDays.value,
            sessions.value.map((session) => session.day_of_week)
        )
    );

    const axisBounds = computed(() => axisBoundsFromSlots(schedulingConstants.timeSlots.value));

    const isEmpty = computed(() => !isLoading.value && sessions.value.length === 0);

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
        sessions,
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
