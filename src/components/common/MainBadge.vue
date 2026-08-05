<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';

import {
    ICON_POSITION,
    CURSOR_POINTER,
    BADGE_SEVERITY,
    BADGE_SIZE,
    type IconPosition,
    type BadgeSeverity,
    type BadgeSize
} from '@/config/appConfig';

const props = defineProps({
    /** The value/content to display inside the badge */
    value: { type: [String, Number], default: '' },
    /** The severity/variant of the badge */
    severity: { type: String as PropType<BadgeSeverity>, default: BADGE_SEVERITY.PRIMARY },
    /** The size of the badge */
    size: { type: String as PropType<BadgeSize>, default: BADGE_SIZE.NORMAL },
    /** Whether to display as overlay badge */
    overlay: { type: Boolean, default: false },
    /** color this one will be used for text and the lighter shade for background (hex code) */
    color: { type: String, default: '' },
    /** Font Awesome icon classes (e.g., 'fa-solid fa-rotate') */
    icon: { type: String, default: '' },
    /** Position of the icon relative to text */
    iconPosition: { type: String as PropType<IconPosition>, default: ICON_POSITION.BEFORE },
    /** If teh badge is clickable */
    clickable: { type: Boolean, default: false }
});

const badgeClasses = computed(() => {
    const baseClasses = overlay.value
        ? 'absolute -top-2 -right-2 inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold border-2 border-white dark:border-gray-900'
        : 'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold';

    // If custom colors are provided, don't include severity color classes
    const hasCustomColors = props.color !== '';

    const severityClasses = {
        [BADGE_SEVERITY.PRIMARY]: 'bg-blue-100 text-blue-700',
        [BADGE_SEVERITY.SECONDARY]: 'bg-gray-100 text-gray-700',
        [BADGE_SEVERITY.SUCCESS]: 'bg-green-100 text-green-700',
        [BADGE_SEVERITY.INFO]: 'bg-cyan-100 text-cyan-700',
        [BADGE_SEVERITY.WARN]: 'bg-yellow-100 text-yellow-700',
        [BADGE_SEVERITY.DANGER]: 'bg-red-100 text-red-700',
        [BADGE_SEVERITY.CONTRAST]: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
        // 'bar' is a ToggleSwitch layout variant, not a badge look — a badge
        // rendered with it falls back to the neutral secondary styling.
        [BADGE_SEVERITY.BAR]: 'bg-gray-100 text-gray-700'
    };

    const sizeClasses = {
        [BADGE_SIZE.SMALL]: 'text-[0.625rem] min-w-[1.25rem] h-5 px-1.5',
        [BADGE_SIZE.NORMAL]: 'text-xs min-w-[1.5rem] h-6 px-2',
        [BADGE_SIZE.LARGE]: 'text-sm min-w-[1.75rem] h-7 px-2.5',
        [BADGE_SIZE.XLARGE]: 'text-base min-w-[2rem] h-8 px-3'
    };

    // Override sizes for overlay to be smaller
    const overlaySizeClasses = {
        [BADGE_SIZE.SMALL]: 'text-[0.5rem] min-w-[1rem] h-4 px-0.5',
        [BADGE_SIZE.NORMAL]: 'text-[0.625rem] min-w-[1.25rem] h-5 px-1',
        [BADGE_SIZE.LARGE]: 'text-xs min-w-[1.5rem] h-6 px-1.5',
        [BADGE_SIZE.XLARGE]: 'text-sm min-w-[1.75rem] h-7 px-2'
    };

    const clickableClass = props.clickable ? CURSOR_POINTER : '';

    const sizeClass = overlay.value ? overlaySizeClasses[props.size] : sizeClasses[props.size];
    const severityClass = hasCustomColors ? '' : severityClasses[props.severity];

    return `${baseClasses} ${severityClass} ${sizeClass} ${clickableClass}`;
});

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1] ?? '00', 16),
              g: parseInt(result[2] ?? '00', 16),
              b: parseInt(result[3] ?? '00', 16)
          }
        : null;
};

// Computed property for custom inline styles
const badgeStyles = computed(() => {
    const styles: Record<string, string> = {};

    if (props.color) {
        const rgb = hexToRgb(props.color);
        if (rgb) {
            styles.color = props.color;
            styles.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
        }
    }

    return Object.keys(styles).length > 0 ? styles : undefined;
});

const overlay = computed(() => props.overlay);
</script>

<script lang="ts">
export default {
    name: 'MainBadge'
};
</script>

<template>
    <div
        v-if="overlay"
        class="relative inline-flex">
        <slot name="target"></slot>
        <span
            v-if="value || $slots.default || icon"
            :class="badgeClasses"
            :style="badgeStyles">
            <i
                v-if="icon && iconPosition === ICON_POSITION.BEFORE"
                :class="icon"
                class="mr-1"></i>
            <slot>{{ value }}</slot>
            <i
                v-if="icon && iconPosition === ICON_POSITION.AFTER"
                :class="icon"
                class="ml-1"></i>
        </span>
    </div>
    <span
        v-else
        :class="badgeClasses"
        :style="badgeStyles">
        <i
            v-if="icon && iconPosition === ICON_POSITION.BEFORE"
            :class="icon"
            class="mr-1"></i>
        <slot>{{ value }}</slot>
        <i
            v-if="icon && iconPosition === ICON_POSITION.AFTER"
            :class="icon"
            class="ml-1"></i>
    </span>
</template>
