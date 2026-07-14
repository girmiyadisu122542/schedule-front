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
        <path d="M10.03 5H4.5" />
        <path
            d="M13.4416 3.58579C14.2226 4.36684 14.2226 5.63317 13.4416 6.41422C12.6605 7.19527 11.3942 7.19527 10.6131 6.41422C9.83208 5.63317 9.83208 4.36684 10.6131 3.58579C11.3942 2.80474 12.6605 2.80474 13.4416 3.58579" />
        <path d="M19.5003 5H14.0303" />
        <path d="M4.5 20.75H19.5" />
        <path d="M12.0296 7L11.9996 20.75" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.81357 13.227C8.92757 13.407 8.99257 13.618 8.97257 13.83C8.80557 15.608 7.30957 17 5.48757 17C3.66657 17 2.17057 15.609 2.00257 13.831C1.98257 13.619 2.04857 13.404 2.16357 13.224L5.48757 8C5.48757 8 8.10657 12.115 8.81357 13.227V13.227Z" />
        <path d="M8.94004 13.5H2.04004" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M21.8409 13.227C21.9549 13.407 22.0199 13.618 21.9999 13.83C21.8329 15.608 20.3369 17 18.5149 17C16.6939 17 15.1979 15.609 15.0299 13.831C15.0099 13.619 15.0759 13.404 15.1909 13.224L18.5149 8C18.5149 8 21.1329 12.115 21.8409 13.227Z" />
        <path d="M21.9696 13.5H15.0596" />
    </svg>
</template>
