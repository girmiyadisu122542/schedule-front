<script setup lang="ts">
import { computed } from 'vue';

import MainSelect from '@/components/common/MainSelect.vue';
import LeftArrowIcon from '@/assets/icons/LeftArrowIcon.vue';
import RightArrowIcon from '@/assets/icons/RightArrowIcon.vue';

import { MAX_VISIBLE_PAGES, PAGINATION_OFFSET, PAGINATION_OPTIONS } from '@/config/appConfig';
import type { Pagination } from '@/types/CommonTypes';

/**
 * Standalone pagination control extracted from MainTable so that
 * non-table surfaces (the icon library Grid + By-Type views, picker
 * popovers, etc.) can render the same paginator the table uses.
 *
 * Visual parity with MainTable -- copy of the same markup so the two
 * stay in lockstep until MainTable is refactored to consume this
 * component itself.
 */
const props = withDefaults(
    defineProps<{
        pagination: Pagination | null;
        limit?: number;
        rowsPerPageOptions?: number[];
        showPerPage?: boolean;
    }>(),
    {
        limit: undefined,
        rowsPerPageOptions: () => [...PAGINATION_OPTIONS],
        showPerPage: true
    }
);

const emit = defineEmits<{
    (e: 'update:currentPage', value: number): void;
    (e: 'update:limit', value: number): void;
}>();

const selectedLimit = computed(() => {
    if (props.limit) return props.limit;
    if (props.pagination?.per_page) return props.pagination.per_page;
    return props.rowsPerPageOptions[0] ?? 10;
});

const dropdownOptions = computed(() => {
    const options = props.rowsPerPageOptions.map((option) => ({
        label: `${option}`,
        value: option
    }));

    // Surface the backend-returned per_page even when it is not in the
    // dropdown defaults (e.g. someone customised limit=15 on the wire).
    if (props.pagination?.per_page && !options.some((o) => o.value === props.pagination?.per_page)) {
        options.unshift({
            label: `${props.pagination.per_page}`,
            value: props.pagination.per_page
        });
    }

    return options;
});

const pageNumbers = computed<number[]>(() => {
    if (!props.pagination) return [];
    const current = props.pagination.current_page;
    const last = props.pagination.last_page;

    if (last <= MAX_VISIBLE_PAGES) {
        const pages: number[] = [];
        for (let i = 1; i <= last; i++) pages.push(i);
        return pages;
    }

    const pages: number[] = [];
    const start = Math.max(PAGINATION_OFFSET, current - 2);
    const end = Math.min(last - 1, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
});

const firstPage = computed(() => pageNumbers.value?.[0]);
const lastPage = computed(() => pageNumbers.value?.[pageNumbers.value.length - 1]);

function onLimitChange(val: number): void {
    const total = props.pagination?.total || 0;
    const computedLastPage = Math.max(1, Math.ceil(total / val));
    if (props.pagination?.current_page && props.pagination.current_page > computedLastPage) {
        emit('update:currentPage', computedLastPage);
    }
    emit('update:limit', val);
}
</script>

<template>
    <div
        v-if="pagination && pagination.last_page > 1"
        class="flex flex-wrap items-center justify-between gap-3">
        <div
            v-if="showPerPage"
            class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ $lang.perPage || 'Per Page:' }}
            </span>
            <MainSelect
                class="w-24"
                :modelValue="selectedLimit"
                :options="dropdownOptions"
                placeholder="10"
                size="small"
                variant="outlined"
                @update:modelValue="(val: number) => onLimitChange(val)" />
        </div>

        <div class="flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
            <button
                :disabled="pagination.current_page === 1"
                @click="$emit('update:currentPage', pagination.current_page - 1)"
                :class="[
                    'flex cursor-pointer items-center gap-2 border-r border-gray-300 bg-white px-4 py-2 text-sm font-medium transition-all duration-150 dark:border-gray-600 dark:bg-gray-800',
                    pagination.current_page === 1
                        ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                ]">
                <LeftArrowIcon />
                <span>{{ $lang.previous || 'Previous' }}</span>
            </button>

            <button
                v-if="!pageNumbers.includes(1)"
                @click="$emit('update:currentPage', 1)"
                :class="[
                    'cursor-pointer border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all dark:border-gray-600',
                    pagination.current_page === 1
                        ? 'bg-schedule-brand-blue text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                ]">
                1
            </button>

            <span
                v-if="pageNumbers.length > 0 && firstPage && firstPage > 2"
                class="border-r border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                ...
            </span>

            <button
                v-for="(page, index) in pageNumbers"
                :key="page"
                @click="$emit('update:currentPage', page)"
                :class="[
                    'cursor-pointer px-3 py-2 text-sm font-medium transition-all',
                    index < pageNumbers.length - 1 ||
                    pageNumbers[pageNumbers.length - 1]! < pagination.last_page - 1 ||
                    !pageNumbers.includes(pagination.last_page)
                        ? 'border-r border-gray-300 dark:border-gray-600'
                        : '',
                    page === pagination.current_page
                        ? 'bg-schedule-brand-blue text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                ]">
                {{ page }}
            </button>

            <span
                v-if="pageNumbers.length > 0 && lastPage && lastPage < pagination.last_page - 1"
                class="border-r border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                ...
            </span>

            <button
                v-if="!pageNumbers.includes(pagination.last_page)"
                @click="$emit('update:currentPage', pagination.last_page)"
                :class="[
                    'border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all dark:border-gray-600',
                    pagination.current_page === pagination.last_page
                        ? 'bg-schedule-brand-blue text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                ]">
                {{ pagination.last_page }}
            </button>

            <button
                :disabled="pagination.current_page === pagination.last_page"
                @click="$emit('update:currentPage', pagination.current_page + 1)"
                :class="[
                    'flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium transition-all duration-150 dark:bg-gray-800',
                    pagination.current_page === pagination.last_page
                        ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                ]">
                <span>{{ $lang.next || 'Next' }}</span>
                <RightArrowIcon />
            </button>
        </div>
    </div>
</template>