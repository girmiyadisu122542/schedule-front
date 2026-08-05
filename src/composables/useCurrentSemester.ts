import { ref, computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import axiosInstance from '@/api/axiosInstance';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';

/** The semester every read-only view scopes itself to. */
export interface CurrentSemester {
    id: number;
    uuid: string;
    name: string;
}

/**
 * The one semester flagged `is_current`.
 *
 * Read from `/semesters?is_current=true` rather than from the dashboard's
 * aggregate, so a user who can see the timetable but not the dashboard still
 * gets it — the two screens are gated on different permissions.
 *
 * A partial unique index guarantees at most one such row exists, so taking the
 * first is not a guess.
 */
function currentSemesterManager() {
    const semester = ref<CurrentSemester | null>(null);
    const isLoading = ref(false);
    const isLoaded = ref(false);

    const semesterId = computed(() => semester.value?.id ?? null);

    const load = async (force = false) => {
        if (isLoaded.value && !force) return;

        isLoading.value = true;
        try {
            const response = await axiosInstance.get('/semesters', {
                params: { is_current: true, [DROPDOWN_PARAM_KEY]: true }
            });

            semester.value = response.data.data?.[0] ?? null;
            isLoaded.value = true;
        } catch {
            // A failed lookup leaves the views empty rather than toasting on
            // every mount; the caller's own fetch reports what went wrong.
        } finally {
            isLoading.value = false;
        }
    };

    return { semester, semesterId, isLoading, isLoaded, load };
}

export const useCurrentSemester = createSharedComposable(currentSemesterManager);
