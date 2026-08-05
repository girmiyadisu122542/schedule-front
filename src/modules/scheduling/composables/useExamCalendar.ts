import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentSemester } from '@/composables/useCurrentSemester';
import { EXAM_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import { fetchExamSchedules } from '@/modules/scheduling/services/examScheduleService';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';
import { readApiErrorMessage } from '@/utils/apiError';

/** One day of the calendar. */
export interface ExamDay {
    date: string;
    sittings: ExamSchedule[];
}

/** A whole exam period fits comfortably in one page; a calendar cannot paginate. */
const CALENDAR_PAGE_LIMIT = 500;

/**
 * The read-only exam calendar: published sittings for the current semester,
 * grouped by date.
 */
function examCalendarManager() {
    const { customizeLanguageData } = useLanguageStore();
    const currentSemester = useCurrentSemester();

    const isLoading = ref(false);
    const sittings = ref<ExamSchedule[]>([]);

    const load = async () => {
        await currentSemester.load();

        if (!currentSemester.semesterId.value) {
            sittings.value = [];
            return;
        }

        isLoading.value = true;
        try {
            const result = await fetchExamSchedules({
                semester_id: currentSemester.semesterId.value,
                status_code: EXAM_SCHEDULE_STATUS.PUBLISHED,
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
     * Sittings grouped by date, earliest first, each day's sittings in time
     * order. The backend already sorts by `exam_date` then `start_time`, so the
     * grouping only has to preserve that order.
     */
    const days = computed<ExamDay[]>(() => {
        const grouped = new Map<string, ExamSchedule[]>();

        sittings.value.forEach((sitting) => {
            const day = grouped.get(sitting.exam_date) ?? [];
            day.push(sitting);
            grouped.set(sitting.exam_date, day);
        });

        return [...grouped.entries()]
            .map(([date, entries]) => ({
                date,
                sittings: entries.sort((a, b) => a.start_time.localeCompare(b.start_time))
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    });

    const isEmpty = computed(() => !isLoading.value && sittings.value.length === 0);

    return { isLoading, sittings, days, isEmpty, currentSemester, load };
}

export const useExamCalendar = createSharedComposable(examCalendarManager);
