<script setup lang="ts">
import type { Component } from 'vue';

import ClickableBadgeIcon from '@/assets/icons/ClickableBadge.vue';
import SidebarTooltip from '@/components/common/SidebarTooltip.vue';

interface Props {
    text: string;
    direction?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    icon?: Component;
    disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
    direction: 'top',
    delay: 200,
    icon: ClickableBadgeIcon,
    disabled: false
});
</script>

<template>
    <div class="inline-flex items-center gap-1.5">
        <slot />

        <SidebarTooltip
            v-if="text && !disabled"
            :text="text"
            :direction="direction"
            :delay="delay">
            <span
                class="inline-flex h-4 w-4 items-center justify-center text-schedule-text-tertiary transition-colors hover:text-schedule-brand-blue">
                <component
                    :is="icon"
                    class="h-4 w-4" />
            </span>
        </SidebarTooltip>
    </div>
</template>