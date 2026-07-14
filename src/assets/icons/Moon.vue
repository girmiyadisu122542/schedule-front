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
            d="M18.395 13.0279C18.725 12.8729 19.077 13.1979 18.985 13.5509C18.671 14.7529 18.054 15.8969 17.104 16.8469C14.283 19.6679 9.77001 19.7269 7.02201 16.9789C4.27401 14.2309 4.33401 9.71686 7.15501 6.89586C8.10501 5.94586 9.24801 5.32886 10.451 5.01486C10.804 4.92286 11.128 5.27486 10.974 5.60486C9.97201 7.74386 10.301 10.3059 11.998 12.0029C13.694 13.7009 16.256 14.0299 18.395 13.0279V13.0279Z" />
    </svg>
</template>
