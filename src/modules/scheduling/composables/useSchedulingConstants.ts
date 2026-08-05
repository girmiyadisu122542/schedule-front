import { ref, computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { fetchSchedulingConstants } from '@/modules/scheduling/services/generationRunService';
import { FALLBACK_DAY_NAMES, MONDAY } from '@/modules/scheduling/constants/classScheduleStatus';
import type { DayOption, TimeSlot } from '@/modules/scheduling/types/classSchedule';

/**
 * Weekday labels and the daily slot grid, hydrated once from
 * `GET /constants/scheduling`.
 *
 * `class_schedules.day_of_week` is a plain smallint with a CHECK, not a lookup
 * type — the calendar is not a vocabulary a university edits — so its labels
 * come from this endpoint rather than from `/lookup`. The backend stays the
 * runtime source of truth: changing the slot grid needs no frontend redeploy.
 * The fallbacks below only cover the window before the first response.
 */
function schedulingConstants() {
    const days = ref<DayOption[]>([]);
    const teachingDays = ref<number[]>([]);
    const timeSlots = ref<TimeSlot[]>([]);
    const isLoaded = ref(false);

    const dayOptions = computed<DayOption[]>(() =>
        days.value.length ? days.value : FALLBACK_DAY_NAMES.map((name, index) => ({ id: index + MONDAY, name }))
    );

    /** 1 → "Monday". Falls back to the number so a row never renders blank. */
    const dayName = (day: number | null | undefined): string => {
        if (!day) return '—';

        return dayOptions.value.find((option) => option.id === day)?.name ?? String(day);
    };

    const load = async (force = false) => {
        if (isLoaded.value && !force) return;

        try {
            const constants = await fetchSchedulingConstants();
            days.value = constants.days_of_week ?? [];
            teachingDays.value = constants.teaching_days ?? [];
            timeSlots.value = constants.time_slots ?? [];
            isLoaded.value = true;
        } catch {
            // A failed hydrate is not worth a toast — the fallbacks keep every
            // screen readable, and the next visit tries again.
        }
    };

    return { days, dayOptions, teachingDays, timeSlots, isLoaded, dayName, load };
}

export const useSchedulingConstants = createSharedComposable(schedulingConstants);
