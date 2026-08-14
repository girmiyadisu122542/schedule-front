<script setup lang="ts">
import { computed } from 'vue';

import Badge from '@/components/common/Badge.vue';
import { STATUS_LIGHT } from '@/config/appConfig';

/**
 * A lookup value rendered as a status chip.
 *
 * Every workflow label in this system — schedule status, exam type, offering
 * status, invigilation status, session type — is a `lookup_values` row carrying
 * its own name and colour. Rendering one used to mean repeating the same six
 * lines of `:style` colour binding at each call site, which had reached
 * thirteen files: the single most-read element on every screen, defined
 * thirteen times over, free to drift apart.
 *
 * The colour still comes from the catalogue, so a registrar recolouring a
 * status under Configuration recolours it everywhere. What is centralised here
 * is only HOW that colour is applied.
 */
const props = withDefaults(
    defineProps<{
        /**
         * The lookup value itself, when it has been loaded. Its `name` and
         * `color` win over the fallbacks below.
         */
        value?: { name?: string | null; color?: string | null } | null;
        /**
         * What to show when the catalogue has not loaded yet — usually the
         * embedded resource's own name, otherwise the stable code. A chip
         * reading "pending_confirmation" is poor, but far better than an empty
         * space where the status should be.
         */
        fallback?: string | null;
        /** Shown when there is neither. */
        placeholder?: string;
        size?: 'sm' | 'md' | 'lg';
        /**
         * Outlined by default: a page of solid chips fights the content for
         * attention, and status is context rather than the headline.
         */
        solid?: boolean;
    }>(),
    { placeholder: '—', size: 'md', solid: false }
);

const label = computed(() => props.value?.name || props.fallback || props.placeholder);

/**
 * A catalogue colour is applied inline because it is data, not a token — the
 * palette is whatever the institution configured. Without one the chip falls
 * back to the neutral variant rather than inventing a colour.
 */
const tint = computed(() =>
    props.value?.color ? { color: props.value.color, borderColor: props.value.color } : undefined
);
</script>

<template>
    <Badge
        :outlined="!solid"
        :variant="STATUS_LIGHT"
        :size="size"
        :style="tint"
        :label="label" />
</template>
