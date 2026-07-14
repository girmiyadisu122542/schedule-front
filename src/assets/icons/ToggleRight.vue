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
        :stroke-width="props.strokeWidth || 1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 20 20">
        <path
            d="M13.332 4.1665H6.66536C3.4437 4.1665 0.832031 6.77818 0.832031 9.99984C0.832031 13.2215 3.4437 15.8332 6.66536 15.8332H13.332C16.5537 15.8332 19.1654 13.2215 19.1654 9.99984C19.1654 6.77818 16.5537 4.1665 13.332 4.1665Z" />
        <path
            d="M13.332 12.4998C14.7127 12.4998 15.832 11.3805 15.832 9.99984C15.832 8.61913 14.7127 7.49984 13.332 7.49984C11.9513 7.49984 10.832 8.61913 10.832 9.99984C10.832 11.3805 11.9513 12.4998 13.332 12.4998Z" />
    </svg>
</template>
