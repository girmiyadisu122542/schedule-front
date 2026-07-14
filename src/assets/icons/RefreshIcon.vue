<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        size?: number | string;
        strokeWidth?: number | string;
    }>(),
    {
        size: 16,
        strokeWidth: 1.5
    }
);
</script>

<template>
    <svg
        :width="props.size"
        :height="props.size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        :stroke-width="props.strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
        <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
</template>
