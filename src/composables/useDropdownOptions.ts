import { storeToRefs } from 'pinia';
import { ref, watch, onMounted, unref, isRef, type Ref } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import { createSharedComposable } from '@vueuse/core';
import { useLanguageStore } from '@/stores/languageStore';

const { translations } = storeToRefs(useLanguageStore());
const dropdownSharedComposables: Record<string, any> = {};

function stableSerialize(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => typeof v !== 'function')
            .sort(([a], [b]) => a.localeCompare(b));
        return `{${entries.map(([k, v]) => `${k}:${stableSerialize(v)}`).join(',')}}`;
    }
    return String(value);
}

function createDropdownKey(
    endpoint: string,
    initialParams: Record<string, any>,
    params: Record<string, any> | Ref<Record<string, any>>,
    debounceMs: number,
    keepLocalAlive: boolean
) {
    return [
        endpoint,
        stableSerialize(initialParams),
        stableSerialize(unref(params)),
        debounceMs,
        keepLocalAlive ? '1' : '0'
    ].join('|');
}

export function useDropdownOptions<T extends { id: unknown } = { id: number; name: string }>(
    endpoint: string,
    initialParams: Record<string, any> = {},
    debounceMs = 300,
    autoFetch = false,
    params: Record<string, any> | Ref<Record<string, any>> = {},
    keepLocalAlive = false
) {
    const singletonKey = createDropdownKey(endpoint, initialParams, params, debounceMs, keepLocalAlive);
    if (!dropdownSharedComposables[singletonKey]) {
        dropdownSharedComposables[singletonKey] = createSharedComposable(() => {
            const options = ref<T[]>([]);
            const loading = ref<boolean>(false);
            const error = ref<string | null>(null);
            const searchQuery = ref<string>('');
            const currentPage = ref<number>(1);
            const limit = ref<number>(initialParams.limit || 20);
            const userParams = ref<Record<string, any>>({});

            let debounceTimeout: any = null;
            function debouncedFetchOptions() {
                if (debounceTimeout) clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    fetchOptions(true, userParams.value);
                }, debounceMs);
            }

            async function fetchOptions(
                force = false,
                newParams: Record<string, any> = {},
                extraOptions?: any,
                excludeId?: number
            ) {
                if (!force && options.value.length > 0 && !searchQuery.value) return;
                loading.value = true;
                error.value = null;
                try {
                    const requestParams = {
                        ...initialParams,
                        ...unref(params),
                        ...newParams,
                        page: currentPage.value,
                        limit: limit.value,
                        search: searchQuery.value
                    };
                    userParams.value = newParams;

                    const response = await axiosInstance.get(endpoint, { params: requestParams });
                    if (Array.isArray(response.data.data)) {
                        if (keepLocalAlive) {
                            const responseIds = response.data.data.map((item: any) => item.id);
                            const filteredExisting = options.value.filter(
                                (item: any) => !responseIds.includes(item.id)
                            );
                            options.value = [...response.data.data, ...filteredExisting];
                        } else {
                            options.value = response.data.data;
                        }
                    } else {
                        options.value = [];
                    }

                    if (extraOptions) {
                        const extras = Array.isArray(extraOptions) ? extraOptions : [extraOptions];
                        options.value = [
                            ...options.value,
                            ...extras.filter((extraItem) => !options.value.some((option) => option.id === extraItem.id))
                        ];
                    }

                    if (excludeId) {
                        options.value = options.value.filter((option) => option.id !== excludeId);
                    }
                } catch (err: any) {
                    error.value =
                        err.response?.data?.message ||
                        err.message ||
                        translations.value?.failedOptionLoad ||
                        'Failed to load options';
                    options.value = [];
                } finally {
                    loading.value = false;
                }
            }

            watch(
                () => [searchQuery.value, currentPage.value],
                () => {
                    debouncedFetchOptions();
                }
            );

            if (isRef(params)) {
                watch(
                    params,
                    () => {
                        fetchOptions(true);
                    },
                    { immediate: false }
                );
            }

            onMounted(() => {
                if (autoFetch && (options.value.length === 0 || searchQuery.value)) {
                    fetchOptions();
                }
            });

            return {
                options,
                loading,
                error,
                searchQuery,
                currentPage,
                limit,
                fetchOptions,
                debouncedFetchOptions
            };
        });
    }

    return dropdownSharedComposables[singletonKey]();
}
