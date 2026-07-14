<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useGetModules } from '@/composables/useModules';
import InputText from '@/components/common/InputText.vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useModuleIconRegistry } from '@/composables/useModuleIconRegistry';

import CubeIcon from '@/assets/icons/CubeIcon.vue';
import SearchIcon from '@/assets/icons/Search.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon.vue';
import DoubleChevronIcon from '@/assets/icons/DoubleChevronIcon.vue';

const languageStore = useLanguageStore();
const allowedRoutesStore = useAllowedRoutesStore();
const currentLang = computed(() => languageStore.currentLanguage);
const {
    computedMenuData,
    activeSubmenu,
    dropdownRef,
    searchQuery,
    isOpen,
    onSearch,
    goBackToModules,
    isMenuItemActive,
    closeModuleSubmenu,
    closeModuleDropdown,
    toggleModuleDropdown,
    handleModuleMenuClick,
    handleClickModuleOutside,
    handleModuleSubmenuClick
} = useGetModules();

const selectedModule = computed(() => allowedRoutesStore.selectedModule);

onMounted(() => {
    document.addEventListener('mousedown', handleClickModuleOutside);
});

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickModuleOutside);
});

const exploreMore = () => {
    closeModuleDropdown();
    goBackToModules();
};

/** Brand-blue fallback when a module has no backend color. */
const BRAND_FALLBACK = '#0b529c';

/** Module brand color (backend-driven). */
const moduleColor = (item: any): string => item?.module?.color || item?.color || BRAND_FALLBACK;

/** Parse a hex color to HSL; null when the value is not a valid hex. */
const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    let value = (hex || '').replace('#', '').trim();
    if (value.length === 3) {
        value = value
            .split('')
            .map((c) => c + c)
            .join('');
    }
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (max + min) / 2;
    let hue = 0;
    let sat = 0;
    if (max !== min) {
        const delta = max - min;
        sat = lum > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        else if (max === g) hue = ((b - r) / delta + 2) / 6;
        else hue = ((r - g) / delta + 4) / 6;
    }
    return { h: Math.round(hue * 360), s: Math.round(sat * 100), l: Math.round(lum * 100) };
};

/**
 * Normalized module chip derived from the (often pale) backend color: the icon is
 * forced to a mid lightness so it reads on BOTH light and dark surfaces, the
 * background is the same hue at low alpha (blends with whatever is behind it), and a
 * faint inset ring crisps the edge. Chromatic colors get a saturation floor;
 * near-grays stay neutral. Hue is always preserved, so each module keeps its identity.
 */
const chipStyle = (color: string) => {
    const hsl = hexToHsl(color);
    if (!hsl) return { backgroundColor: 'rgba(11,82,156,0.16)', color: '#0b529c' };
    const sat = hsl.s < 12 ? hsl.s : Math.min(Math.max(hsl.s, 58), 85);
    return {
        backgroundColor: `hsla(${hsl.h}, ${sat}%, 52%, 0.18)`,
        color: `hsl(${hsl.h}, ${sat}%, 46%)`,
        boxShadow: `inset 0 0 0 1px hsla(${hsl.h}, ${sat}%, 50%, 0.16)`
    };
};

/** Resolve a module icon to an SVG component; always returns a visible glyph (CubeIcon fallback). */
const moduleIcon = (item: any) => {
    const key = item?.module?.icon ?? item?.icon;
    return (key && useModuleIconRegistry[key]) || CubeIcon;
};

/** Localized module description (jsonb from backend). */
const moduleDescription = (item: any): string => {
    const desc = item?.module?.description ?? item?.description;
    if (!desc) return '';
    return typeof desc === 'object' ? desc[currentLang.value] || desc['en'] || '' : desc;
};

const isSelectedModule = (item: any): boolean => {
    const code = item?.module?.code ?? item?.code;
    return !!code && selectedModule.value?.code === code;
};

const selectedModuleIcon = computed(
    () => (selectedModule.value?.icon && useModuleIconRegistry[selectedModule.value.icon]) || CubeIcon
);
</script>

<template>
    <div
        ref="dropdownRef"
        class="relative">
        <!-- Selected module trigger -->
        <button
            @click="toggleModuleDropdown"
            class="bg-surface-muted border-border-subtle text-text-primary hover:bg-surface-hover flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors"
            :class="{ 'bg-surface-hover': isOpen }">
            <div class="flex min-w-0 items-center gap-3">
                <span
                    v-if="selectedModule"
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    :style="chipStyle(moduleColor(selectedModule))">
                    <component
                        :is="selectedModuleIcon"
                        class="h-5 w-5" />
                </span>
                <span
                    v-else
                    class="bg-schedule-warning-subtle text-schedule-icon-warning dark:bg-schedule-warning-500/15 dark:text-schedule-warning-300 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <CubeIcon class="h-5 w-5" />
                </span>
                <div class="flex min-w-0 flex-col items-start gap-0.5">
                    <span class="text-text-primary truncate text-[15px] leading-tight font-bold">
                        {{
                            selectedModule
                                ? typeof selectedModule.name === 'object'
                                    ? selectedModule.name[currentLang] || selectedModule.name['en']
                                    : selectedModule.name
                                : 'Modules'
                        }}
                    </span>
                    <span class="text-text-tertiary truncate text-xs">{{ $lang.mainMenu || 'Schedule ERP' }}</span>
                </div>
            </div>
            <DoubleChevronIcon class="text-text-tertiary h-5 w-5 shrink-0" />
        </button>

        <!-- Dropdown Menu -->
        <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1">
            <div
                v-if="isOpen"
                class="bg-surface-card border-border-default absolute top-full left-0 z-50 mt-2 flex max-h-[70vh] w-full flex-col overflow-hidden rounded-2xl border shadow-2xl">
                <!-- Search -->
                <div class="border-border-default border-b p-3">
                    <InputText
                        v-model="searchQuery"
                        @update:modelValue="onSearch"
                        :placeholder="$lang.searchModules || $lang.search || 'Search modules...'"
                        class="w-full"
                        size="small"
                        :clearable="true"
                        :icon="SearchIcon"
                        icon-position="left" />
                </div>

                <div class="flex-1 overflow-y-auto px-2 py-2">
                    <!-- Empty state -->
                    <div
                        v-if="!computedMenuData.length"
                        class="flex flex-col items-center gap-2 px-4 py-10 text-center">
                        <span
                            class="bg-surface-subtle text-text-tertiary flex h-11 w-11 items-center justify-center rounded-xl">
                            <CubeIcon class="h-5 w-5" />
                        </span>
                        <span class="text-text-tertiary text-sm">{{ $lang.noModulesFound || 'No modules found' }}</span>
                    </div>

                    <div
                        v-for="(menuGroup, groupIndex) in computedMenuData"
                        :key="groupIndex"
                        class="mb-1">
                        <h3
                            v-if="menuGroup.title"
                            class="text-text-muted px-3 pt-3 pb-1.5 text-[11px] leading-4 font-semibold tracking-wider uppercase">
                            {{ menuGroup.title }}
                        </h3>
                        <button
                            v-for="(item, itemIndex) in menuGroup.items"
                            :key="`${groupIndex}-${itemIndex}`"
                            @click="handleModuleMenuClick(item, $event)"
                            class="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors"
                            :class="isSelectedModule(item) ? 'bg-surface-subtle' : 'hover:bg-surface-hover'">
                            <span
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                                :style="chipStyle(moduleColor(item))">
                                <component
                                    :is="moduleIcon(item)"
                                    class="h-5 w-5" />
                            </span>
                            <div class="flex min-w-0 flex-1 flex-col">
                                <span class="text-text-primary truncate text-sm font-semibold">{{ item.name }}</span>
                                <span
                                    v-if="moduleDescription(item)"
                                    class="text-text-tertiary truncate text-xs">
                                    {{ moduleDescription(item) }}
                                </span>
                            </div>
                            <CheckIcon
                                v-if="isSelectedModule(item)"
                                class="text-schedule-icon-brand h-4 w-4 shrink-0" />
                            <ArrowDownIcon
                                v-else-if="item.subItems && item.subItems.length > 0"
                                :isActive="isMenuItemActive(item.name)"
                                class="text-text-tertiary h-4 w-4 shrink-0 -rotate-90" />
                        </button>
                    </div>
                </div>

                <div
                    v-if="!allowedRoutesStore.isSuperAdmin"
                    class="border-border-default border-t p-2">
                    <button
                        @click="exploreMore"
                        class="text-schedule-icon-brand hover:bg-surface-hover flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors">
                        <CubeIcon class="h-8 w-8" />
                        {{ $lang.exploreMore || 'Explore more' }}
                    </button>
                </div>
            </div>
        </transition>

        <!-- Submenu Overlay -->
        <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div
                v-if="activeSubmenu"
                class="fixed inset-0 z-40"
                @click="closeModuleSubmenu"></div>
        </transition>

        <!-- Submenu -->
        <teleport to="body">
            <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 translate-x-2"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-2">
                <div
                    v-if="activeSubmenu"
                    class="bg-surface-card border-border-default fixed z-50 w-64 rounded-2xl border py-2 shadow-2xl"
                    :style="{
                        left: `${activeSubmenu.x}px`,
                        top: `${activeSubmenu.y}px`,
                        maxHeight: 'calc(100vh - 40px)',
                        overflowY: 'auto'
                    }">
                    <div class="flex flex-col px-2">
                        <button
                            v-for="(item, itemIndex) in activeSubmenu.items"
                            :key="itemIndex"
                            @click="handleModuleSubmenuClick(item, $event)"
                            class="group hover:bg-surface-hover flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors">
                            <span
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                :style="chipStyle(moduleColor(item))">
                                <component
                                    :is="moduleIcon(item)"
                                    class="h-5 w-5" />
                            </span>
                            <div class="flex min-w-0 flex-1 flex-col">
                                <span class="text-text-primary truncate text-sm font-semibold">{{ item.name }}</span>
                                <span
                                    v-if="moduleDescription(item)"
                                    class="text-text-tertiary truncate text-xs">
                                    {{ moduleDescription(item) }}
                                </span>
                            </div>
                            <ArrowDownIcon
                                v-if="item.subItems && item.subItems.length > 0"
                                :isActive="isMenuItemActive(item.name)"
                                class="text-text-tertiary h-4 w-4 shrink-0 -rotate-90" />
                        </button>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
</template>
