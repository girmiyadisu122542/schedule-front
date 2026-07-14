<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { useRoute } from 'vue-router';

import RightChevronIcon from '@/assets/icons/RightChevronIcon.vue';
import { useSidebarIconRegistry } from '@/composables/useSidebarIconRegistry';

import { BADGE_VARIANT, type BreadcrumbVariant } from '@/config/appConfig';

interface BreadcrumbItem {
    label?: string;
    href?: string;
    clickable?: boolean;
    [key: string]: unknown;
}

const props = defineProps<{
    icon?: Component;
    items?: BreadcrumbItem[];
    status?: {
        type?: BreadcrumbVariant;
        text?: string;
    };
    color?: string;
}>();

const emit = defineEmits<{
    (e: 'select', payload: { item: BreadcrumbItem; index: number }): void;
}>();

const route = useRoute();

// Leading icon: if a crumb carries an `iconName` (e.g. the Sales sidebar icon), resolve
// it like the sidebar does — a FontAwesome class renders as <i>, a registry name resolves
// to its SVG component — taking precedence over the :icon prop. Other modules that pass
// only :icon are unaffected (no iconName on their crumbs).
const isFaIcon = (name?: string): boolean => !!name && name.startsWith('fa');
const trailIconName = computed<string | undefined>(() => {
    const named = (props.items ?? []).find((entry) => typeof entry.iconName === 'string' && entry.iconName);
    return typeof named?.iconName === 'string' ? named.iconName : undefined;
});
const leadingIconClass = computed<string | null>(() =>
    isFaIcon(trailIconName.value) ? (trailIconName.value as string) : null
);
const leadingIconComponent = computed<Component | null>(() => {
    if (trailIconName.value && !isFaIcon(trailIconName.value)) {
        return (useSidebarIconRegistry as Record<string, Component>)[trailIconName.value] ?? props.icon ?? null;
    }
    return props.icon ?? null;
});
const hasLeadingIcon = computed(() => !!leadingIconClass.value || !!leadingIconComponent.value);
const formatLabel = (value: string) => {
    return value
        .replace(/Module|Page|View/gi, '')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

const autoBreadcrumbs = computed(() => {
    let fullPath = '';
    return route.matched
        .filter((r) => r.name)
        .map((r) => {
            if (r.path.startsWith('/')) fullPath = r.path;
            else fullPath += `/${r.path}`;
            return { label: formatLabel(String(r.name)), path: fullPath, clickable: false };
        });
});

const breadcrumbs = computed(() =>
    props.items
        ? props.items.map((i) => ({
              label: i.label,
              path: i.href ?? '',
              clickable: i.clickable ?? false,
              raw: i
          }))
        : autoBreadcrumbs.value.map((i) => ({ ...i, raw: i as BreadcrumbItem }))
);

const statusClasses = computed(() => {
    switch (props.status?.type) {
        case BADGE_VARIANT.SUCCESS:
            return 'bg-schedule-success-subtle text-schedule-success-strong';
        case BADGE_VARIANT.WARNING:
            return 'bg-schedule-warning-subtle text-schedule-warning-strong';
        case BADGE_VARIANT.ERROR:
            return 'bg-schedule-error-subtle text-schedule-error-default';
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-surface-subtle dark:text-text-secondary';
    }
});

// Computed property for custom inline styles
const badgeStyles = computed(() => {
    const color = props.color;
    if (!color) return undefined;
    return {
        color,
        backgroundColor: `${color}26`
    };
});
</script>

<template>
    <div class="flex w-full items-center justify-between gap-3">
        <div class="min-w-0 flex-1 overflow-x-auto">
            <nav
                aria-label="Breadcrumb"
                class="dark:text-text-tertiary flex items-center gap-1 text-xs font-medium text-gray-500 md:gap-2 md:text-sm">
                <!-- Icon -->
                <span
                    v-if="leadingIconClass"
                    class="shrink-0 text-gray-400">
                    <i
                        :class="leadingIconClass"
                        class="text-lg" />
                </span>
                <router-link
                    v-else-if="leadingIconComponent"
                    to="/dashboard">
                    <component
                        :is="leadingIconComponent"
                        class="h-6 w-6 text-gray-400" />
                </router-link>

                <ol class="flex items-center gap-1 md:gap-2">
                    <li
                        v-for="(item, index) in breadcrumbs"
                        :key="index"
                        class="flex items-center gap-2">
                        <RightChevronIcon v-if="index !== 0 || hasLeadingIcon" />

                        <router-link
                            v-if="index !== breadcrumbs.length - 1 && item.clickable && item.path"
                            :to="item.path"
                            class="dark:hover:text-text-primary hover:text-gray-800">
                            {{ item.label }}
                        </router-link>

                        <button
                            v-else-if="index !== breadcrumbs.length - 1 && item.clickable"
                            type="button"
                            class="dark:hover:text-text-primary cursor-pointer truncate transition-colors hover:text-gray-800"
                            @click="emit('select', { item: item.raw, index })">
                            {{ item.label }}
                        </button>

                        <span
                            v-else
                            :class="
                                index === breadcrumbs.length - 1
                                    ? 'dark:text-text-primary font-medium text-gray-900'
                                    : 'dark:text-text-tertiary text-gray-500'
                            ">
                            {{ item.label }}
                        </span>
                    </li>
                </ol>
                <span
                    v-if="status?.text"
                    class="ml-2 rounded-full px-2 py-1 text-xs font-semibold md:ml-4 md:px-4 md:text-sm"
                    :class="badgeStyles ? '' : statusClasses"
                    :style="badgeStyles">
                    {{ status.text }}
                </span>
            </nav>
        </div>
        <!-- Optional right-aligned actions (e.g. Back / Save) provided by the host. -->
        <div
            v-if="$slots.default"
            class="flex shrink-0 items-center gap-2">
            <slot />
        </div>
    </div>
</template>
