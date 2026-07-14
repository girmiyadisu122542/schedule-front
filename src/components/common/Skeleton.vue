<script setup lang="ts">
import { computed } from 'vue';

const isTailwindClass = (val?: string) =>
    !!val && (val.startsWith('w-') || val.startsWith('h-') || val.startsWith('rounded'));

const props = defineProps({
    shape: {
        type: String as () => 'circle' | 'rectangle',
        default: 'rectangle'
    },
    size: {
        type: String,
        default: null
    },
    width: {
        type: String,
        default: null
    },
    height: {
        type: String,
        default: null
    },
    borderRadius: {
        type: String,
        default: null
    },
    animation: {
        type: String as () => 'none' | 'wave',
        default: 'wave'
    },
    dt: {
        type: [Object, String, Number, Array],
        default: null
    },
    pt: {
        type: Object,
        default: () => ({})
    },
    ptOptions: {
        type: [Object, String, Number, Array],
        default: null
    },
    unstyled: {
        type: Boolean,
        default: false
    }
});

const shapeClass = computed(() => {
    if (props.shape === 'circle') return 'rounded-full';
    if (props.borderRadius && isTailwindClass(props.borderRadius)) return props.borderRadius;
    return 'rounded-md';
});

const animationClass = computed(() => (props.animation === 'wave' ? 'wave' : ''));

// Inline fallback for CSS units
const style = computed(() => {
    const styleObj: Record<string, string> = {};

    if (props.size && !props.size.includes('w-') && !props.size.includes('h-')) {
        styleObj.width = props.size;
        styleObj.height = props.size;
    } else {
        if (props.width && !isTailwindClass(props.width)) styleObj.width = props.width;
        if (props.height && !isTailwindClass(props.height)) styleObj.height = props.height;
    }

    if (props.borderRadius && !isTailwindClass(props.borderRadius) && props.shape !== 'circle') {
        styleObj.borderRadius = props.borderRadius;
    }

    return styleObj;
});

// Tailwind classes
const sizeClasses = computed(() => {
    if (props.size) {
        // Handle multi-class input like "w-12 h-12"
        if (/\s/.test(props.size)) return props.size.split(' ');
        // Single Tailwind size — duplicate for both width & height
        if (isTailwindClass(props.size)) {
            const heightClass = props.size.replace(/^w-/, 'h-');
            return [props.size, heightClass];
        }
        return [];
    }

    const widthClass = props.width && isTailwindClass(props.width) ? props.width : '';
    const heightClass = props.height && isTailwindClass(props.height) ? props.height : '';
    return [widthClass, heightClass];
});
</script>

<template>
    <div
        v-bind="pt"
        :class="[
            'relative overflow-hidden',
            shapeClass,
            animationClass,
            ...sizeClasses,
            !props.unstyled ? 'bg-linear-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600' : ''
        ]"
        :style="style" />
</template>

<style scoped>
@keyframes wave {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.wave::after {
    content: '';
    position: absolute;
    top: 0;
    left: -150%;
    height: 100%;
    width: 150%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: wave 1.6s linear infinite;
}
</style>
