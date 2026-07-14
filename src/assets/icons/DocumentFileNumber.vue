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
        viewBox="0 0 24 24">
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M18.414 6.414L15.586 3.586C15.211 3.211 14.702 3 14.172 3H7C5.895 3 5 3.895 5 5V19C5 20.105 5.895 21 7 21H17C18.105 21 19 20.105 19 19V7.828C19 7.298 18.789 6.789 18.414 6.414V6.414Z" />
        <path d="M19 8H15C14.448 8 14 7.552 14 7V3" />
        <path d="M9.69922 17.9998L10.8492 11.0898" />
        <path d="M13.1504 17.9998L14.3004 11.0898" />
        <path d="M15.8008 12.8516H8.80078" />
        <path d="M15.1992 16.25H8.19922" />
    </svg>
</template>
