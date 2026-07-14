<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
import { useLanguageStore} from '@/stores/languageStore';
import { ref, computed, onMounted, onUnmounted, type Component, useTemplateRef, watch } from 'vue';

import Badge from '@/components/common/Badge.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MultipleSelect from '@/components/common/MultipleSelect.vue';

import PlusIcon from '@/assets/icons/PlusIcon.vue';
import DragIcon from '@/assets/icons/DragIcon.vue';
import ExpandIcon from '@/assets/icons/ExpandIcon.vue';
import ColumnSolid from '@/assets/icons/ColumnSolid.vue';
import DeleteTrashAltIcon from '@/assets/icons/DeleteTrashAltIcon.vue';
const { customizeLanguageData } = useLanguageStore();

const addRowLabel = computed(() => {
    return props.addRowLabel ?? customizeLanguageData('addRow', 'Add Row');
});

const emptyMessage = computed(() => {
    return props.emptyMessage ?? customizeLanguageData('noRowsAdded', 'No rows added');
});

export interface TableColumn {
    key: string;
    label: string;
    visible?: boolean;
    width?: string;
}

export interface TableRow {
    id: number | string;
    [key: string]: any;
}
export interface BulkActionOption {
    label: string;
    icon?: Component;
    variant?: 'primary' | 'success' | 'error' | 'info' | 'warning' | 'light' | 'none';
    size: 'sm' | 'md' | 'lg';
    value: any;
}
export interface BulkAction {
    label: string;
    icon?: Component;
    onClick: (items: TableRow[], optionValue?: any) => void;
    variant?: 'danger' | 'primary' | 'secondary';
    options?: BulkActionOption[];
}
const props = withDefaults(
    defineProps<{
        title?: string;
        showExpansion?: boolean;
        hideDeleteAction?: boolean;
        columns: TableColumn[];
        rows: TableRow[];
        selectable?: boolean;
        bulkActions?: BulkAction[];
        selectedItems?: number[] | null;
        selectedItemData?: TableRow[] | null;
        showCheckboxColumn?: boolean;
        showActionsColumn?: boolean;
        isExpanded?: boolean;
        hideAddRow?: boolean;
        hideColVisibility?: boolean;
        showAddRowButton?: boolean;
        addRowLabel?: string;
        emptyMessage?: string;
    }>(),
    {
        showAddRowButton: true,
    }
);

const emit = defineEmits(['add-row', 'remove-row', 'action', 'expand-row', 'selection-change', 'update:selectedItems']);

const el = useTemplateRef('el');
const { isFullscreen, toggle } = useFullscreen(el);

const expanded = defineModel<boolean>('expanded', { default: false });
const selectedColumns = defineModel<string[]>('selectedColumns', { default: () => [] });
const selectedRows = defineModel<TableRow[]>('selectedRows', { default: () => [] });
const openBulkActionMenu = ref<string | null>(null);
const isAllPagesSelected = ref(false);
const selectedCount = computed(() => selectedRows.value.length);

const getSelectedIds = (): number[] => {
    return selectedRows.value.map((item) => Number(item.id)).filter((id) => !isNaN(id));
};

const isAllSelected = computed(() => {
    return props.rows.length > 0 && selectedRows.value.length === props.rows.length;
});

const isSelected = (row: TableRow) => {
    return selectedRows.value.some((r) => r.id === row.id);
};

const toggleRow = (row: TableRow) => {
    if (!props.selectable) return;

    const index = selectedRows.value.findIndex((r) => r.id === row.id);

    if (index > -1) {
        selectedRows.value = selectedRows.value.filter((r) => r.id !== row.id);
    } else {
        selectedRows.value = [...selectedRows.value, row];
    }

    emit('update:selectedItems', getSelectedIds());
    emit('selection-change', selectedRows.value);
};

const toggleSelectAll = () => {
    if (!props.selectable) return;

    if (isAllSelected.value) {
        selectedRows.value = [];
    } else {
        selectedRows.value = [...props.rows];
    }

    emit('update:selectedItems', getSelectedIds());
    emit('selection-change', selectedRows.value);
};

const visibleColumns = computed(() => {
    return props.columns.filter((col) => selectedColumns.value.includes(col.key));
});

const toggleColumn = (key: string) => {
    const current = [...selectedColumns.value];
    const index = current.indexOf(key);
    if (index > -1) {
        if (current.length > 1) current.splice(index, 1);
    } else {
        current.push(key);
    }
    selectedColumns.value = current;
};

const isColumnVisible = (key: string) => selectedColumns.value.includes(key);

const showColumnMenu = ref(false);
const columnMenuRef = ref<HTMLElement | null>(null);

const getBulkActionKey = (action: BulkAction, scope: 'main' | 'overflow', index: number) =>
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
};

const handleBulkActionOptionSelect = (action: BulkAction, option: BulkActionOption) => {
    action.onClick([...selectedRows.value], option.value);
    openBulkActionMenu.value = null;
};

const toggleColumnVisibilityMenu = (event: MouseEvent) => {
    event.stopPropagation();
    showColumnMenu.value = !showColumnMenu.value;
};

const handleClickOutside = (event: MouseEvent) => {
    if (showColumnMenu.value && columnMenuRef.value && !columnMenuRef.value.contains(event.target as Node)) {
        showColumnMenu.value = false;
    }
    openBulkActionMenu.value = null;
};

onMounted(() => {
    if (selectedColumns.value.length === 0) {
        selectedColumns.value = props.columns.filter((col) => col.visible !== false).map((col) => col.key);
    }
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

watch(
    () => props.isExpanded,
    (value) => {
        expanded.value = value;
    },
    { immediate: true }
);

watch(
    () => props.selectedItems,
    (ids) => {
        if (!ids) return;
        selectedRows.value = props.rows.filter((row) => ids.includes(Number(row.id)));
    },
    { immediate: true }
);

watch(
    () => props.rows,
    (rows) => {
        selectedRows.value = selectedRows.value.filter((selected) => rows.some((row) => row.id === selected.id));
    }
);

const getSlotName = (key: string) => `column-${key}`;
</script>

<template>
    <div
        ref="el"
        class="relative">
        <div class="border-schedule-tertiary overflow-x-auto rounded-xl border dark:border-slate-700">
            <table class="w-full text-left text-sm">
                <thead
                    class="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase dark:bg-slate-800/50 dark:text-gray-400">
                    <tr>
                        <th
                            v-if="selectable"
                            class="px-3 py-2">
                            <div
                                @click="toggleSelectAll"
                                :class="[
                                    'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all duration-200',
                                    isAllSelected
                                        ? 'bg-schedule-brand-blue border-schedule-brand-blue'
                                        : 'border-schedule-border-primary bg-white'
                                ]">
                                <i
                                    v-if="isAllSelected"
                                    class="fa-solid fa-check text-[10px] text-white"></i>
                            </div>
                        </th>

                        <th
                            v-for="col in visibleColumns"
                            :key="col.key"
                            :style="{ width: col.width }"
                            class="border-schedule-tertiary border-x-[0.5px] p-3">
                            {{ col.label }}
                        </th>

                        <th
                            v-if="!props.hideColVisibility"
                            class="sticky right-0 w-12 bg-gray-100/80 p-3 text-center dark:bg-slate-800">
                            <button
                                type="button"
                                @click="toggleColumnVisibilityMenu"
                                class="hover:text-primary-500 transition-colors">
                                <ColumnSolid class="h-4 w-4" />
                            </button>
                        </th>
                    </tr>
                </thead>

                <tbody class="dark:divide-slate-800">
                    <tr v-if="rows.length === 0">
                        <td
                            :colspan="
                                visibleColumns.length +
                                (selectable ? 1 : 0) +
                                (showActionsColumn || !props.hideColVisibility ? 1 : 0)
                            "
                            class="p-12 text-center text-gray-400">
                            {{ emptyMessage }}
                        </td>
                    </tr>

                    <tr
                        v-for="(item, index) in rows"
                        :key="item.id"
                        class="border-t border-gray-100 dark:border-slate-800 dark:hover:bg-slate-800">
                        <td
                            v-if="selectable"
                            class="px-3 py-2">
                            <div
                                @click="toggleRow(item)"
                                :class="[
                                    'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all duration-200',
                                    isSelected(item)
                                        ? 'bg-schedule-brand-blue border-schedule-brand-blue shadow-sm'
                                        : 'border-schedule-border-primary bg-white'
                                ]">
                                <i
                                    v-if="isSelected(item)"
                                    class="fa-solid fa-check text-[10px] text-white"></i>
                            </div>
                        </td>

                        <td
                            v-for="col in visibleColumns"
                            :key="col.key"
                            class="border-schedule-tertiary border-x-[0.5px] p-3">
                            <slot
                                :name="getSlotName(col.key)"
                                :item="item"
                                :index="index">
                                <MultipleSelect
                                    v-if="col.key.includes('multi-select')"
                                    v-model="item[col.key]" />
                                <MainSelect
                                    v-else-if="col.key.includes('select')"
                                    v-model="item[col.key]" />
                                <InputText
                                    v-else-if="col.key.includes('quantity') || col.key.includes('number')"
                                    v-model="item[col.key]"
                                    type="number" />
                                <CheckBox
                                    v-else-if="col.key.includes('checkbox')"
                                    v-model="item[col.key]"
                                    binary />
                                <span v-else>{{ item[col.key] }}</span>
                            </slot>
                        </td>

                        <td
                            v-if="showActionsColumn || !props.hideColVisibility"
                            class="p-3 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <ExpandIcon
                                    v-if="showExpansion"
                                    class="cursor-pointer"
                                    @click="() => emit('expand-row', index, item)" />
                                <DeleteTrashAltIcon
                                    v-if="!hideDeleteAction"
                                    class="cursor-pointer text-red-500"
                                    @click="emit('remove-row', index)" />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <Transition name="fade">
            <div
                v-if="showColumnMenu"
                ref="columnMenuRef"
                class="absolute top-10 right-0 z-50 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                <p class="mb-3 text-xs font-bold text-gray-400 uppercase">
                    {{ $lang.visibleColumns || 'Visible Columns' }}
                </p>
                <div class="max-h-60 space-y-0.5 overflow-y-auto">
                    <div
                        v-for="col in columns"
                        :key="col.key"
                        @click="toggleColumn(col.key)"
                        class="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <CheckBox
                            :model-value="isColumnVisible(col.key)"
                            :binary="true" />
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {{ col.label }}
                        </span>
                    </div>
                </div>
            </div>
        </Transition>
        <div
            v-if="selectedCount > 0"
            class="fixed bottom-10 left-1/2 z-50 w-max -translate-x-1/2">
            <div
                class="flex w-full items-center gap-6 rounded-2xl border border-gray-200 bg-white px-6 py-3 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <div class="flex items-center gap-3 border-r border-gray-100 pr-6 dark:border-gray-700">
                    <div
                        class="text-schedule-text-brand-primary flex h-8 w-8 items-center justify-center rounded-lg dark:bg-blue-900/30">
                        <DragIcon class="h-4 w-4" />
                    </div>
                    <div class="flex items-center text-xs whitespace-nowrap">
                        <span class="flex items-center font-bold text-gray-900 dark:text-white">
                            {{ isAllPagesSelected ? rows.length : selectedCount }} {{ $lang.selected }}
                        </span>

                        <span class="mx-2 text-gray-300">•</span>

                        <button
                            v-if="!isAllPagesSelected && rows.length > selectedRows.length"
                            type="button"
                            @click="toggleSelectAll"
                            class="text-schedule-brand-blue font-medium underline decoration-blue-200 hover:text-blue-800">
                            {{ $lang.selectAll }} {{ rows.length }}
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <template
                        v-for="(action, index) in bulkActions"
                        :key="action.label">
                        <div class="relative">
                            <button
                                type="button"
                                @click.stop="handleBulkActionClick(action, getBulkActionKey(action, 'main', index))"
                                :class="[
                                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all',
                                    action.variant === 'danger'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
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
                                    openBulkActionMenu === getBulkActionKey(action, 'main', index)
                                "
                                class="absolute bottom-full left-1/2 z-10 mb-3 max-w-xs -translate-x-1/2 rounded-3xl border border-gray-100 bg-white p-3 shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800">
                                <button
                                    v-for="option in action.options"
                                    :key="`${action.label}-${option.value}`"
                                    type="button"
                                    @click.stop="handleBulkActionOptionSelect(action, option)"
                                    class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all">
                                    <Badge
                                        :label="option.label"
                                        :variant="option.variant"
                                        :size="option.size"
                                        :icon="option.icon" />
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <div class="mt-4 flex items-center justify-between gap-2">
            <div class="flex gap-2">
                <MainButton
                    v-if="showAddRowButton"
                    @click="emit('add-row')"
                    outlined
                    :label="addRowLabel"
                    :icon="PlusIcon" />

                <slot name="extra-buttons" />
            </div>

            <slot name="actions" />
        </div>
    </div>
</template>
