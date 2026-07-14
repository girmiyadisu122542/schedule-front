<script setup lang="ts">
defineProps({
    isActive: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-transform duration-200"
        :class="{ '-rotate-90': isActive }">
        <path d="m6 9 6 6 6-6"></path>
    </svg>
</template>
