<script setup lang="ts">
/**
 * Export — an arrow going UP OUT of a tray.
 *
 * The mirror of `ImportIcon`: same tray, opposite arrow. Keeping the tray
 * identical and flipping only the arrow is what makes the pair readable at
 * toolbar size, where the two buttons sit side by side.
 */
const props = withDefaults(
    defineProps<{
        size?: number | string;
        strokeWidth?: number | string;
    }>(),
    {
        size: 20,
        strokeWidth: 1.5
    }
);
</script>

<template>
    <svg
        :width="props.size || '20'"
        :height="props.size || '20'"
        viewBox="0 0 20 20"
        fill="none">
        <!-- Arrow travelling up, out of the tray. -->
        <path
            d="M10 12.5V3m0 0L6.25 6.75M10 3l3.75 3.75"
            stroke="currentColor"
            :stroke-width="props.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round" />
        <!-- The tray the data leaves. -->
        <path
            d="M3.5 13v2a2.5 2.5 0 0 0 2.5 2.5h8a2.5 2.5 0 0 0 2.5-2.5v-2"
            stroke="currentColor"
            :stroke-width="props.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round" />
    </svg>
</template>
