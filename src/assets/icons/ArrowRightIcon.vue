<template>
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke-width="1.5"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': isActive }">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
    </svg>
</template>

<script setup lang="ts">
defineProps({
    isActive: {
        type: Boolean,
        default: false
    }
});
</script>
