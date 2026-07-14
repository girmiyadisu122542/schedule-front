<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    modelValue: boolean | number[] | string[] | undefined;
    value?: any;
    binary?: boolean;
    disabled?: boolean;
    circular?: boolean;
    size?: 'small' | 'normal' | 'large';
    label?: string;
    description?: string;
    labelClass?: string;
    descriptionClass?: string;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', val: boolean | any[]): void;
    (e: 'change', val: boolean | any[]): void;
}>();

// default binary to true if modelValue is boolean
const isBinary = computed(() => props.binary ?? typeof props.modelValue === 'boolean');

// compute whether it is checked
const isChecked = computed<boolean>(() => {
    if (isBinary.value) {
        return props.modelValue as boolean;
    } else {
        if (props.value === undefined) return false;
        const arr: any[] = Array.isArray(props.modelValue) ? (props.modelValue as any[]) : [];
        return arr.includes(props.value);
    }
});

function toggle() {
    if (props.disabled) return;

    if (isBinary.value) {
        const newVal = !(props.modelValue as boolean);
        emits('update:modelValue', newVal);
        emits('change', newVal);
    } else {
        let arr = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        if (props.value === undefined) return;
        const index = arr.indexOf(props.value);
        if (index === -1) arr.push(props.value);
        else arr.splice(index, 1);
        emits('update:modelValue', arr);
        emits('change', arr);
    }
}

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'small':
            return 'h-4 w-4';
        case 'large':
            return 'h-7 w-7';
        default:
            return 'h-5 w-5';
    }
});

const iconSizeClass = computed(() => {
    switch (props.size) {
        case 'small':
            return 'text-[9px]';
        case 'large':
            return 'text-xs';
        default:
            return 'text-xs';
    }
});

function handleKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggle();
    }
}
</script>

<template>
    <div
        :class="[
            'group inline-flex gap-3 rounded-lg transition-all duration-150 select-none',
            props.description ? 'items-start' : 'items-center',
            props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        ]"
        role="checkbox"
        :aria-checked="isChecked"
        :aria-disabled="props.disabled"
        :tabindex="props.disabled ? -1 : 0"
        @click="toggle"
        @keydown="handleKeydown">
        <div
            :class="[
                'relative inline-flex items-center justify-center border shadow-xs transition-all duration-150',
                sizeClasses,
                props.circular ? 'rounded-full' : 'rounded-md',
                isChecked
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900',

                !props.disabled && !isChecked ? 'group-hover:border-primary-400' : ''
            ]">
            <i
                v-if="isChecked"
                :class="['fa-solid fa-check leading-none font-semibold text-white', iconSizeClass]"></i>
        </div>

        <div
            v-if="props.label || props.description || $slots.default"
            class="-mt-1 flex min-w-0 flex-1 flex-col">
            <span
                v-if="props.label"
                class="cursor-pointer"
                :class="props.labelClass || 'text-schedule-text-secondary text-sm font-medium dark:text-gray-100'">
                {{ props.label }}
            </span>

            <span
                v-if="props.description"
                class="mt-1"
                :class="props.descriptionClass || 'text-schedule-text-tertiary text-xs font-normal dark:text-gray-400'">
                {{ props.description }}
            </span>

            <div
                v-if="$slots.default"
                class="mt-1">
                <slot />
            </div>
        </div>
    </div>
</template>
