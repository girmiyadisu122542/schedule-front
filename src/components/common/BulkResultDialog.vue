<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';

/** One row a bulk run refused, as every bulk endpoint reports it. */
export interface BulkResultFailure {
    id: number | string;
    label: string | null;
    reason: string;
    reason_message?: string;
}

/**
 * What a bulk run actually did.
 *
 * This exists because the outcome does not fit in a toast. A run reports a
 * count plus a row-by-row list of refusals, and each row is named by its full
 * label — "CS101 — Introduction to Computer Science (BSc in Computer Science
 * Year 1 - A) (Monday 08:00–09:30)". Three of those in a toast is a wall of
 * text that disappears before it can be read, which is exactly what it did.
 *
 * So the toast now carries only the count, and anything that needs reading
 * lands here: scrollable, dismissable at the reader's pace, one line per row.
 */
defineProps<{
    visible: boolean;
    title?: string;
    succeeded: number;
    failed: BulkResultFailure[];
    succeededLabel?: string;
    failedLabel?: string;
}>();

const emit = defineEmits<{ (event: 'update:visible', value: boolean): void }>();
</script>

<template>
    <MainDialog
        :visible="visible"
        :header="title || $lang.bulkResult || 'Result'"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-5 py-2">
            <div class="flex flex-wrap gap-3">
                <div class="bg-schedule-success/10 flex-1 rounded-xl px-4 py-3">
                    <p class="text-text-tertiary text-xs">
                        {{ succeededLabel || $lang.succeeded || 'Succeeded' }}
                    </p>
                    <p class="text-schedule-success text-2xl font-semibold">{{ succeeded }}</p>
                </div>
                <div
                    v-if="failed.length"
                    class="bg-schedule-error/10 flex-1 rounded-xl px-4 py-3">
                    <p class="text-text-tertiary text-xs">
                        {{ failedLabel || $lang.notDone || 'Not done' }}
                    </p>
                    <p class="text-schedule-error text-2xl font-semibold">{{ failed.length }}</p>
                </div>
            </div>

            <div v-if="failed.length">
                <p class="text-text-tertiary mb-2 text-xs">
                    {{
                        $lang.bulkFailedHint ||
                        'These were left unchanged. Everything else went through.'
                    }}
                </p>
                <!-- Scrolls rather than growing: a run can refuse many rows. -->
                <ul class="border-border-subtle max-h-72 divide-y overflow-y-auto rounded-xl border">
                    <li
                        v-for="row in failed"
                        :key="row.id"
                        class="px-4 py-2.5">
                        <p class="text-text-primary text-sm">{{ row.label ?? `#${row.id}` }}</p>
                        <p class="text-schedule-error text-xs">
                            {{ row.reason_message || row.reason }}
                        </p>
                    </li>
                </ul>
            </div>
        </div>

        <template #footer>
            <div class="mx-2 flex justify-end">
                <MainButton
                    :label="$lang.close || 'Close'"
                    severity="primary"
                    @click="emit('update:visible', false)" />
            </div>
        </template>
    </MainDialog>
</template>
