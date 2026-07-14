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
            d="M15.2158 10.4277C17.0021 10.3627 18.42 8.90177 18.4314 7.11433C18.4038 5.36565 16.9645 3.97009 15.2158 3.99646" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9.42753 10.4277C11.2138 10.3627 12.6317 8.90177 12.6432 7.11433C12.6156 5.36565 11.1762 3.97009 9.42753 3.99646C7.67884 3.97009 6.23952 5.36565 6.21191 7.11433C6.22292 8.90195 7.64104 10.3632 9.42753 10.4277V10.4277Z" />
        <path
            d="M16.002 20.0025V18.0017C16.002 15.7916 14.2104 14 12.0003 14H6.99825C4.78819 14 2.99658 15.7916 2.99658 18.0017V20.0025" />
        <path d="M21.0037 20.0025V17.0013C21.0037 15.3437 19.66 14 18.0024 14" />
    </svg>
</template>
