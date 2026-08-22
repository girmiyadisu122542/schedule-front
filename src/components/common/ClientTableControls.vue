<script setup lang="ts">
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';

/**
 * Search box, page size and pager for a table paged in the browser.
 *
 * Presentational only — it owns no data. It pairs with `useClientTable`, which
 * does the filtering and slicing; keeping the two apart is what lets the same
 * strip sit above any in-memory table without knowing what is in it.
 */
defineProps<{
    search: string;
    perPage: number;
    page: number;
    pageCount: number;
    total: number;
    rangeStart: number;
    rangeEnd: number;
    searchPlaceholder?: string;
}>();

const emit = defineEmits<{
    (event: 'update:search', value: string): void;
    (event: 'update:perPage', value: number): void;
    (event: 'update:page', value: number): void;
}>();

const pageSizes = [10, 25, 50, 100].map((size) => ({ id: size, name: String(size) }));
</script>

<template>
    <div class="flex flex-wrap items-center justify-between gap-3 py-2">
        <div class="w-full sm:w-72">
            <InputText
                :model-value="search"
                size="normal"
                :placeholder="searchPlaceholder || $lang.search || 'Search…'"
                @update:model-value="emit('update:search', String($event ?? ''))" />
        </div>

        <div class="flex flex-wrap items-center gap-3">
            <!-- Reads "1–25 of 812" so the reader knows how much is behind the page. -->
            <span class="text-text-tertiary text-xs tabular-nums">
                {{ rangeStart }}–{{ rangeEnd }} {{ $lang.of || 'of' }} {{ total }}
            </span>

            <div class="w-24">
                <MainSelect
                    :model-value="perPage"
                    :options="pageSizes"
                    option-label="name"
                    option-value="id"
                    size="normal"
                    @update:model-value="emit('update:perPage', Number($event))" />
            </div>

            <div class="flex items-center gap-1">
                <MainButton
                    outlined
                    :label="$lang.previous || 'Prev'"
                    :disabled="page <= 1"
                    @click="emit('update:page', page - 1)" />
                <span class="text-text-tertiary px-2 text-xs tabular-nums">{{ page }} / {{ pageCount }}</span>
                <MainButton
                    outlined
                    :label="$lang.next || 'Next'"
                    :disabled="page >= pageCount"
                    @click="emit('update:page', page + 1)" />
            </div>
        </div>
    </div>
</template>
