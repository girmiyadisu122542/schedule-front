<script setup lang="ts">
withDefaults(
    defineProps<{
        size?: number | string;
    }>(),
    {
        size: 24
    }
);
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="currentColor">
        <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z" />
    </svg>
</template>
