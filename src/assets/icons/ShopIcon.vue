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
        <path d="M4.2207 10.89V20.89" />
        <path d="M19.7793 10.89V20.89" />
        <path
            d="M14.2213 20.889V16.445C14.2213 15.218 13.2263 14.223 11.9993 14.223C10.7723 14.223 9.77734 15.218 9.77734 16.445V20.889" />
        <path d="M2 20.89H22" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M4.30059 10.889C2.60259 10.877 1.49559 9.19602 2.23159 7.74702L3.94659 4.37002C4.33759 3.60002 5.15959 3.11102 6.06159 3.11102H17.9376C18.8396 3.11102 19.6616 3.60002 20.0526 4.37002L21.7686 7.74702C22.5046 9.19602 21.3976 10.877 19.6996 10.889C18.2826 10.889 17.1336 9.92102 17.1336 8.72602V8.67802C17.1336 9.89902 15.9846 10.889 14.5676 10.889C13.1506 10.889 12.0016 9.89902 12.0016 8.67802C12.0016 9.89902 10.8526 10.889 9.43559 10.889C8.01859 10.889 6.86959 9.89902 6.86959 8.67802V8.72602C6.86659 9.92102 5.71759 10.889 4.30059 10.889Z" />
    </svg>
</template>
