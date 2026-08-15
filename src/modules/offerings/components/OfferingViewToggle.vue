<script setup lang="ts">
import { OFFERING_VIEW, type OfferingViewMode } from '@/modules/offerings/constants/offeringView';

import ColumnSolid from '@/assets/icons/ColumnSolid.vue';
import GridIcon from '@/assets/icons/GridIcon.vue';
import ListIcon from '@/assets/icons/ListIcon.vue';

/**
 * Board / cards / table switch for the offering queue.
 *
 * Same shape as `ScheduleViewToggle` so the two screens feel like one app, but
 * the three views answer offering questions rather than timetable ones — see
 * `offeringView.ts`.
 */
defineProps<{
    modelValue: OfferingViewMode;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: OfferingViewMode): void }>();

const options = [
    {
        value: OFFERING_VIEW.BOARD,
        icon: ColumnSolid,
        labelKey: 'boardView',
        labelFallback: 'Pipeline',
        hintKey: 'boardViewHint',
        hintFallback: 'Every offering by the tier holding it — where the plan is stuck'
    },
    {
        value: OFFERING_VIEW.CARDS,
        icon: GridIcon,
        labelKey: 'cardsView',
        labelFallback: 'Cards',
        hintKey: 'cardsViewHint',
        hintFallback: 'Grouped by department, with the decisions on each card'
    },
    {
        value: OFFERING_VIEW.TABLE,
        icon: ListIcon,
        labelKey: 'tableView',
        labelFallback: 'Table',
        hintKey: 'tableViewHint',
        hintFallback: 'Dense and comparable, for paging through a whole faculty'
    }
];
</script>

<template>
    <div class="border-border-default bg-surface-subtle inline-flex items-center gap-1 rounded-lg border p-1">
        <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
                modelValue === option.value
                    ? 'bg-surface-card text-text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
            "
            :title="$lang[option.hintKey] || option.hintFallback"
            @click="emit('update:modelValue', option.value)">
            <component
                :is="option.icon"
                class="h-4 w-4" />
            {{ $lang[option.labelKey] || option.labelFallback }}
        </button>
    </div>
</template>
