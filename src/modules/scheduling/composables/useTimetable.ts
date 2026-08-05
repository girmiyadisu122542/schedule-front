import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentSemester } from '@/composables/useCurrentSemester';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { CLASS_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import { readApiErrorMessage } from '@/utils/apiError';

/** One column of the weekly grid. */
export interface TimetableDay {
    id: number;
    name: string;
    meetings: ClassSchedule[];
}

/**
 * A page big enough to hold a whole semester's published timetable in one
 * request — the grid cannot paginate, because a week is the unit.
 */
const TIMETABLE_PAGE_LIMIT = 500;

/**
 * The read-only weekly timetable: published meetings for the current semester,
 * laid out day by day.
 *
 * No edit controls anywhere. Adjusting a meeting happens on the scheduling
 * screen, where the draft-only rule is enforced.
 */
function timetableManager() {
    const { customizeLanguageData } = useLanguageStore();
    const currentSemester = useCurrentSemester();
    const schedulingConstants = useSchedulingConstants();

    const isLoading = ref(false);
    const meetings = ref<ClassSchedule[]>([]);

    /** Narrow the grid to one cohort or one teacher; null means everything. */
    const sectionId = ref<number | null>(null);
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
                section_id: sectionId.value ?? undefined,
                instructor_id: instructorId.value ?? undefined,
                limit: TIMETABLE_PAGE_LIMIT
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
     * The grid: every weekday that has something on it, meetings in time order.
     *
     * Days with nothing scheduled are dropped rather than rendered empty — a
     * university that never teaches on Friday should not see a Friday column.
     */
    const days = computed<TimetableDay[]>(() =>
        schedulingConstants.dayOptions.value
            .map((day) => ({
                id: day.id,
                name: day.name,
                meetings: meetings.value
                    .filter((meeting) => meeting.day_of_week === day.id)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
            }))
            .filter((day) => day.meetings.length > 0)
    );

    const isEmpty = computed(() => !isLoading.value && meetings.value.length === 0);

    const applyFilters = async () => {
        await load();
    };

    const clearFilters = async () => {
        sectionId.value = null;
        instructorId.value = null;
        await load();
    };

    return {
        isLoading,
        meetings,
        days,
        isEmpty,
        sectionId,
        instructorId,
        currentSemester,
        load,
        applyFilters,
        clearFilters
    };
}

export const useTimetable = createSharedComposable(timetableManager);
