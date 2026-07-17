<script setup lang="ts">
import FormLoader from '@/assets/icons/FormLoader.vue';
import MainBadge from '@/components/common/MainBadge.vue';
import { ref } from 'vue';

defineOptions({
    name: 'MainButton',
    inheritAttrs: false
});

type ButtonSize = 'small' | 'normal' | 'large';
type ButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'gray' | 'text';
type ButtonType = 'button' | 'submit' | 'reset';
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
type ButtonWidth = 'auto' | 'full' | 'fit';
type BadgeSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
type OutlineSeverity = 'primary' | 'danger' | 'secondary' | 'success' | 'info' | 'warn' | 'contrast' | 'none';

const props = defineProps<{
    label?: string;
    icon?: string | Object;
    iconPos?: TooltipPosition;
    severity?: ButtonSeverity;
    rounded?: boolean;
    outlined?: boolean;
    outlinedDanger?: boolean;
    text?: boolean;
    ghost?: boolean;
    loading?: boolean;
    disabled?: boolean;
    size?: ButtonSize;
    type?: ButtonType;
    tooltip?: string;
    tooltipPosition?: TooltipPosition;
    width?: ButtonWidth;
    badge?: string | number;
    badgeSeverity?: BadgeSeverity;
    badgeOverlay?: boolean;
    outlineSeverity?: OutlineSeverity;
    noWrap?: boolean;
}>();

const showTooltip = ref(false);

const base =
    'inline-flex cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-colors focus:outline-none rounded-md';

const sizes: Record<ButtonSize, string> = {
    small: 'px-2 text-sm',
    normal: 'px-3 py-2.5 text-base',
    large: 'px-6 py-3 text-lg'
};

const iconOnlySizes: Record<ButtonSize, string> = {
    small: 'px-1 text-sm',
    normal: 'px-2 py-2 text-base',
    large: 'px-4 py-3 text-lg'
};

const severities: Record<ButtonSeverity, string> = {
    primary: 'bg-schedule-brand-blue text-white hover:bg-schedule-brand-blue-primary-hover',
    secondary: 'bg-surface-card text-text-secondary border-border-default hover:bg-surface-hover border',
    success: 'bg-green-500 text-white hover:bg-green-600',
    info: 'bg-cyan-500 text-white hover:bg-cyan-600',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    help: 'bg-cyan-500 text-white hover:bg-cyan-600',
    gray: 'bg-gray-500 text-white hover:bg-gray-600',
    text: 'bg-transparent text-schedule-text-brand-primary hover:text-primary-400'
};

// Outlined buttons -- the "subtle hover" severities (primary / contrast)
// used to wash to a pale tint (bg-blue-50, bg-gray-800/text-white) that
// turned into a white burn in dark mode. Dark variants now use a low-alpha
// brand-tint backdrop + a lighter text color, matching the Badge pattern
// (dark:bg-schedule-brand-blue/15  +  dark:text-schedule-text-brand-secondary).
// The "fill-on-hover" severities (danger/success/info/warn/secondary) keep
// their hover behaviour -- it reads fine on dark surfaces too.
const outlineSeverities: Record<OutlineSeverity, string> = {
    primary:
        'border border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-schedule-text-brand-secondary dark:hover:bg-schedule-brand-blue/15 dark:hover:text-white',
    danger: 'border border-red-500 text-red-600 hover:bg-red-500 hover:text-white dark:text-schedule-error-300 dark:hover:bg-schedule-error-500/85',
    secondary: 'border border-gray-500 text-gray-600 dark:text-text-secondary',
    success:
        'border border-green-500 text-green-600 hover:bg-green-500 hover:text-white dark:text-schedule-success-300 dark:hover:bg-schedule-success-500/85',
    info: 'border border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white dark:text-schedule-info-300 dark:hover:bg-schedule-info-500/85',
    warn: 'border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white dark:text-schedule-warning-300 dark:hover:bg-schedule-warning-500/85',
    contrast:
        'border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white dark:border-border-strong dark:text-text-primary dark:hover:bg-surface-hover',
    none: 'border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary border'
};

const widths: Record<ButtonWidth, string> = {
    auto: 'w-auto',
    full: 'w-full',
    fit: 'w-fit'
};

const tooltipPositions: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
};

const tooltipArrows: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
};

function getClasses() {
    const size = props.size ?? 'normal';
    const width = props.width ?? 'auto';

    let cls = [base, widths[width], props.label ? sizes[size] : iconOnlySizes[size]];

    if (props.ghost) {
        cls.push('bg-transparent text-gray-400 hover:text-primary-600');
    } else if (props.outlined) {
        cls.push(outlineSeverities[props.outlineSeverity ?? 'none']);
    } else if (props.text) {
        cls.push('bg-transparent text-schedule-text-brand-primary dark:text-schedule-tertiary hover:text-blue-400');
    } else {
        cls.push(severities[props.severity ?? 'primary']);
    }

    if (props.rounded) {
        cls = cls.filter((c) => !c.includes('rounded-md'));
        cls.push('rounded-full');
    }

    if (props.disabled || props.loading) {
        cls.push('opacity-60 cursor-not-allowed');
    }

    if (props.noWrap) {
        cls.push('whitespace-nowrap');
    }

    return cls.join(' ');
}

function iconClass(side: 'left' | 'right') {
    return props.label ? (side === 'left' ? 'mr-2' : 'ml-2') : '';
}
</script>

<template>
    <div
        class="relative inline-block"
        :class="{ 'w-full': width === 'full' }">
        <!-- BUTTON -->
        <button
            v-bind="$attrs"
            :type="type ?? 'button'"
            :class="[getClasses(), $attrs.class]"
            :disabled="disabled || loading"
            @mouseenter="showTooltip = true"
            @mouseleave="showTooltip = false">
            <!-- 🔥 Custom slot -->
            <slot v-if="$slots.default" />

            <!-- ✅ Default UI -->
            <template v-else>
                <FormLoader
                    v-if="loading"
                    class="mr-2 h-4 w-4 animate-spin" />

                <span v-if="icon && iconPos !== 'right'">
                    <component
                        v-if="typeof icon !== 'string'"
                        :is="icon"
                        :class="[iconClass('left')]" />
                    <i
                        v-else
                        :class="[icon, iconClass('left')]" />
                </span>

                <span v-if="label">{{ label }}</span>

                <MainBadge
                    v-if="badge && !badgeOverlay"
                    :value="badge"
                    :severity="badgeSeverity ?? 'primary'"
                    size="small"
                    class="ml-2" />

                <span v-if="icon && iconPos === 'right'">
                    <component
                        v-if="typeof icon !== 'string'"
                        :is="icon"
                        :class="iconClass('right')" />
                    <i
                        v-else
                        :class="[icon, iconClass('right')]" />
                </span>
            </template>
        </button>

        <!-- Tooltip -->
        <transition name="fade">
            <div
                v-if="tooltip && showTooltip"
                :class="[
                    'absolute z-50 rounded bg-gray-900 px-2 py-1 text-sm text-white',
                    tooltipPositions[tooltipPosition ?? 'top']
                ]">
                {{ tooltip }}
                <div
                    class="absolute border-4"
                    :class="tooltipArrows[tooltipPosition ?? 'top']"></div>
            </div>
        </transition>
    </div>
</template>
