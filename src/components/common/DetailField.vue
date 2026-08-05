<script setup lang="ts">
/**
 * One label/value pair in a detail page's field grid.
 *
 * Distinct from `modules/user/components/common/DetailField.vue`, which is the
 * starter kit's larger badge-carrying variant used inside dialogs. This one is
 * a `<dt>`/`<dd>` pair so a page's grid is a real `<dl>`.
 */
withDefaults(
    defineProps<{
        label: string;
        value?: string | number | null;
        /** Renders monospaced-aligned — for times, dates and counts. */
        numeric?: boolean;
    }>(),
    { value: null, numeric: false }
);
</script>

<template>
    <div class="min-w-0">
        <dt class="text-text-tertiary text-xs">{{ label }}</dt>
        <dd
            class="text-text-primary mt-1 text-sm font-medium break-words"
            :class="{ 'tabular-nums': numeric }">
            <slot>{{ value === null || value === '' ? '—' : value }}</slot>
        </dd>
    </div>
</template>
