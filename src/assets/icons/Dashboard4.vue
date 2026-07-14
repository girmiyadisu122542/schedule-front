<script setup lang="ts">
const props = defineProps<{
    size?: number | string;
    color?: string;
    stroke?: string;
    strokeWidth?: number | string;
}>();
</script>

<template>
    <svg
        :width="props.size || 24"
        :height="props.size || 24"
        fill="none"
        :stroke="props.stroke || 'currentColor'"
        :stroke-width="props.strokeWidth || 2"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24">
        <circle
            cx="11.9996"
            cy="11.9996"
            r="1.50063" />
        <circle
            cx="11.9998"
            cy="11.9998"
            r="9.00375" />
        <path d="M16.0021 7.99805L13.1846 10.8155" />
        <path d="M12.0005 5.99805C8.68546 5.99805 5.99805 8.68546 5.99805 12.0005" />
        <path d="M13.7342 6.26436C13.1726 6.08976 12.5881 5.9999 12 5.99777" />
    </svg>
</template>
