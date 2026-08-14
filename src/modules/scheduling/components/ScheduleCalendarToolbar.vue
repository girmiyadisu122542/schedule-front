<script setup lang="ts">
import { ref, watch } from 'vue';

import MainSearch from '@/components/common/MainSearch.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';

import Search from '@/assets/icons/Search.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';
import type { CrudFilter } from '@/composables/useCrudResource';

/**
 * Search, filters and refresh for a calendar view.
 *
 * The table gets these from `MainTable`; the calendar has no table to get them
 * from, and a semester's worth of sessions with no way to narrow them is not a
 * working screen. It takes the SAME `filterFields` the table does, so both
 * views filter on one definition.
 */
const props = withDefaults(
    defineProps<{
        filterFields: CrudFilter[];
        searchPlaceholder?: string;
        loading?: boolean;
        /**
         * What is already applied. The toolbar unmounts on a view switch, so
         * without these it would come back blank while the fetch stays filtered.
         */
        initialSearch?: string;
        initialFilters?: Record<string, unknown>;
        addLabel?: string;
        canAdd?: boolean;
    }>(),
    {
        searchPlaceholder: '',
        loading: false,
        initialSearch: '',
        initialFilters: () => ({}),
        addLabel: '',
        canAdd: false
    }
);

const emit = defineEmits<{
    (e: 'search', value: string): void;
    (e: 'filter-change', value: Record<string, unknown>): void;
    (e: 'refresh'): void;
    (e: 'add'): void;
}>();

const searchQuery = ref(props.initialSearch);
const selected = ref<Record<string, unknown>>({ ...props.initialFilters });

/** A filter the host dropped (its lookup catalogue changed) must not stay applied. */
watch(
    () => props.filterFields,
    (fields) => {
        const keys = new Set(fields.map((field) => field.key));
        Object.keys(selected.value).forEach((key) => {
            if (!keys.has(key)) delete selected.value[key];
        });
    }
);

const onFilter = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
        delete selected.value[key];
    } else {
        selected.value[key] = value;
    }

    emit('filter-change', { ...selected.value });
};
</script>

<template>
    <section class="schedule-card border-border-default rounded-2xl border p-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
            <div class="flex flex-wrap items-end gap-3">
                <!-- Server-side: MainSearch debounces and emits `search`, never `update:modelValue`. -->
                <MainSearch
                    v-model="searchQuery"
                    class="min-w-64"
                    :placeholder="searchPlaceholder"
                    :icon="Search"
                    is-server-side
                    @search="(value: string) => emit('search', value)" />

                <MainSelect
                    v-for="field in filterFields"
                    :key="field.key"
                    class="min-w-44"
                    :model-value="selected[field.key] ?? null"
                    :options="field.options"
                    option-label="label"
                    option-value="value"
                    :placeholder="field.label"
                    size="normal"
                    show-clear
                    @update:modelValue="(value: unknown) => onFilter(field.key, value)" />
            </div>

            <div class="flex items-center gap-2">
                <MainButton
                    outlined
                    :icon="RefreshIcon"
                    :loading="loading"
                    :tooltip="$lang.refresh || 'Refresh'"
                    @click="emit('refresh')" />
                <MainButton
                    v-if="canAdd"
                    severity="primary"
                    :label="addLabel"
                    @click="emit('add')" />
            </div>
        </div>
    </section>
</template>
