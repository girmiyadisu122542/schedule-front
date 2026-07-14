<script setup lang="ts">
withDefaults(
    defineProps<{
        size?: number | string;
        d?: string;
    }>(),
    {
        size: 20,
        d: 'M3 6h18M3 12h18M3 18h18'
    }
);
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none">
        <path
            :d="d"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round" />
    </svg>
</template>
