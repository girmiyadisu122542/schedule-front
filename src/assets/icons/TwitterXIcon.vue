<script setup lang="ts">
withDefaults(
    defineProps<{
        size?: number | string;
    }>(),
    {
        size: 20
    }
);
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="currentColor">
        <path
            d="M18.24 2.25h3.31l-7.23 8.26L22.8 21.75h-6.6l-5.18-6.77-5.92 6.77H1.78l7.73-8.84L1.2 2.25h6.78l4.68 6.19 5.58-6.19Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
    </svg>
</template>
