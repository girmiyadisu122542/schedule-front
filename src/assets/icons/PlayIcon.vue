<script setup lang="ts">
withDefaults(
    defineProps<{
        size?: number | string;
        strokeWidth?: number | string;
    }>(),
    {
        size: 24,
        strokeWidth: 1.5
    }
);
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle
            cx="12"
            cy="12"
            r="9.5" />
        <path d="M10 8.5l5 3.5-5 3.5V8.5Z" />
    </svg>
</template>
