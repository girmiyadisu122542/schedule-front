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
        <path d="M9 12l2 2 4-4" />
        <path
            d="M12 2.5l2.4 1.8 3 .2.9 2.9 2.3 1.9-1 2.8 1 2.8-2.3 1.9-.9 2.9-3 .2L12 21.5l-2.4-1.8-3-.2-.9-2.9-2.3-1.9 1-2.8-1-2.8 2.3-1.9.9-2.9 3-.2L12 2.5Z" />
    </svg>
</template>
