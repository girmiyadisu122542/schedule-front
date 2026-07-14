<script setup lang="ts">
import { computed } from 'vue';

import {
    BADGE_SEVERITY,
    CONTROL_SIZE,
    LABEL_POSITION,
    type BadgeSeverity,
    type ControlSize,
    type LabelPosition
} from '@/config/appConfig';

const props = defineProps<{
    label?: string;
    activeColor?: string;
    inactiveColor?: string;
    disabled?: boolean;
    modelValue?: boolean;
    hasBorder?: boolean | null;
    labelPosition?: LabelPosition;
    size?: ControlSize;
    variant?: BadgeSeverity;
    onOffVariant?: BadgeSeverity;
}>();

const emit = defineEmits(['update:modelValue']);

const isChecked = computed({
    get: () => !!props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
});

function toggleFromEvent(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    isChecked.value = checked;
}

const activeColorClass = computed(() => {
    if (props.activeColor) return `peer-checked:${props.activeColor}`;
    switch (props.variant) {
        case BADGE_SEVERITY.PRIMARY:
            return 'peer-checked:bg-schedule-brand-blue';
        case BADGE_SEVERITY.SUCCESS:
            return 'peer-checked:bg-schedule-success-500';
        case BADGE_SEVERITY.WARN:
            return 'peer-checked:bg-schedule-warning-500';
        case BADGE_SEVERITY.INFO:
            return 'peer-checked:bg-schedule-info-500';
        case BADGE_SEVERITY.DANGER:
            return 'peer-checked:bg-schedule-error-500';
        default:
            return 'peer-checked:bg-schedule-brand-blue';
    }
});

const inactiveColorClass = computed(() => {
    if (props.inactiveColor) return props.inactiveColor;
    switch (props.onOffVariant) {
        case BADGE_SEVERITY.PRIMARY:
            return 'bg-schedule-brand-blue';
        case BADGE_SEVERITY.SUCCESS:
            return 'bg-schedule-success-500';
        case BADGE_SEVERITY.WARN:
            return 'bg-schedule-warning-500';
        case BADGE_SEVERITY.INFO:
            return 'bg-schedule-info-500';
        case BADGE_SEVERITY.DANGER:
            return 'bg-schedule-error-500';
        default:
            return 'bg-gray-300';
    }
});

const sizeClasses = computed(() => {
    switch (props.size) {
        case CONTROL_SIZE.SMALL:
            return {
                track: 'w-9 h-5 after:h-4 after:w-4 after:top-[2px] after:start-[2px]',
                translate: 'peer-checked:after:translate-x-4'
            };
        case CONTROL_SIZE.LARGE:
            return {
                track: 'w-14 h-8 after:h-7 after:w-7 after:top-[2px] after:start-[2px]',
                translate: 'peer-checked:after:translate-x-6'
            };
        default:
            return {
                track: 'w-11 h-6 after:h-5 after:w-5 after:top-[2px] after:start-[2px]',
                translate: 'peer-checked:after:translate-x-full'
            };
    }
});

const trackClass = computed(() =>
    [
        'relative rounded-full peer-focus:outline-none transition-all duration-300 ease-in-out',
        sizeClasses.value.track,
        sizeClasses.value.translate,
        "after:content-[''] after:absolute after:bg-white after:rounded-full after:transition-all after:shadow-sm",

        activeColorClass.value,

        inactiveColorClass.value,

        props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ].join(' ')
);

const barContainerClass = computed(() =>
    props.variant === BADGE_SEVERITY.BAR
        ? 'w-full bg-white border border-schedule-border-subtle text-xl dark:bg-gray-800 rounded-2xl px-4 min-h-[85px] flex items-center justify-between'
        : 'inline-flex items-center gap-2'
);

const labelFlexClass = computed(() => {
    if (props.variant === BADGE_SEVERITY.BAR) return 'flex-row-reverse justify-between w-full';
    return props.labelPosition === LABEL_POSITION.LEFT ? 'flex-row-reverse' : 'flex-row';
});
</script>

<template>
    <div :class="[variant === BADGE_SEVERITY.BAR ? 'w-full' : 'inline-block']">
        <label :class="[barContainerClass, labelFlexClass, 'cursor-pointer select-none']">
            <input
                type="checkbox"
                class="peer sr-only"
                :checked="isChecked"
                @change="toggleFromEvent"
                :disabled="props.disabled" />

            <div :class="[trackClass]">
                <span
                    v-if="onOffVariant && onOffVariant !== BADGE_SEVERITY.BAR"
                    class="absolute top-1/2 left-1 -translate-y-1/2 text-xs font-medium text-white transition-opacity peer-checked:opacity-0"></span>
                <span
                    v-if="onOffVariant && onOffVariant !== BADGE_SEVERITY.BAR"
                    class="absolute top-1/2 right-1 -translate-y-1/2 text-xs font-medium text-white opacity-0 transition-opacity peer-checked:opacity-100"></span>
            </div>

            <span
                v-if="label"
                :class="[
                    props.disabled ? 'text-gray-400' : 'text-gray-900 dark:text-gray-300',
                    variant === BADGE_SEVERITY.BAR
                        ? 'text-schedule-text-secondary -mt-4 text-lg font-medium'
                        : 'text-sm font-medium'
                ]">
                {{ label }}
            </span>
        </label>
    </div>
</template>
