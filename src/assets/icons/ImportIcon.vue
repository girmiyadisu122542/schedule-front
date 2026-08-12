<script setup lang="ts">
/**
 * Import — an arrow coming DOWN INTO a tray.
 *
 * Paired deliberately with `ExportIcon`, whose arrow points UP OUT of the same
 * tray. The previous artwork drew both as a document beside a RIGHT-pointing
 * arrow, which made them indistinguishable at toolbar size; the vertical arrow
 * is what carries the meaning here.
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
        <!-- Arrow travelling down, into the tray. -->
        <path
            d="M10 2.5v9.5m0 0L6.25 8.25M10 12l3.75-3.75"
            stroke="currentColor"
            :stroke-width="props.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round" />
        <!-- The tray the data lands in. -->
        <path
            d="M3.5 13v2a2.5 2.5 0 0 0 2.5 2.5h8a2.5 2.5 0 0 0 2.5-2.5v-2"
            stroke="currentColor"
            :stroke-width="props.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round" />
    </svg>
</template>
