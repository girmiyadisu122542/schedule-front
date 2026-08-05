import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { readApiErrorMessage } from '@/utils/apiError';
import { fetchDashboardStats, type DashboardStats } from '@/services/dashboardService';

/**
 * The landing screen's figures.
 *
 * One request, four numbers — the backend does the aggregating so the dashboard
 * never fans out into a request per card.
 */
function dashboardManager() {
    const { customizeLanguageData } = useLanguageStore();

    const isLoading = ref(false);
    const stats = ref<DashboardStats | null>(null);

    const load = async () => {
        isLoading.value = true;
        try {
            stats.value = await fetchDashboardStats();
        } catch (error: unknown) {
            toast.error(
                readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'))
            );
        } finally {
            isLoading.value = false;
        }
    };

    return { isLoading, stats, load };
}

export const useDashboard = createSharedComposable(dashboardManager);
