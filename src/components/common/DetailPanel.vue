<script setup lang="ts" generic="TRow extends { id: number }">
import { ref, onMounted, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import { RouterLink } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { readApiErrorMessage } from '@/utils/apiError';
import type { Pagination } from '@/types/CommonTypes';

/** One column of a related list. `format` covers everything a slot would. */
export interface PanelColumn<TRow> {
    key: string;
    label: string;
    format?: (row: TRow) => string | number | null | undefined;
    numeric?: boolean;
}

const props = withDefaults(
    defineProps<{
        title: string;
        /** Usually the entity's own `fetchX` with the parent id already bound. */
        fetcher: () => Promise<{ data: TRow[]; pagination: Pagination | null }>;
        columns: Array<PanelColumn<TRow>>;
        emptyText: string;
        /** Where "see all" goes — omitted when there is no list screen to go to. */
        to?: string;
        seeAllLabel?: string;
    }>(),
    { to: '', seeAllLabel: 'See all' }
);

const { customizeLanguageData } = useLanguageStore();

const rows = ref<TRow[]>([]) as Ref<TRow[]>;
const total = ref<number | null>(null);
const isLoading = ref(false);

/**
 * Related panels are secondary to the record itself, so a failure here is a
 * toast and an empty panel — never something that blanks the whole page.
 */
const load = async () => {
    isLoading.value = true;
    try {
        const result = await props.fetcher();
        rows.value = result.data;
        total.value = result.pagination?.total ?? result.data.length;
    } catch (error: unknown) {
        toast.error(readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong')));
        rows.value = [];
        total.value = 0;
    } finally {
        isLoading.value = false;
    }
};

const cellValue = (row: TRow, column: PanelColumn<TRow>) => {
    const value = column.format ? column.format(row) : (row as Record<string, unknown>)[column.key];

    return value === null || value === undefined || value === '' ? '—' : String(value);
};

defineExpose({ reload: load });

onMounted(load);
</script>

<template>
    <section class="schedule-card border-border-default rounded-2xl border p-6">
        <header class="border-border-subtle mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <h2 class="text-text-primary text-base font-semibold">
                {{ title }}
                <span
                    v-if="total !== null"
                    class="text-text-tertiary ml-2 text-sm font-normal">
                    {{ total }}
                </span>
            </h2>

            <RouterLink
                v-if="to && total"
                :to="to"
                class="text-schedule-icon-brand text-sm font-medium hover:underline">
                {{ seeAllLabel }}
            </RouterLink>
        </header>

        <p
            v-if="isLoading"
            class="text-text-tertiary text-sm">
            {{ $lang.loading || 'Loading…' }}
        </p>

        <p
            v-else-if="!rows.length"
            class="text-text-tertiary text-sm">
            {{ emptyText }}
        </p>

        <!-- Wide related tables scroll inside the panel, never the page. -->
        <div
            v-else
            class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="text-text-tertiary border-border-subtle border-b text-xs">
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            class="py-2 pr-4 font-medium whitespace-nowrap">
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="row in rows"
                        :key="row.id"
                        class="border-border-subtle border-b last:border-b-0">
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            class="text-text-secondary py-2 pr-4"
                            :class="{ 'whitespace-nowrap tabular-nums': column.numeric }">
                            {{ cellValue(row, column) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
