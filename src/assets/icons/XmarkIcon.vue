<script setup lang="ts">
defineProps<{
    title?: string;
}>();
</script>

<template>
    <svg
        :area-label="title"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path
            d="M6 6L18 18M18 6L6 18"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round" />
        <title v-if="title">{{ title }}</title>
    </svg>
</template>
