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
            d="M16.1378 21H7.85782C6.81082 21 5.94082 20.192 5.86282 19.147L4.96582 7H18.9998L18.1328 19.142C18.0578 20.189 17.1868 21 16.1378 21V21Z" />
        <path d="M12 11V17" />
        <path d="M4 7H20" />
        <path d="M17 7L15.987 4.298C15.694 3.517 14.948 3 14.114 3H9.886C9.052 3 8.306 3.517 8.013 4.298L7 7" />
        <path d="M15.4298 11L14.9998 17" />
        <path d="M8.57016 11L9.00016 17" />
    </svg>
</template>
