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
        <path d="M12 3l1.9 4.8L18.7 9.7 13.9 11.6 12 16.4 10.1 11.6 5.3 9.7 10.1 7.8 12 3Z" />
        <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
        <path d="M5 15l.6 1.5 1.5.6-1.5.6L5 19.8l-.6-1.5-1.5-.6 1.5-.6L5 15Z" />
    </svg>
</template>
