<script setup lang="ts">
import MainButton from '@/components/common/MainButton.vue';

/**
 * What a list shows when it has nothing in it.
 *
 * "No data available" is a dead end: it states a fact the reader can already
 * see and says nothing about why the list is empty or what to do about it.
 * The difference that matters is between "nothing exists yet" and "nothing
 * matches your filters" — the first calls for creating something, the second
 * for clearing a filter, and a single generic line cannot tell them apart.
 *
 * Deliberately plain: no illustration, no oversized card. This is an
 * administrative system, and an empty table is a routine state rather than an
 * event worth decorating.
 */
withDefaults(
    defineProps<{
        /** One line saying what is missing, in the page's own words. */
        title: string;
        /** Optional second line: why it might be empty, or what to do. */
        hint?: string;
        /** The one action worth offering here, if there is one. */
        actionLabel?: string;
        /** Set when filters are active — changes the advice, not the styling. */
        isFiltered?: boolean;
    }>(),
    { hint: '', actionLabel: '', isFiltered: false }
);

const emit = defineEmits<{ (e: 'action'): void }>();
</script>

<template>
    <div class="mx-auto flex max-w-md flex-col items-center gap-2 py-2 text-center">
        <p class="text-text-secondary text-sm font-medium">{{ title }}</p>

        <p
            v-if="hint"
            class="text-text-tertiary text-xs">
            {{ hint }}
        </p>

        <!--
            Offered only when the list is genuinely empty. With filters applied
            the useful move is to clear them, and a Create button there invites
            duplicating a record the user already has.
        -->
        <MainButton
            v-if="actionLabel && !isFiltered"
            outlined
            size="small"
            class="mt-1"
            :label="actionLabel"
            @click="emit('action')" />
    </div>
</template>
