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
        <path
            d="M7.5 6C5 6 3 8 3 10.5S5 15 7.5 15c.2 0 .4 0 .6-.05C7.6 16.7 6.2 18 4.3 18.4a.75.75 0 0 0 .3 1.47C8.3 19.2 11 16 11 11.5 11 8.46 9.43 6 7.5 6Zm10 0C15 6 13 8 13 10.5S15 15 17.5 15c.2 0 .4 0 .6-.05-.5 1.75-1.9 3.05-3.8 3.45a.75.75 0 0 0 .3 1.47C18.3 19.2 21 16 21 11.5 21 8.46 19.43 6 17.5 6Z" />
    </svg>
</template>
