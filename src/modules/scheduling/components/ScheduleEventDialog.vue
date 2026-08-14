<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';

import { STATUS_DANGER } from '@/config/appConfig';
import type { ActionOption } from '@/components/common/ActionMenu.vue';

/** One line of the detail grid. */
export interface EventField {
    label: string;
    value: string;
}

/**
 * What a calendar block opens into: the session or sitting in full, plus every
 * action its current status allows.
 *
 * The actions are the SAME `getActionOptions()` list the table's row menu
 * renders — one definition of what may be done to a record, two places it can
 * be reached from.
 */
defineProps<{
    visible: boolean;
    title: string;
    subtitle?: string;
    /** The status chip, straight off the lookup value. */
    statusLabel?: string;
    statusColor?: string | null;
    fields: EventField[];
    actions: ActionOption[];
}>();

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

const close = () => emit('update:visible', false);

/** Run the row action, then get out of the way — every one of them refetches. */
const run = (action: ActionOption) => {
    close();
    action.onClick();
};
</script>

<template>
    <MainDialog
        :visible="visible"
        :header="title"
        :subtitle="subtitle"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-5 py-1">
            <!--
                This dialog receives the label and colour as separate props
                rather than the lookup value itself, so they are recomposed
                here into the shape StatusBadge reads.
            -->
            <StatusBadge
                v-if="statusLabel"
                :value="{ name: statusLabel, color: statusColor }" />

            <dl class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div
                    v-for="field in fields"
                    :key="field.label">
                    <dt class="text-text-tertiary text-xs">{{ field.label }}</dt>
                    <dd class="text-text-primary mt-0.5 text-sm font-medium break-words">{{ field.value }}</dd>
                </div>
            </dl>
        </div>

        <template #footer>
            <div class="mx-2 flex flex-wrap items-center justify-end gap-2">
                <MainButton
                    outlined
                    :label="$lang.close || 'Close'"
                    @click="close" />
                <!--
                    One primary button only — the first action offered is the
                    one the record's status is actually waiting on.
                -->
                <MainButton
                    v-for="(action, index) in actions"
                    :key="action.label"
                    :outlined="action.variant === STATUS_DANGER || index > 0"
                    :outline-severity="action.variant === STATUS_DANGER ? 'danger' : 'secondary'"
                    :severity="'primary'"
                    :icon="action.icon"
                    :label="action.label"
                    @click="run(action)" />
            </div>
        </template>
    </MainDialog>
</template>
