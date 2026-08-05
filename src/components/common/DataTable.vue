<script setup lang="ts">
import { ref, computed, useSlots } from 'vue';
import MainSelect from '@/components/common/MainSelect.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import MainPopover from '@/components/common/MainPopover.vue';
import type { Pagination } from '@/types/CommonTypes';
import { useFullscreen } from '@vueuse/core';
import { useTemplateRef } from 'vue';
const slots = useSlots();

type Item = { id: string | number; [key: string]: any };

interface ItemsProp {
    data: Item[];
    pagination?: Pagination;
}

type ColumnConfig = {
    field: string;
    label?: string;
    hide?: boolean;
};
const el = useTemplateRef('el');
const { isFullscreen, enter, exit, toggle } = useFullscreen(el);
const props = withDefaults(
    defineProps<{
        limit?: number;
        items: ItemsProp;
        isLoading?: boolean;
        headerStyle?: string;
        currentPage?: number;
        scrollable?: boolean;

        showHeaders?: boolean;
        showNumbers?: boolean;
        stripedRows?: boolean;
        scrollHeight?: string;

        showGridLines?: boolean;
        highlightOnSelect?: boolean;
        rowsPerPageOptions: number[];
        columnConfig?: ColumnConfig[];

        selectedItems?: number[] | null; // <-- now IDs only
        selectedItemData?: Item[] | null;
        searchFn?: ((query: string) => void) | null;
        appliedFilters?: { field: string; value: any }[];
        size?: 'small' | 'normal' | 'large';
    }>(),
    {
        size: 'normal',
        showSearch: true,
        scrollable: false,
        showHeaders: true,
        stripedRows: false,

        showNumbers: false,
        showGridLines: false,
        scrollHeight: undefined,
        highlightOnSelect: false,
        headerStyle: 'bg-gray-150 bg-white text-right'
    }
);

const emits = defineEmits<{
    (e: 'update:currentPage', value: number): void;
    (e: 'update:limit', value: number): void;
    (e: 'update:selectedItems', value: number[]): void;
    (e: 'update:selectedItemData', value: Item[]): void;
}>();

const sortKey = ref<string>('');
const sortAsc = ref<boolean>(true);
const searchQuery = ref<string>('');
const showFilterPopup = ref<boolean>(false);

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'small':
            return {
                header: 'px-2 py-1 text-xs',
                cell: 'px-2 py-1 text-xs'
            };
        case 'large':
            return {
                header: 'px-6 py-4 text-base',
                cell: 'px-6 py-4 text-base'
            };
        default: // normal
            return {
                header: 'px-4 py-2 text-sm',
                cell: 'px-4 py-2 text-sm'
            };
    }
});

const allSelected = computed({
    get: (): boolean => {
        const sel = props.selectedItems ?? [];
        const items = props.items?.data ?? [];
        if (!items.length) return false;
        // ensure every item id is present
        return sel.length > 0 && sel.length === items.length && items.every((it) => sel.includes(Number(it.id)));
    },
    set: (val: boolean) => {
        const items = props.items?.data ?? [];
        if (val) {
            const ids = items.map((it) => Number(it.id));
            emits('update:selectedItems', ids);
        } else {
            emits('update:selectedItems', []);
        }
    }
});

const allSelectedData = computed({
    get: (): boolean => {
        const sel = props.selectedItemData ?? [];
        const items = props.items?.data ?? [];
        if (!items.length) return false;
        // ensure every item id is present
        return items.every((it) => sel.some((s) => Number(s.id) === Number(it.id)));
    },
    set: (val: boolean) => {
        const items = props.items?.data ?? [];
        if (val) {
            emits('update:selectedItemData', items);
        } else {
            emits('update:selectedItemData', []);
        }
    }
});

const selectedLimit = computed(() => {
    if (props.limit) return props.limit;
    if (props.items?.pagination?.per_page) return props.items.pagination.per_page;
    return props.rowsPerPageOptions[0] ?? 10;
});
const dropdownOptions = computed(() => {
    const opts = props.rowsPerPageOptions.map((opt) => ({
        label: `${opt}`,
        value: opt
    }));

    // include backend per_page if it's not already in the list
    if (props.items?.pagination?.per_page && !opts.some((o) => o.value === props.items?.pagination?.per_page)) {
        opts.unshift({
            label: `${props.items.pagination.per_page}`,
            value: props.items.pagination.per_page
        });
    }

    return opts;
});
const pageNumbers = computed(() => {
    if (!props.items?.pagination) return [];
    const current = props.items.pagination.current_page;
    const last = props.items.pagination.last_page;

    // If total pages <= 7, show all pages
    if (last <= 7) {
        const pages: number[] = [];
        for (let i = 1; i <= last; i++) {
            pages.push(i);
        }
        return pages;
    }

    // Show pages around current page
    const pages: number[] = [];

    // Always show current page and 2 pages on each side
    const start = Math.max(2, current - 2);
    const end = Math.min(last - 1, current + 2);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
});

/**
 * First / last entries of `pageNumbers`, guarded. The ellipsis conditions below
 * index the array directly, which `noUncheckedIndexedAccess` widens to
 * `number | undefined`; an empty page list simply reads as page 0 and hides them.
 */
const firstPageNumber = computed(() => pageNumbers.value[0] ?? 0);
const lastPageNumber = computed(() => pageNumbers.value[pageNumbers.value.length - 1] ?? 0);

const sortedItems = computed<Item[]>(() => {
    let arr: Item[] = props.items?.data ? [...props.items.data] : [];

    if (sortKey.value) {
        arr.sort((a, b) => {
            let valA: any = sortKey.value.split('.').reduce((o, k) => o?.[k], a);
            let valB: any = sortKey.value.split('.').reduce((o, k) => o?.[k], b);

            // Handle null/undefined
            if (valA == null) valA = '';
            if (valB == null) valB = '';

            // Normalize strings for case-insensitive comparison
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortAsc.value ? -1 : 1;
            if (valA > valB) return sortAsc.value ? 1 : -1;
            return 0;
        });
    }

    return arr;
});

function toggleSort(col: string) {
    if (sortKey.value === col) {
        sortAsc.value = !sortAsc.value;
    } else {
        sortKey.value = col;
    }
}

function toggleRowSelection(id: number, checked?: boolean) {
    const current = Array.isArray(props.selectedItems) ? [...props.selectedItems] : [];

    const nId = Number(id);
    const idx = current.indexOf(nId);

    if (typeof checked === 'boolean') {
        if (checked) {
            if (idx === -1) current.push(nId);
        } else {
            if (idx !== -1) current.splice(idx, 1);
        }
    } else {
        if (idx === -1) current.push(nId);
        else current.splice(idx, 1);
    }

    emits('update:selectedItems', current);
}

const visibleColumns = ref<string[]>([]);
const columnPopover = ref<any>(null);

function togglePopover(event: Event) {
    columnPopover.value?.toggle(event);
}

function toggleRowDataSelection(id: number, checked?: boolean) {
    const currentData = Array.isArray(props.selectedItemData) ? [...props.selectedItemData] : [];
    const items = props.items?.data || [];

    const item = items.find((it) => Number(it.id) === Number(id));
    if (!item) return;

    const idx = currentData.findIndex((it) => Number(it.id) === Number(id));

    if (typeof checked === 'boolean') {
        if (checked) {
            if (idx === -1) currentData.push(item);
        } else {
            if (idx !== -1) currentData.splice(idx, 1);
        }
    } else {
        if (idx === -1) currentData.push(item);
        else currentData.splice(idx, 1);
    }

    emits('update:selectedItemData', currentData);
}

const allColumns = computed(() => {
    const slotNodes = slots.default?.() || [];
    return slotNodes
        .filter((vnode: any) => vnode.type?.name === 'Column' || vnode.type?.__name === 'Column')
        .map((col: any) => ({
            field: col.props?.field,
            header: col.props?.header,
            node: col
        }));
});

const hiddenColumns = ref<string[]>([]);

const columns = computed(() => {
    return allColumns.value.filter((c) => !hiddenColumns.value.includes(c.field)).map((c) => c.node);
});

function toggleColumn(field: string) {
    const idx = hiddenColumns.value.indexOf(field);
    if (idx === -1) {
        hiddenColumns.value.push(field);
    } else {
        hiddenColumns.value.splice(idx, 1);
    }
}
</script>

<template>
    <div
        ref="el"
        class="relative max-w-full overflow-auto rounded-lg bg-white dark:bg-gray-900"
        :class="isFullscreen ? 'p-4' : ''">
        <div class="flex flex-wrap items-center justify-between">
            <div v-if="$slots.header">
                <slot name="header" />
            </div>

            <!-- Column Visibility Toggle -->
            <div
                :class="$slots.search ? 'justify-between' : 'justify-end'"
                class="relative flex w-full items-center gap-2">
                <div v-if="$slots.search">
                    <slot name="search" />
                </div>
                <div class="flex items-center gap-2">
                    <button
                        @click="toggle"
                        class="flex cursor-pointer items-center gap-2 rounded-lg text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                        <i :class="isFullscreen ? 'fa-solid fa-compress text-lg' : 'fa-solid fa-expand text-lg'"></i>
                    </button>
                    <button
                        ref="columnsButtonRef"
                        @click="togglePopover"
                        class="flex cursor-pointer items-center gap-2 rounded-lg p-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                        <i class="fa-solid fa-table-columns text-lg"></i>
                    </button>

                    <MainPopover
                        ref="columnPopover"
                        :close-on-outside="true"
                        placement="left"
                        class="w-auto">
                        <div class="flex flex-col p-2">
                            <div
                                class="mb-2 px-2 text-xs font-semibold text-nowrap text-gray-500 uppercase dark:text-gray-400">
                                Visible Columns
                            </div>
                            <div class="flex flex-col gap-1 overflow-y-auto">
                                <label
                                    @click="toggleColumn(col.field)"
                                    v-for="col in allColumns"
                                    :key="col.field"
                                    class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <CheckBox
                                        :modelValue="!hiddenColumns.includes(col.field)"
                                        :binary="true"
                                        size="small" />
                                    <span class="text-sm text-nowrap text-gray-700 dark:text-gray-200">
                                        {{ col.header || col.field }}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </MainPopover>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div
            :class="{ 'overflow-x-auto': true, 'overflow-y-auto': scrollable && scrollHeight, 'h-44': isLoading }"
            :style="scrollable && scrollHeight ? { maxHeight: scrollHeight } : {}"
            class="relative max-w-full overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700">
            <table class="w-full text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
                <!-- Table Header -->
                <thead
                    v-if="showHeaders"
                    class="bg-gray-50 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <!-- Select All Checkbox -->
                        <th
                            v-if="props.selectedItems !== undefined"
                            class="px-6 py-3">
                            <CheckBox
                                v-model="allSelected"
                                :binary="true"
                                size="small" />
                        </th>

                        <th
                            v-if="props.selectedItemData !== undefined"
                            class="px-6 py-3">
                            <CheckBox
                                v-model="allSelectedData"
                                :binary="true"
                                size="small" />
                        </th>

                        <!-- Row Numbers -->
                        <th
                            v-if="showNumbers"
                            class="px-6 py-3">
                            #
                        </th>

                        <!-- Dynamic Columns -->
                        <th
                            v-for="(col, colIndex) in columns"
                            :key="colIndex"
                            @click="col.props?.sortable ? toggleSort(col.props?.field) : null"
                            class="cursor-pointer px-6 py-3 text-nowrap select-none">
                            <div class="flex items-center gap-2">
                                <span class="text-sm">{{ col.props?.header }}</span>
                                <template v-if="col.props?.sortable">
                                    <i
                                        v-if="sortKey !== col.props?.field"
                                        class="fa-solid fa-up-down text-xs text-gray-600 dark:text-gray-400"></i>

                                    <i
                                        v-else-if="sortAsc"
                                        class="fa-solid fa-arrow-down-wide-short text-xs text-gray-600 dark:text-gray-400"></i>

                                    <i
                                        v-else
                                        class="fa-solid fa-arrow-up-short-wide text-xs text-gray-600 dark:text-gray-400"></i>
                                </template>
                            </div>
                        </th>
                    </tr>
                </thead>

                <!-- Loading Overlay -->
                <div
                    v-if="isLoading"
                    class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 50 50">
                        <circle
                            cx="25"
                            cy="25"
                            r="20"
                            fill="none"
                            stroke="#3eaf7c"
                            stroke-width="5"
                            stroke-linecap="round"
                            stroke-dasharray="31.4 31.4">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 25 25"
                                to="360 25 25"
                                dur="1s"
                                repeatCount="indefinite" />
                        </circle>
                    </svg>
                </div>

                <!-- Empty State -->

                <!-- Table Body -->
                <tbody>
                    <tr
                        v-for="(row, rowIndex) in sortedItems"
                        :key="row.id"
                        class="border-b border-gray-200 transition-colors duration-150 hover:bg-gray-50 dark:border-gray-700 odd:dark:bg-gray-900 even:dark:bg-gray-800 hover:dark:bg-gray-700">
                        <!-- Checkbox -->
                        <td
                            v-if="props.selectedItems !== undefined"
                            class="px-6 py-4">
                            <CheckBox
                                :modelValue="(props.selectedItems ?? []).includes(Number(row.id))"
                                :binary="true"
                                size="small"
                                @change="
                                    (val) => toggleRowSelection(Number(row.id), Array.isArray(val) ? val[0] : val)
                                " />
                        </td>

                        <!-- Checkbox -->
                        <td
                            v-if="props.selectedItemData !== undefined"
                            class="px-6 py-4">
                            <CheckBox
                                :modelValue="
                                    (props.selectedItemData ?? []).some((it) => Number(it.id) === Number(row.id))
                                "
                                :binary="true"
                                size="small"
                                @change="
                                    (val) => toggleRowDataSelection(Number(row.id), Array.isArray(val) ? val[0] : val)
                                " />
                        </td>

                        <!-- Row Number -->
                        <td
                            v-if="showNumbers"
                            class="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {{ rowIndex + 1 }}
                        </td>

                        <!-- Dynamic Columns -->
                        <td
                            v-for="(col, colIndex) in columns"
                            :key="colIndex"
                            class="px-6 py-4 text-gray-700 dark:text-gray-300">
                            <template v-if="col.children && (col.children as Record<string, Function>).default">
                                <component
                                    :is="(col.children as Record<string, Function>).default"
                                    :row="row"
                                    :value="row[col.props?.field]" />
                            </template>
                            <template v-else>
                                {{ row[col.props?.field] }}
                            </template>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div
                v-if="!isLoading && !sortedItems?.length"
                class="flex w-full items-center justify-center bg-white py-10 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {{ $lang.recordsNotFound }}
            </div>
        </div>

        <div
            v-if="props.items.pagination"
            class="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 sm:flex-row dark:border-gray-700 dark:bg-gray-800">
            <!-- Left Side: Showing info + Per Page -->
            <div class="flex flex-wrap items-center gap-4">
                <!-- Showing Info -->
                <div class="text-sm text-gray-600 dark:text-gray-300">
                    {{ $lang.showing || 'Showing' }}
                    <span class="font-semibold text-gray-900 dark:text-white">
                        {{ props.items.pagination.from || 0 }}
                    </span>
                    {{ $lang.to || 'to' }}
                    <span class="font-semibold text-gray-900 dark:text-white">
                        {{ props.items.pagination.to || 0 }}
                    </span>
                    {{ $lang.of || 'of' }}
                    <span class="font-semibold text-gray-900 dark:text-white">
                        {{ props.items.pagination.total }}
                    </span>
                </div>

                <!-- Per Page Dropdown -->
                <div class="flex items-center gap-2">
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
                        @update:modelValue="
                            (val) => {
                                const total = props.items?.pagination?.total || 0;
                                const lastPage = Math.max(1, Math.ceil(total / val));
                                if (
                                    props.items?.pagination?.current_page &&
                                    props.items?.pagination?.current_page > lastPage
                                ) {
                                    emits('update:currentPage', lastPage);
                                }
                                emits('update:limit', val);
                            }
                        " />
                </div>
            </div>

            <!-- Right Side: Pagination Controls -->
            <div class="flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <!-- Previous Button -->
                <button
                    :disabled="props.items.pagination.current_page === 1"
                    @click="$emit('update:currentPage', props.items.pagination.current_page - 1)"
                    :class="[
                        'flex cursor-pointer items-center gap-2 border-r border-gray-300 bg-white px-4 py-2 text-sm font-medium transition-all duration-150 dark:border-gray-600 dark:bg-gray-800',
                        props.items.pagination.current_page === 1
                            ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    ]">
                    <i class="fa-solid fa-chevron-left text-xs"></i>
                    <span>{{ $lang.previous || 'Previous' }}</span>
                </button>

                <!-- First Page -->
                <button
                    v-if="!pageNumbers.includes(1)"
                    @click="$emit('update:currentPage', 1)"
                    :class="[
                        'cursor-pointer border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all dark:border-gray-600',
                        props.items.pagination.current_page === 1
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    ]">
                    1
                </button>

                <!-- Left Ellipsis -->
                <span
                    v-if="pageNumbers.length > 0 && firstPageNumber > 2"
                    class="cursor-pointer border-r border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    ...
                </span>

                <!-- Page Number Buttons -->
                <button
                    v-for="(page, index) in pageNumbers"
                    :key="page"
                    @click="$emit('update:currentPage', page)"
                    :class="[
                        'cursor-pointer px-3 py-2 text-sm font-medium transition-all',
                        index < pageNumbers.length - 1 ||
                        lastPageNumber < props.items.pagination.last_page - 1 ||
                        !pageNumbers.includes(props.items.pagination.last_page)
                            ? 'border-r border-gray-300 dark:border-gray-600'
                            : '',
                        page === props.items.pagination.current_page
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    ]">
                    {{ page }}
                </button>

                <!-- Right Ellipsis -->
                <span
                    v-if="
                        pageNumbers.length > 0 &&
                        lastPageNumber < props.items.pagination.last_page - 1
                    "
                    class="border-r border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    ...
                </span>

                <!-- Last Page -->
                <button
                    v-if="!pageNumbers.includes(props.items.pagination.last_page)"
                    @click="$emit('update:currentPage', props.items.pagination.last_page)"
                    :class="[
                        'border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all dark:border-gray-600',
                        props.items.pagination.current_page === props.items.pagination.last_page
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    ]">
                    {{ props.items.pagination.last_page }}
                </button>

                <!-- Next Button -->
                <button
                    :disabled="props.items.pagination.current_page === props.items.pagination.last_page"
                    @click="$emit('update:currentPage', props.items.pagination.current_page + 1)"
                    :class="[
                        'flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium transition-all duration-150 dark:bg-gray-800',
                        props.items.pagination.current_page === props.items.pagination.last_page
                            ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    ]">
                    <span>{{ $lang.next || 'Next' }}</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
        <!-- Footer -->
        <div
            v-if="$slots.footer"
            class="mt-2">
            <slot name="footer" />
        </div>
    </div>
</template>
