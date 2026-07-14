<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { ref, computed, type Component } from 'vue';

import Badge from '@/components/common/Badge.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MultipleSelect from '@/components/common/MultipleSelect.vue';
import FullscreenMenu from '@/components/common/FullscreenMenu.vue';

import { useLanguageStore } from '@/stores/languageStore';

import Filter from '@/assets/icons/Filter.vue';
import DragIcon from '@/assets/icons/DragIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import SearchIcon from '@/assets/icons/Search.vue';
import SortIcon from '@/assets/icons/SortIcon.vue';
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import ImportIcon from '@/assets/icons/ImportIcon.vue';
import ExportIcon from '@/assets/icons/ExportIcon.vue';
import ColumnSolid from '@/assets/icons/ColumnSolid.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon.vue';
import LeftArrowIcon from '@/assets/icons/LeftArrowIcon.vue';
import RightArrowIcon from '@/assets/icons/RightArrowIcon.vue';
import MoreVerticalIcon from '@/assets/icons/MoreVerticalIcon.vue';
import RightChevronIcon from '@/assets/icons/RightChevronIcon.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';
import SpinnerIcon from '@/assets/icons/SpinnerIcon.vue';

import type { ApiResponse } from '@/types/CommonTypes';
import {
    CHILDREN_KEY,
    ASC_KEY_ORDER,
    DESC_KEY_ORDER,
    MAX_VISIBLE_PAGES,
    PAGINATION_OFFSET,
    TABLE_VISIBLE_ACTIONS,
    CONTROL_SIZE,
    CONTROL_VARIANT_OUTLINED,
    COLUMN_ALIGN,
    VARIANT_NONE,
    BULK_ACTION_SCOPE,
    BULK_ACTION_VARIANT,
    type ColumnAlign,
    type ComponentSize,
    type BadgeVariant,
    type BulkActionScope,
    type BulkActionVariant
} from '@/config/appConfig';

const languageStore = useLanguageStore();

const { customizeLanguageData } = languageStore;

type Item = {
    id?: string | number;
    [key: string]: any;
};
interface Column {
    key: string;
    label: string;
    align?: ColumnAlign;
    hidden?: boolean;
    visible?: boolean;
}
export interface FilterOption {
    label: string;
    key: string;
    value?: any;
    search?: boolean;
    loading?: boolean;
    /** Render this filter as a multi-select; the emitted value is an array of option values (empty = cleared). */
    multiple?: boolean;
    searchQueryParam?: string;
    options: { label: string; value: any }[];
}
export interface BulkActionOption {
    label: string;
    icon?: Component;
    variant?: BadgeVariant | typeof VARIANT_NONE;
    size: ComponentSize;
    value: any;
}
export interface BulkAction {
    label: string;
    icon?: Component;
    onClick: (items: Item[], optionValue?: any) => void;
    variant?: BulkActionVariant;
    options?: BulkActionOption[];
}
interface Props {
    limit?: number;
    items: ApiResponse<Item>;
    columns: Column[];
    loading?: boolean;
    showSearch?: boolean;
    showAddButton?: boolean;
    showFilter?: boolean;
    showSort?: boolean;
    showColumnToggle?: boolean;

    addButtonLabel?: string;
    searchPlaceholder?: string;
    addIcon?: Component | null;
    filterFields?: FilterOption[];
    bulkActions?: BulkAction[];
    totalEntries?: number | null;
    selectedItems?: number[] | null;
    selectedItemData?: Item[] | null;
    rowsPerPageOptions?: number[];
    selectable?: boolean;
    showIndex?: boolean;
    title?: string;
    subtitle?: string;
    /** Show a total-count pill next to the title (opt-in; Sales lists enable it). */
    showCount?: boolean;
    isFullScreenOn?: boolean;

    expandable?: boolean;
    childrenKey?: string;
    /** When true, expanded children render as real column-aligned rows
     *  (mirroring the parent columns) instead of the `expanded-row` slot.
     *  Children cells use the same `cell-<key>` slots with a `child` flag;
     *  the row action uses the `child-action` slot. */
    alignChildren?: boolean;
    cssClases?: string;
    needActionColumn?: boolean;
    serverSideFilter?: boolean;

    showRefresh?: boolean;
    showImport?: boolean;
    showExport?: boolean;
    /** Optional text label for the import button; when omitted the button stays icon-only. */
    importLabel?: string;
    /** Optional text label for the export button; when omitted the button stays icon-only. */
    exportLabel?: string;
    columnPersistKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
    showSearch: true,
    showAddButton: true,
    showFilter: true,
    showSort: true,
    showColumnToggle: true,
    addButtonLabel: undefined,
    addIcon: PlusIcon,
    loading: false,
    totalEntries: null,
    showCount: false,
    filterFields: () => [],
    rowsPerPageOptions: () => [10, 25, 50],
    selectable: false,
    showIndex: false,
    needActionColumn: true,
    isFullScreenOn: true,
    expandable: false,
    childrenKey: CHILDREN_KEY,
    alignChildren: false,
    serverSideFilter: false,
    showRefresh: false,
    showImport: false,
    showExport: false,
    importLabel: undefined,
    exportLabel: undefined,
    columnPersistKey: undefined
});

const emit = defineEmits<{
    (e: 'add'): void;
    (e: 'search', value: string): void;
    (e: 'pageChange', value: { page: number; perPage: number }): void;
    (e: 'action', value?: any): void;
    (e: 'filter-change', value: Record<string, any>): void;
    (e: 'filter-search', value: { key: string; query: string }): void;
    (e: 'sort', value: { key: string | null; order: typeof ASC_KEY_ORDER | typeof DESC_KEY_ORDER }): void;
    (e: 'update:currentPage', value: number): void;
    (e: 'update:limit', value: number): void;
    (e: 'update:selectedItems', value: number[]): void;
    (e: 'selection-change', value: Item[]): void;
    (e: 'expand', id: string | number): void;
    (e: 'selectAllPages', value?: any): void;
    (e: 'refresh'): void;
    (e: 'import'): void;
    (e: 'export'): void;
}>();

const sortConfig = ref<{ key: string | null; order: typeof ASC_KEY_ORDER | typeof DESC_KEY_ORDER }>({
    key: null,
    order: ASC_KEY_ORDER
});

const isFullscreen = ref(false);
const toggle = () => {
    isFullscreen.value = !isFullscreen.value;
};

const isSortVisible = ref(false);
const isFilterVisible = ref(false);
const isOverflowOpen = ref(false);
const isAllPagesSelected = ref(false);
const isColumnMenuVisible = ref(false);
const selectedRows = ref<Item[]>([]);
const selectedFilters = ref<Record<string, any>>({});
const sortMenuRef = useTemplateRef('sortMenuRef');
const sortButtonRef = useTemplateRef('sortButtonRef');
const columnMenuRef = useTemplateRef('columnMenuRef');
const COLUMN_PREFS_PREFIX = 'schedule.table.columns.';

function defaultHiddenColumns(): Set<string> {
    return new Set(
        props.columns
            .filter((col: Column) => col.hidden === true || col.visible === false)
            .map((col: Column) => col.key)
    );
}

function loadHiddenColumns(): Set<string> {
    if (props.columnPersistKey) {
        try {
            const raw = localStorage.getItem(COLUMN_PREFS_PREFIX + props.columnPersistKey);
            if (raw) return new Set(JSON.parse(raw) as string[]);
        } catch {
            // ignore malformed persisted preferences
        }
    }
    return defaultHiddenColumns();
}

const hiddenColumns = ref<Set<string>>(loadHiddenColumns());

function persistHiddenColumns(): void {
    if (!props.columnPersistKey) return;
    try {
        localStorage.setItem(COLUMN_PREFS_PREFIX + props.columnPersistKey, JSON.stringify([...hiddenColumns.value]));
    } catch {
        // ignore storage write failures (private mode / quota)
    }
}
const MAX_VISIBLE_ACTIONS = TABLE_VISIBLE_ACTIONS;
const overflowMenuRef = useTemplateRef('overflowMenuRef');
const openBulkActionMenu = ref<string | null>(null);

const visibleActions = computed(() => {
    return props.bulkActions?.slice(0, MAX_VISIBLE_ACTIONS) || [];
});

const overflowActions = computed(() => {
    return props.bulkActions?.slice(MAX_VISIBLE_ACTIONS) || [];
});

const expandedRows = ref<Set<string | number>>(new Set());
const loadingRows = ref<Set<string | number>>(new Set());

const firstPage = computed(() => pageNumbers.value?.[0]);
const lastPage = computed(() => pageNumbers.value?.[pageNumbers.value.length - 1]);
const selectedCount = computed(() => selectedRows.value.length);
const activeFilterCount = computed(() => Object.keys(selectedFilters.value).length);

const visibleColumns = computed(() => {
    return props.columns.filter((col) => !hiddenColumns.value.has(col.key));
});

const resolvedAddButtonLabel = computed(() => {
    return customizeLanguageData('createNew', 'Create New');
});

const getBulkActionKey = (action: BulkAction, scope: BulkActionScope, index: number) =>
    `${scope}-${index}-${action.label}`;

const hasBulkActionOptions = (action: BulkAction) => Boolean(action.options?.length);

const toggleBulkActionMenu = (key: string) => {
    openBulkActionMenu.value = openBulkActionMenu.value === key ? null : key;
};

const handleBulkActionClick = (action: BulkAction, key?: string) => {
    if (hasBulkActionOptions(action)) {
        if (key) {
            toggleBulkActionMenu(key);
        }
        return;
    }

    action.onClick([...selectedRows.value]);
    openBulkActionMenu.value = null;
    isOverflowOpen.value = false;
};

const handleBulkActionOptionSelect = (action: BulkAction, option: BulkActionOption) => {
    action.onClick([...selectedRows.value], option.value);
    openBulkActionMenu.value = null;
    isOverflowOpen.value = false;
};

const toggleExpand = (row: Item) => {
    if (row.id && expandedRows.value.has(row.id)) {
        expandedRows.value.delete(row.id);
    } else if (row.id) {
        expandedRows.value.add(row.id);
        if (!row[props.childrenKey] || row[props.childrenKey].length > 0) {
            emit('expand', row.id);
        }
    }
};

const toggleColumn = (key: string) => {
    if (hiddenColumns.value.has(key)) {
        hiddenColumns.value.delete(key);
    } else {
        hiddenColumns.value.add(key);
    }
    persistHiddenColumns();
};
const isExpanded = (id: string | number | undefined) => id && expandedRows.value.has(id);

const getSelectedIds = (): number[] => {
    return selectedRows.value.map((item) => Number(item.id)).filter((id) => !isNaN(id));
};
const toggleFilter = () => {
    isFilterVisible.value = !isFilterVisible.value;
};

const selectedLimit = computed(() => {
    if (props.limit) return props.limit;
    if (props.items?.pagination?.per_page) return props.items.pagination.per_page;
    return props.rowsPerPageOptions[0] ?? 10;
});
const dropdownOptions = computed(() => {
    const options = props.rowsPerPageOptions.map((option) => ({
        label: `${option}`,
        value: option
    }));

    if (props.items?.pagination?.per_page && !options.some((o) => o.value === props.items?.pagination?.per_page)) {
        options.unshift({
            label: `${props.items.pagination.per_page}`,
            value: props.items.pagination.per_page
        });
    }

    return options;
});

const pageNumbers = computed(() => {
    if (!props.items?.pagination) return [];
    const current = props.items.pagination.current_page;
    const last = props.items.pagination.last_page;

    if (last <= MAX_VISIBLE_PAGES) {
        const pages: number[] = [];
        for (let i = 1; i <= last; i++) {
            pages.push(i);
        }
        return pages;
    }

    const pages: number[] = [];

    const start = Math.max(PAGINATION_OFFSET, current - 2);
    const end = Math.min(last - 1, current + 2);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
});

const toggleSort = () => {
    isSortVisible.value = !isSortVisible.value;
    if (isSortVisible.value) isFilterVisible.value = false;
};

const handleSortSelection = (keyOrOrder: string) => {
    if (keyOrOrder === ASC_KEY_ORDER || keyOrOrder === DESC_KEY_ORDER) {
        sortConfig.value.order = keyOrOrder;
    } else {
        sortConfig.value.key = keyOrOrder;
    }

    emit('sort', { ...sortConfig.value });
};
const handleFilterUpdate = (key: string, value: any) => {
    const isCleared =
        value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0);
    if (isCleared) {
        delete selectedFilters.value[key];
    } else {
        selectedFilters.value[key] = value;
    }

    emit('filter-change', { ...selectedFilters.value });
};

const displayData = computed(() => {
    let data = [...(props.items?.data || [])];

    if (!props.serverSideFilter) {
        Object.entries(selectedFilters.value).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    data = data.filter((item) => value.some((selected) => String(item[key]) === String(selected)));
                }
            } else if (value !== null && value !== undefined && value !== '') {
                data = data.filter((item) => {
                    return String(item[key]) === String(value);
                });
            }
        });
    }

    if (sortConfig.value.key) {
        data.sort((a, b) => {
            const aVal = a[sortConfig.value.key!];
            const bVal = b[sortConfig.value.key!];

            if (aVal === bVal) return 0;
            const modifier = sortConfig.value.order === ASC_KEY_ORDER ? 1 : -1;
            return aVal > bVal ? 1 * modifier : -1 * modifier;
        });
    }

    return data;
});
const isActuallyLoading = computed(() => {
    return props.loading && (!props.items?.data || props.items.data.length === 0);
});
const SKELETON_COLUMN_WIDTHS = ['70%', '45%', '85%', '55%', '60%', '40%', '75%'];
const skeletonRowCount = computed(() => {
    const requested = props.limit && props.limit > 0 ? props.limit : 8;
    return Math.min(requested, 8);
});
const skeletonWidth = (index: number): string => SKELETON_COLUMN_WIDTHS[index % SKELETON_COLUMN_WIDTHS.length] ?? '60%';
const pagination = computed(() => props.items?.pagination);
/** Total record count for the title pill: pagination total -> totalEntries -> rows on the page. */
const countValue = computed<number | null>(() => {
    const total = props.items?.pagination?.total;
    if (typeof total === 'number') return total;
    if (typeof props.totalEntries === 'number') return props.totalEntries;
    return props.items?.data?.length ?? null;
});
const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('search', target.value);
};
const isSelected = (row: Item) => {
    return selectedRows.value.some((r) => r.id === row.id);
};

const toggleRow = (row: Item) => {
    if (!props.selectable) return;

    isAllPagesSelected.value = false;
    const exists = selectedRows.value.some((newRow) => newRow.id === row.id);

    if (exists) {
        selectedRows.value = selectedRows.value.filter((newRow) => newRow.id !== row.id);
    } else {
        selectedRows.value.push(row);
    }

    emit('update:selectedItems', getSelectedIds());
    emit('selection-change', selectedRows.value);
};
const isAllSelected = computed(() => {
    if (!props.selectable) return false;

    const rows = props.items?.data || [];
    return rows.length > 0 && rows.every((row) => isSelected(row));
});

const isIndeterminate = computed(() => {
    if (!props.selectable || isAllSelected.value) return false;

    const rows = props.items?.data || [];
    return rows.some((row) => isSelected(row));
});
const toggleSelectAll = () => {
    if (!props.selectable) return;
    isAllPagesSelected.value = true;
    const rows = props.items?.data || [];

    if (isAllSelected.value) {
        selectedRows.value = [];
    } else {
        selectedRows.value = [...rows];
    }

    emit('update:selectedItems', getSelectedIds());
    emit('selection-change', selectedRows.value);
};
const clearSelection = () => {
    selectedRows.value = [];
    isAllPagesSelected.value = false;

    emit('update:selectedItems', getSelectedIds());
    emit('selection-change', selectedRows.value);
};

defineExpose({ clearSelection });

const getRowNumber = (index: number) => {
    const page = props.items?.pagination?.current_page || 1;
    const perPage = props.items?.pagination?.per_page || props.items?.data?.length || 10;

    return (page - 1) * perPage + index + 1;
};

const clearAllFilters = () => {
    selectedFilters.value = {};

    emit('filter-change', {});
};

onClickOutside(columnMenuRef, () => {
    isColumnMenuVisible.value = false;
});
onClickOutside(
    sortMenuRef,
    () => {
        isSortVisible.value = false;
    },
    { ignore: [sortButtonRef] }
);

onClickOutside(overflowMenuRef, () => {
    isOverflowOpen.value = false;
    openBulkActionMenu.value = null;
});
</script>

<template>
    <div
        :class="[
            'dark:border-border-default dark:bg-surface-card bg-white',
            isFullscreen
                ? 'fixed inset-0 z-1100 overflow-auto p-4'
                : [
                      'relative w-full max-w-full min-w-0 p-4 sm:p-6',
                      cssClases ? cssClases : 'dark:border-border-default rounded-2xl border border-gray-200 shadow-xs'
                  ]
        ]">
        <div
            v-if="$slots.breadcrumb"
            class="mb-4">
            <slot name="breadcrumb" />
        </div>
        <div
            v-if="title || subtitle"
            class="mb-7">
            <div class="flex items-center gap-2.5">
                <h2
                    v-if="title"
                    class="text-schedule-text-primary dark:text-text-primary text-xl font-semibold">
                    {{ title }}
                </h2>
                <span
                    v-if="showCount && countValue !== null"
                    class="bg-schedule-brand-blue-subtle text-schedule-icon-brand inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums">
                    {{ countValue.toLocaleString() }}
                </span>
            </div>

            <p
                v-if="subtitle"
                class="text-schedule-text-tertiary fonr-normal dark:text-text-tertiary mt-1 text-sm">
                {{ subtitle }}
            </p>
        </div>
        <div
            v-if="showSearch || showFilter || showSort || showAddButton || showImport || showExport"
            class="flex flex-wrap items-center justify-between gap-4 py-2">
            <div class="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:min-w-75 sm:flex-1">
                <div
                    v-if="showSearch"
                    class="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
                    <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon class="text-schedule-text-secondary dark:text-text-tertiary h-5 w-5" />
                    </span>
                    <input
                        type="text"
                        :placeholder="props.searchPlaceholder || $lang.search + '...'"
                        @input="handleSearchInput"
                        class="bg-surface-subtle border-border-default text-text-primary placeholder:text-text-muted focus:border-border-strong focus:bg-surface-card block w-full rounded-lg border py-3 pr-3 pl-10 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-100/40" />
                </div>
                <button
                    v-if="showFilter && filterFields.length > 0"
                    @click="toggleFilter"
                    :class="[
                        'border-border-default text-text-secondary flex items-center gap-1 rounded-lg border px-3 py-2.5 shadow-xs transition-all',
                        isFilterVisible
                            ? 'border-border-strong bg-surface-subtle text-text-primary'
                            : 'bg-surface-card hover:bg-surface-hover'
                    ]">
                    <component
                        :is="isFilterVisible ? XmarkIcon : Filter"
                        class="h-5 w-5" />
                    <span class="text-md text-text-secondary font-semibold">
                        {{ isFilterVisible ? $lang.hideFilter : $lang.filter }}
                    </span>
                    <span
                        v-if="activeFilterCount > 0"
                        class="bg-schedule-brand-blue ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white">
                        {{ activeFilterCount }}
                    </span>
                </button>

                <div class="relative flex items-center gap-3">
                    <button
                        v-if="showSort"
                        ref="sortButtonRef"
                        @click="toggleSort"
                        class="bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover flex items-center gap-1 rounded-lg border px-3 py-2.5 shadow-xs transition-all">
                        <SortIcon class="h-5 w-5" />
                        <span class="text-md text-text-secondary font-semibold">{{ $lang.sort }}</span>
                        <ArrowDownIcon
                            class="h-5 w-5"
                            :class="{ 'rotate-180': isSortVisible }" />
                    </button>

                    <div
                        v-if="isSortVisible"
                        ref="sortMenuRef"
                        class="animate-in fade-in zoom-in-95 bg-surface-card border-border-default absolute top-14 left-0 z-50 w-64 rounded-2xl border p-6 shadow-xl ring-1 ring-black/5">
                        <h3 class="text-md text-text-tertiary mb-6 font-medium">{{ $lang.sortBy }}</h3>

                        <div class="space-y-4">
                            <div
                                v-for="col in columns"
                                :key="col.key"
                                @click="handleSortSelection(col.key)"
                                class="group flex cursor-pointer items-center gap-4">
                                <div
                                    :class="[
                                        'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all',
                                        sortConfig.key === col.key
                                            ? 'bg-schedule-brand-blue border-blue-900'
                                            : 'border-border-default bg-surface-card'
                                    ]">
                                    <CheckIcon
                                        v-if="sortConfig.key === col.key"
                                        class="h-3.5 w-3.5 text-white" />
                                </div>
                                <span class="text-text-secondary text-sm font-medium">{{ col.label }}</span>
                            </div>

                            <hr class="border-border-default my-2" />

                            <div
                                @click="handleSortSelection(ASC_KEY_ORDER)"
                                class="group flex cursor-pointer items-center gap-4">
                                <div
                                    :class="[
                                        'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all',
                                        sortConfig.order === ASC_KEY_ORDER
                                            ? 'border-blue-900 bg-blue-900'
                                            : 'border-border-default bg-surface-card'
                                    ]">
                                    <CheckIcon
                                        v-if="sortConfig.order === ASC_KEY_ORDER"
                                        class="h-3.5 w-3.5 text-white" />
                                </div>
                                <span class="text-text-secondary text-sm font-medium">{{ $lang.ascending }}</span>
                            </div>

                            <div
                                @click="handleSortSelection(DESC_KEY_ORDER)"
                                class="group flex cursor-pointer items-center gap-4">
                                <div
                                    :class="[
                                        'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all',
                                        sortConfig.order === DESC_KEY_ORDER
                                            ? 'border-blue-900 bg-blue-900'
                                            : 'border-border-default bg-surface-card'
                                    ]">
                                    <CheckIcon
                                        v-if="sortConfig.order === DESC_KEY_ORDER"
                                        class="h-3.5 w-3.5 text-white" />
                                </div>
                                <span class="text-text-secondary text-sm font-medium">{{ $lang.descending }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 sm:justify-end">
                <button
                    v-if="showImport"
                    @click="emit('import')"
                    :title="importLabel || $lang.import || 'Import'"
                    :aria-label="importLabel || $lang.import || 'Import'"
                    class="bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover flex h-10 items-center justify-center rounded-lg border shadow-xs transition-all"
                    :class="importLabel ? 'gap-2 px-3' : 'w-10'">
                    <ImportIcon class="h-5 w-5" />
                    <span
                        v-if="importLabel"
                        class="text-sm font-medium">
                        {{ importLabel }}
                    </span>
                </button>
                <button
                    v-if="showExport"
                    @click="emit('export')"
                    :title="exportLabel || $lang.export || 'Export'"
                    :aria-label="exportLabel || $lang.export || 'Export'"
                    class="bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover flex h-10 items-center justify-center rounded-lg border shadow-xs transition-all"
                    :class="exportLabel ? 'gap-2 px-3' : 'w-10'">
                    <ExportIcon class="h-5 w-5" />
                    <span
                        v-if="exportLabel"
                        class="text-sm font-medium">
                        {{ exportLabel }}
                    </span>
                </button>
                <div class="relative flex items-center gap-3">
                    <template v-if="showColumnToggle">
                        <button
                            v-if="showRefresh"
                            @click="emit('refresh')"
                            :title="$lang.refresh || 'Refresh'"
                            class="bg-surface-card text-text-tertiary border-border-default hover:bg-surface-hover flex h-10 w-10 items-center justify-center rounded-md border transition-all">
                            <RefreshIcon class="h-5 w-5" />
                        </button>

                        <button
                            @click="isColumnMenuVisible = !isColumnMenuVisible"
                            class="bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover flex items-center gap-1 rounded-lg border px-3 py-1.5 shadow-xs transition-all">
                            <ColumnSolid />
                        </button>

                        <div
                            v-if="isColumnMenuVisible"
                            ref="columnMenuRef"
                            class="animate-in fade-in zoom-in-95 bg-surface-card border-border-default absolute top-14 left-0 z-50 w-64 rounded-2xl border p-6 shadow-xl ring-1 ring-black/5">
                            <h3 class="text-md text-text-tertiary mb-2 font-medium">{{ $lang.showColumns }}</h3>

                            <div class="space-y-4">
                                <div
                                    v-for="col in columns"
                                    :key="col.key"
                                    @click="toggleColumn(col.key)"
                                    class="group flex cursor-pointer items-center gap-4">
                                    <div
                                        :class="[
                                            'flex h-5 w-5 items-center justify-center rounded-md border-2',
                                            !hiddenColumns.has(col.key)
                                                ? 'border-schedule-brand-blue bg-schedule-brand-blue'
                                                : 'border-border-default bg-surface-card'
                                        ]">
                                        <CheckIcon
                                            v-if="!hiddenColumns.has(col.key)"
                                            class="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <span class="text-text-secondary text-sm font-medium">{{ col.label }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                <button
                    v-if="isFullScreenOn"
                    @click="toggle"
                    class="bg-surface-card text-text-tertiary border-border-default hover:bg-surface-hover rounded-md border">
                    <FullscreenMenu class="text-text-tertiary" />
                </button>
                <button
                    v-if="showAddButton"
                    @click="emit('add')"
                    class="bg-schedule-brand-blue hover:bg-schedule-brand-blue-hover flex shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all">
                    <component
                        :is="addIcon"
                        v-if="addIcon"
                        class="h-4 w-4" />
                    {{ resolvedAddButtonLabel }}
                </button>
            </div>
        </div>
        <div v-if="isFilterVisible && filterFields.length > 0">
            <div class="border-schedule-border-subtle dark:border-border-default mb-4 border-b py-3">
                <div class="flex flex-wrap items-end gap-4">
                    <div
                        v-for="filter in filterFields"
                        :key="filter.key"
                        class="min-w-45 flex-1">
                        <MultipleSelect
                            v-if="filter.multiple"
                            :modelValue="Array.isArray(selectedFilters[filter.key]) ? selectedFilters[filter.key] : []"
                            :options="filter.options"
                            :placeholder="`${$lang.all || 'All'} ${filter.label}${$lang.s || 's'}`"
                            :labelText="filter.label"
                            optionLabel="label"
                            optionValue="value"
                            :size="CONTROL_SIZE.SMALL"
                            :variant="CONTROL_VARIANT_OUTLINED"
                            showClear
                            :loading="filter.loading"
                            :searchQueryParam="filter.searchQueryParam"
                            @search-input="(query) => emit('filter-search', { key: filter.key, query })"
                            @update:modelValue="(values) => handleFilterUpdate(filter.key, values)" />
                        <MainSelect
                            v-else
                            :modelValue="selectedFilters[filter.key] !== undefined ? selectedFilters[filter.key] : null"
                            :options="filter.options"
                            :placeholder="`${$lang.all || 'All'} ${filter.label}${$lang.s || 's'}`"
                            :labelText="filter.label"
                            optionLabel="label"
                            optionValue="value"
                            :size="CONTROL_SIZE.SMALL"
                            :variant="CONTROL_VARIANT_OUTLINED"
                            :showClear="
                                selectedFilters[filter.key] !== undefined &&
                                selectedFilters[filter.key] !== null &&
                                selectedFilters[filter.key] !== ''
                            "
                            :search="filter.search"
                            :loading="filter.loading"
                            :searchQueryParam="filter.searchQueryParam"
                            @search-input="(query) => emit('filter-search', { key: filter.key, query })"
                            @update:modelValue="(val) => handleFilterUpdate(filter.key, val)" />
                    </div>
                </div>
            </div>
            <div
                v-if="Object.keys(selectedFilters).length > 0"
                class="mb-4 flex lg:justify-end">
                <button
                    @click="clearAllFilters"
                    class="text-schedule-brand-blue flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80">
                    <XmarkIcon class="h-5 w-5" />
                    {{ $lang.resetFilter }}
                </button>
            </div>
        </div>

        <div class="w-full max-w-full min-w-0 overflow-x-auto">
            <table class="w-full border-collapse text-left">
                <thead class="bg-surface-subtle drop-shadow-schedule-icon-brand">
                    <tr>
                        <th
                            v-if="selectable"
                            class="px-3 py-2">
                            <div
                                @click="toggleSelectAll"
                                :class="[
                                    'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all duration-200',
                                    isAllSelected || isIndeterminate
                                        ? 'bg-schedule-brand-blue border-schedule-brand-blue shadow-sm'
                                        : 'border-border-strong bg-surface-card'
                                ]">
                                <CheckIcon
                                    v-if="isAllSelected"
                                    class="h-2.5 w-2.5 text-white" />
                            </div>
                        </th>

                        <th
                            v-if="expandable"
                            class="w-10 px-3 py-2"></th>
                        <th
                            v-if="showIndex"
                            class="text-schedule-text-primary dark:text-text-secondary px-6 py-3 text-center text-sm font-medium">
                            #
                        </th>
                        <th
                            v-for="col in visibleColumns"
                            :key="col.key"
                            class="text-schedule-text-secondary dark:text-text-secondary px-6 py-3 text-sm font-medium whitespace-nowrap">
                            <div
                                class="flex items-center"
                                :class="
                                    col.align === COLUMN_ALIGN.CENTER
                                        ? 'justify-center'
                                        : col.align === COLUMN_ALIGN.RIGHT
                                          ? 'justify-end'
                                          : 'justify-start'
                                ">
                                <slot
                                    :name="`header-${col.key}`"
                                    :column="col">
                                    {{ col.label }}
                                </slot>
                            </div>
                        </th>
                        <th
                            v-if="needActionColumn"
                            class="text-schedule-text-secondary dark:text-text-secondary px-6 py-3 text-right text-sm font-medium">
                            {{ $lang.action }}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-border-default divide-y">
                    <template v-if="isActuallyLoading">
                        <tr
                            v-for="n in skeletonRowCount"
                            :key="`skeleton-row-${n}`">
                            <td
                                v-if="selectable"
                                class="px-3 py-2">
                                <Skeleton
                                    width="1.25rem"
                                    height="1.25rem"
                                    borderRadius="0.375rem" />
                            </td>
                            <td
                                v-if="expandable"
                                class="px-3 py-2">
                                <Skeleton
                                    width="1.5rem"
                                    height="1.5rem" />
                            </td>
                            <td
                                v-if="showIndex"
                                class="px-6 py-3 text-center">
                                <Skeleton
                                    height="0.75rem"
                                    width="1.5rem"
                                    class="mx-auto" />
                            </td>
                            <td
                                v-for="(col, ci) in visibleColumns"
                                :key="col.key"
                                class="px-6 py-3"
                                :class="`text-${col.align || COLUMN_ALIGN.LEFT}`">
                                <div
                                    class="flex items-center"
                                    :class="
                                        col.align === COLUMN_ALIGN.CENTER
                                            ? 'justify-center'
                                            : col.align === COLUMN_ALIGN.RIGHT
                                              ? 'justify-end'
                                              : 'justify-start'
                                    ">
                                    <Skeleton
                                        height="0.85rem"
                                        :width="skeletonWidth(ci)" />
                                </div>
                            </td>
                            <td
                                v-if="needActionColumn"
                                class="px-6 py-3">
                                <div class="flex justify-end">
                                    <Skeleton
                                        shape="circle"
                                        width="1.75rem"
                                        height="1.75rem" />
                                </div>
                            </td>
                        </tr>
                    </template>

                    <tr v-else-if="displayData.length === 0">
                        <td
                            :colspan="
                                visibleColumns.length +
                                (selectable ? 1 : 0) +
                                (showIndex ? 1 : 0) +
                                (expandable ? 1 : 0) +
                                1
                            "
                            class="px-6 py-12 text-center">
                            <slot name="empty">
                                <span class="text-gray-400 italic">{{ $lang.noDataAvailable }}</span>
                            </slot>
                        </td>
                    </tr>

                    <template
                        v-for="(row, index) in displayData"
                        :key="row.id">
                        <tr class="group hover:bg-surface-hover transition-colors">
                            <td
                                v-if="selectable"
                                class="px-3 py-2">
                                <div
                                    @click="toggleRow(row)"
                                    :class="[
                                        'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all duration-200',
                                        isSelected(row)
                                            ? 'bg-schedule-brand-blue border-schedule-brand-blue shadow-sm'
                                            : 'border-border-strong bg-surface-card'
                                    ]">
                                    <CheckIcon
                                        v-if="isSelected(row)"
                                        class="h-2.5 w-2.5 text-white" />
                                </div>
                            </td>
                            <td
                                v-if="expandable"
                                class="px-3 py-2 text-center">
                                <button
                                    v-if="row[props.childrenKey].length > 0"
                                    @click="toggleExpand(row)"
                                    class="dark:hover:bg-surface-hover flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-gray-100"
                                    :class="{ 'rotate-90': isExpanded(row.id) }">
                                    <SpinnerIcon
                                        v-if="row.id && loadingRows.has(row.id)"
                                        class="h-3.5 w-3.5 animate-spin text-blue-500" />
                                    <RightChevronIcon
                                        v-else
                                        class="text-schedule-text-tertiary dark:text-text-tertiary h-6 w-6" />
                                </button>
                            </td>

                            <td
                                v-if="showIndex"
                                class="text-schedule-text-secondary dark:text-text-tertiary px-6 py-3 text-center text-sm">
                                {{ getRowNumber(index) }}
                            </td>

                            <td
                                v-for="col in visibleColumns"
                                :key="col.key"
                                class="dark:text-text-tertiary px-6 py-3 text-sm font-normal"
                                :class="`text-${col.align || COLUMN_ALIGN.LEFT}`">
                                <div
                                    class="flex items-center"
                                    :class="
                                        col.align === COLUMN_ALIGN.CENTER
                                            ? 'justify-center'
                                            : col.align === COLUMN_ALIGN.RIGHT
                                              ? 'justify-end'
                                              : 'justify-start'
                                    ">
                                    <slot
                                        :name="`cell-${col.key}`"
                                        :item="row">
                                        <span
                                            class="text-schedule-text-neutral dark:text-text-tertiary text-sm font-normal">
                                            {{ row[col.key] }}
                                        </span>
                                    </slot>
                                </div>
                            </td>

                            <td
                                class="px-6 py-3 text-right"
                                v-if="needActionColumn">
                                <div class="flex justify-end">
                                    <slot
                                        name="action"
                                        :item="row">
                                        <button class="dark:hover:bg-surface-hover rounded-full p-2 hover:bg-gray-100">
                                            <MoreVerticalIcon class="dark:text-text-tertiary h-5 w-5 text-gray-400" />
                                        </button>
                                    </slot>
                                </div>
                            </td>
                        </tr>

                        <template v-if="expandable && isExpanded(row.id)">
                            <!-- Column-aligned children: real rows mirroring the
                                 parent columns so values line up under their headers. -->
                            <template v-if="alignChildren">
                                <tr
                                    v-for="child in row[childrenKey] || []"
                                    :key="`child-${child.id}`"
                                    class="bg-surface-subtle/30 hover:bg-surface-hover transition-colors">
                                    <td v-if="selectable"></td>
                                    <td v-if="expandable"></td>
                                    <td v-if="showIndex"></td>
                                    <td
                                        v-for="(col, ci) in visibleColumns"
                                        :key="col.key"
                                        class="px-6 py-3 text-sm font-normal"
                                        :class="`text-${col.align || COLUMN_ALIGN.LEFT}`">
                                        <div
                                            class="flex items-center"
                                            :class="[
                                                ci === 0 ? 'pl-8' : '',
                                                col.align === COLUMN_ALIGN.CENTER
                                                    ? 'justify-center'
                                                    : col.align === COLUMN_ALIGN.RIGHT
                                                      ? 'justify-end'
                                                      : 'justify-start'
                                            ]">
                                            <slot
                                                :name="`cell-${col.key}`"
                                                :item="child"
                                                :child="true"
                                                :parent="row">
                                                <span class="text-text-tertiary text-sm font-normal">
                                                    {{ child[col.key] }}
                                                </span>
                                            </slot>
                                        </div>
                                    </td>
                                    <td
                                        v-if="needActionColumn"
                                        class="px-6 py-3 text-right">
                                        <div class="flex justify-end">
                                            <slot
                                                name="child-action"
                                                :item="child"
                                                :parent="row" />
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="!(row[childrenKey] && row[childrenKey].length)">
                                    <td
                                        :colspan="
                                            visibleColumns.length +
                                            (selectable ? 1 : 0) +
                                            (showIndex ? 1 : 0) +
                                            (expandable ? 1 : 0) +
                                            1
                                        "
                                        class="text-text-muted px-6 py-6 text-center text-sm italic">
                                        {{ $lang.noDataAvailable }}
                                    </td>
                                </tr>
                            </template>

                            <!-- Legacy free-form expanded content via slot. -->
                            <tr
                                v-else
                                class="bg-gray-50/20 dark:bg-gray-900/10">
                                <td
                                    :colspan="
                                        visibleColumns.length +
                                        (selectable ? 1 : 0) +
                                        (showIndex ? 1 : 0) +
                                        (expandable ? 1 : 0) +
                                        1
                                    "
                                    class="p-0">
                                    <div class="animate-in slide-in-from-top-1 ml-4 border-l-4 border-blue-500/30 py-2">
                                        <slot
                                            name="expanded-row"
                                            :item="row">
                                            <div
                                                v-if="row[childrenKey] && row[childrenKey].length > 0"
                                                class="pl-8">
                                                <div
                                                    v-for="child in row[childrenKey]"
                                                    :key="child.id"
                                                    class="dark:border-border-default border-b border-gray-100 py-1 text-sm last:border-0">
                                                    <span class="font-medium">Sub-item:</span>
                                                    {{ child.name || child.id }}
                                                </div>
                                            </div>
                                            <div
                                                v-else-if="row[props.childrenKey].length === 0"
                                                class="py-4 text-center text-xs text-gray-400 italic">
                                                Loading sub-items...
                                            </div>
                                        </slot>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </template>
                </tbody>
            </table>
        </div>
        <div
            v-if="pagination"
            class="border-schedule-tertiary dark:border-border-default dark:bg-surface-card mt-6 border-t bg-white">
            <div class="flex flex-col items-center justify-between gap-4 px-6 py-3 sm:flex-row">
                <div class="flex flex-wrap items-center gap-4">
                    <div class="text-schedule-text-tertiary dark:text-text-secondary text-sm">
                        {{ $lang.showing || 'Showing' }}
                        <span class="text-schedule-text-tertiary font-medium dark:text-white">
                            {{ pagination.from || 0 }}
                        </span>
                        {{ $lang.to || 'to' }}
                        <span class="text-schedule-text-tertiary font-medium dark:text-white">
                            {{ pagination.to || 0 }}
                        </span>
                        {{ $lang.of || 'of' }}
                        <span class="text-schedule-text-tertiary font-medium dark:text-white">
                            {{ pagination.total }}
                        </span>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="dark:text-text-secondary text-sm text-gray-600">
                            {{ $lang.perPage || 'Per Page:' }}
                        </span>
                        <MainSelect
                            class="w-24"
                            :modelValue="selectedLimit"
                            :options="dropdownOptions"
                            placeholder="10"
                            :size="CONTROL_SIZE.SMALL"
                            :variant="CONTROL_VARIANT_OUTLINED"
                            @update:modelValue="
                                (val: number) => {
                                    const total = props.items?.pagination?.total || 0;
                                    const lastPage = Math.max(1, Math.ceil(total / val));
                                    if (
                                        props.items?.pagination?.current_page &&
                                        props.items?.pagination?.current_page > lastPage
                                    ) {
                                        emit('update:currentPage', lastPage);
                                    }
                                    emit('update:limit', val);
                                }
                            " />
                    </div>
                </div>

                <div
                    class="dark:border-border-strong flex max-w-full items-center overflow-x-auto rounded-lg border border-gray-300 [&_button]:shrink-0 [&_span]:shrink-0">
                    <button
                        :disabled="pagination.current_page === 1"
                        @click="$emit('update:currentPage', pagination.current_page - 1)"
                        :class="[
                            'dark:border-border-strong dark:bg-surface-card flex cursor-pointer items-center gap-2 border-r border-gray-300 bg-white px-4 py-2 text-sm font-medium transition-all duration-150',
                            pagination.current_page === 1
                                ? 'dark:text-text-muted cursor-not-allowed text-gray-400'
                                : 'dark:text-text-secondary dark:hover:bg-surface-hover text-gray-700 hover:bg-gray-50'
                        ]">
                        <LeftArrowIcon />
                        <span>{{ $lang.previous || 'Previous' }}</span>
                    </button>

                    <button
                        v-if="!pageNumbers.includes(1)"
                        @click="$emit('update:currentPage', 1)"
                        :class="[
                            'dark:border-border-strong cursor-pointer border-r border-gray-300 text-sm font-medium transition-all',
                            pagination.current_page === 1
                                ? 'bg-primary-600 p-2 text-white'
                                : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                        ]">
                        1
                    </button>

                    <span
                        v-if="pageNumbers.length > 0 && firstPage && firstPage > 2"
                        class="dark:border-border-strong dark:bg-surface-card dark:text-text-tertiary cursor-pointer border-r border-gray-300 bg-white px-3 py-2 text-sm text-gray-500">
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
                                ? 'dark:border-border-strong border-r border-gray-300'
                                : '',
                            page === pagination.current_page
                                ? 'bg-schedule-brand-blue text-white'
                                : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                        ]">
                        {{ page }}
                    </button>

                    <span
                        v-if="pageNumbers.length > 0 && lastPage && lastPage < pagination.last_page - 1"
                        class="dark:border-border-strong dark:bg-surface-card dark:text-text-tertiary border-r border-gray-300 bg-white px-3 py-2 text-sm text-gray-500">
                        ...
                    </span>

                    <button
                        v-if="!pageNumbers.includes(pagination.last_page)"
                        @click="$emit('update:currentPage', pagination.last_page)"
                        :class="[
                            'dark:border-border-strong border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all',
                            pagination.current_page === pagination.last_page
                                ? 'bg-primary-600 text-white'
                                : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                        ]">
                        {{ pagination.last_page }}
                    </button>

                    <button
                        :disabled="pagination.current_page === pagination.last_page"
                        @click="$emit('update:currentPage', pagination.current_page + 1)"
                        :class="[
                            'dark:bg-surface-card flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium transition-all duration-150',
                            pagination.current_page === pagination.last_page
                                ? 'dark:text-text-muted cursor-not-allowed text-gray-400'
                                : 'dark:text-text-secondary dark:hover:bg-surface-hover text-gray-700 hover:bg-gray-50'
                        ]">
                        <span>{{ $lang.next || 'Next' }}</span>
                        <RightArrowIcon />
                    </button>
                </div>
            </div>
        </div>
        <div
            v-if="selectedCount > 0 && (visibleActions.length > 0 || overflowActions.length > 0)"
            class="fixed bottom-10 left-1/2 z-50 w-max max-w-[calc(100vw-1rem)] -translate-x-1/2">
            <div
                class="dark:border-border-default dark:bg-surface-card flex w-full items-center gap-3 overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-2xl sm:gap-6 sm:px-6">
                <div class="dark:border-border-default flex items-center gap-3 border-r border-gray-100 pr-6">
                    <div
                        class="text-schedule-text-brand-primary flex h-8 w-8 items-center justify-center rounded-lg dark:bg-blue-900/30 dark:text-blue-300">
                        <DragIcon class="h-4 w-4" />
                    </div>
                    <div class="flex items-center text-xs whitespace-nowrap">
                        <span class="flex items-center font-bold text-gray-900 dark:text-white">
                            {{ isAllPagesSelected ? displayData.length : selectedCount }} {{ $lang.selected }}
                        </span>

                        <span class="mx-2 text-gray-300">•</span>

                        <button
                            v-if="!isAllPagesSelected && displayData.length > selectedRows.length"
                            @click="toggleSelectAll"
                            class="text-schedule-brand-blue font-medium underline decoration-blue-200 hover:text-blue-800">
                            {{ $lang.selectAll }} {{ displayData.length }}
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <template
                        v-for="(action, index) in visibleActions"
                        :key="action.label">
                        <div class="relative">
                            <button
                                @click.stop="
                                    handleBulkActionClick(
                                        action,
                                        getBulkActionKey(action, BULK_ACTION_SCOPE.MAIN, index)
                                    )
                                "
                                :class="[
                                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all',
                                    action.variant === BULK_ACTION_VARIANT.DANGER
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'dark:text-text-secondary dark:hover:bg-surface-hover text-gray-700 hover:bg-gray-100'
                                ]">
                                <component
                                    :is="action.icon"
                                    v-if="action.icon"
                                    class="h-4 w-4" />
                                {{ action.label }}
                            </button>

                            <div
                                v-if="
                                    hasBulkActionOptions(action) &&
                                    openBulkActionMenu === getBulkActionKey(action, BULK_ACTION_SCOPE.MAIN, index)
                                "
                                class="dark:border-border-default dark:bg-surface-card absolute bottom-full left-1/2 z-10 mb-3 max-w-xs -translate-x-1/2 rounded-3xl border border-gray-100 bg-white p-3 shadow-2xl ring-1 ring-black/5">
                                <button
                                    v-for="option in action.options"
                                    :key="`${action.label}-${option.value}`"
                                    @click.stop="handleBulkActionOptionSelect(action, option)"
                                    class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all">
                                    <Badge
                                        :label="option.label"
                                        :variant="option?.variant"
                                        :size="option.size"
                                        :icon="option.icon" />
                                </button>
                            </div>
                        </div>
                    </template>

                    <div
                        v-if="overflowActions.length > 0"
                        class="dark:border-border-default relative ml-2 border-l border-gray-100 pl-2">
                        <button
                            @click="isOverflowOpen = !isOverflowOpen"
                            class="dark:hover:bg-surface-hover flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
                            <MoreVerticalIcon class="h-5 w-5 text-gray-400" />
                        </button>

                        <div
                            v-if="isOverflowOpen"
                            ref="overflowMenuRef"
                            class="dark:border-border-default dark:bg-surface-card absolute right-0 bottom-full mb-4 w-48 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                            <div
                                v-for="(action, index) in overflowActions"
                                :key="action.label"
                                class="relative">
                                <button
                                    @click.stop="
                                        handleBulkActionClick(
                                            action,
                                            getBulkActionKey(action, BULK_ACTION_SCOPE.OVERFLOW, index)
                                        )
                                    "
                                    class="dark:text-text-secondary dark:hover:bg-surface-hover flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    <component
                                        :is="action.icon"
                                        v-if="action.icon"
                                        class="h-4 w-4" />
                                    <span class="flex-1">{{ action.label }}</span>
                                    <RightChevronIcon
                                        v-if="hasBulkActionOptions(action)"
                                        class="h-4 w-4" />
                                </button>

                                <div
                                    v-if="
                                        hasBulkActionOptions(action) &&
                                        openBulkActionMenu ===
                                            getBulkActionKey(action, BULK_ACTION_SCOPE.OVERFLOW, index)
                                    "
                                    class="dark:border-border-default dark:bg-surface-card absolute top-0 right-full z-30 mr-3 w-56 rounded-3xl border border-gray-100 bg-white p-3 shadow-2xl ring-1 ring-black/5">
                                    <button
                                        v-for="option in action.options"
                                        :key="`${action.label}-${option.value}`"
                                        @click.stop="handleBulkActionOptionSelect(action, option)"
                                        class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all">
                                        <component
                                            :is="option.icon"
                                            v-if="option.icon"
                                            class="h-5 w-5" />
                                        {{ option.label }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
