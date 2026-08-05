import { ref, type Ref } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { readApiErrorMessage } from '@/utils/apiError';

/**
 * One record, fetched by uuid.
 *
 * NOT a shared composable, deliberately: each visit loads one record, and
 * leaving the page must not leave a stale one behind for the next. The same
 * reason `useOfferingDetail` is per-instance.
 *
 * A 404 is a first-class outcome rather than an error toast — a detail page for
 * a record that does not exist should say so on the page, not flash a message
 * over an empty shell.
 *
 * @param fetchOne the service's `getX(key)` — every service already has one
 */
export function useDetailResource<TItem>(fetchOne: (key: string) => Promise<TItem>) {
    const { customizeLanguageData } = useLanguageStore();

    const item = ref<TItem | null>(null) as Ref<TItem | null>;
    const isLoading = ref(false);
    const notFound = ref(false);

    /**
     * Load the record.
     *
     * @param key the uuid from the route
     */
    const load = async (key: string) => {
        isLoading.value = true;
        notFound.value = false;

        try {
            item.value = await fetchOne(key);
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;

            if (status === 404) {
                notFound.value = true;
            } else {
                toast.error(
                    readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'))
                );
            }

            item.value = null;
        } finally {
            isLoading.value = false;
        }
    };

    return { item, isLoading, notFound, load };
}
