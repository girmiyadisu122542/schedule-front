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
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10.4567 12.8675C11.8286 12.8675 12.9407 11.7553 12.9407 10.3834C12.9407 9.01155 11.8286 7.89941 10.4567 7.89941C9.0848 7.89941 7.97266 9.01155 7.97266 10.3834C7.97266 11.7553 9.0848 12.8675 10.4567 12.8675Z" />
        <path
            d="M17.8913 10.9238C18.1104 7.49635 15.9598 4.36271 12.6828 3.33473C9.40587 2.30674 5.85066 3.65045 4.07283 6.58889C2.29501 9.52734 2.75465 13.3001 5.18598 15.7258L10.4552 21.004" />
        <path d="M17.5041 14V17.0013" />
        <path
            d="M21.0029 17.78C21.0029 17.3501 20.6544 17.0017 20.2246 17.0017H14.7783C14.3485 17.0017 14 17.3501 14 17.78" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M15.0004 21.0029H20.0025C20.555 21.0029 21.0029 20.555 21.0029 20.0025V16.436C21.0028 16.0306 20.9208 15.6294 20.7618 15.2565L20.4837 14.6073C20.3264 14.2391 19.9647 14.0002 19.5643 14H15.4386C15.0379 13.9998 14.6757 14.2388 14.5182 14.6073L14.2411 15.2555C14.0821 15.6284 14.0001 16.0296 14 16.435V20.0025C14 20.555 14.4479 21.0029 15.0004 21.0029Z" />
    </svg>
</template>
