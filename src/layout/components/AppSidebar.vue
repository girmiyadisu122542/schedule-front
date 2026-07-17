<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import Close from '@/assets/icons/Close.vue';
import Setting from '@/assets/icons/Setting.vue';
import InfoIcon from '@/assets/icons/InfoIcon.vue';
import SidebarOpen from '@/assets/icons/SidebarOpen.vue';
import { useSidebar } from '@/composables/useSidebar';

import { useGetModules } from '@/composables/useModules';
import MainButton from '@/components/common/MainButton.vue';
import SidebarTopMenu from '@/layout/components/SidebarTopMenu.vue';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import SidebarRecursiveItem from '@/layout/components/SidebarRecursiveItem.vue';

const route = useRoute();
const allowedRoutesStore = useAllowedRoutesStore();
const menuGroups = computed(() =>
    [...allowedRoutesStore.filteredSidebarMenu].sort(
        (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
    )
);
const { isExpanded, isMobileOpen, openMenuPath, toggleMobileSidebar, handleToggleSidebar } = useSidebar();
const isCollapsed = computed(() => !isExpanded.value && !isMobileOpen.value);

const { modules, fetchModules } = useGetModules();

const moduleCode = ref<string | null>(null);

onMounted(() => {
    fetchModules();
});

const findModulesForPath = (path: string): string[] => {
    const findInItems = (items: any[]): boolean => {
        for (const item of items) {
            if (item.path && (item.path === path || path.startsWith(item.path + '/'))) {
                return true;
            }
            if (item.subItems) {
                const found = findInItems(item.subItems);
                if (found) return true;
            }
        }
        return false;
    };

    const codes = new Set<string>();
    for (const group of allowedRoutesStore.sidebarMenu) {
        if (!findInItems(group.items)) continue;
        const groupModules = group.modules ?? (group.module ? [group.module] : []);
        groupModules.forEach((code) => codes.add(code));
    }

    return [...codes];
};

/**
 * Keep the active sidebar item visible: after navigating (and after the parent
 * group expands), scroll the deepest active item into view inside the scrollable
 * nav. Retries until the menu has rendered the active element.
 */
const scrollActiveIntoView = () => {
    nextTick(() => {
        const tryScroll = (attempt: number) => {
            const active = document.querySelector('aside [data-active="true"]');
            if (active) {
                active.scrollIntoView({ block: 'center', behavior: 'smooth' });
            } else if (attempt < 6) {
                window.setTimeout(() => tryScroll(attempt + 1), 200);
            }
        };
        window.setTimeout(() => tryScroll(0), 250);
    });
};

const findActivePath = (items: any[], currentPath: string[] = []): string[] | null => {
    for (const item of items) {
        if (item.path && (item.path === route.path || route.path.startsWith(item.path + '/'))) {
            return [...currentPath, item.name];
        }
        if (item.subItems) {
            const found = findActivePath(item.subItems, [...currentPath, item.name]);
            if (found) return found;
        }
    }
    return null;
};

const openActiveMenuPath = () => {
    const activePath = findActivePath(menuGroups.value.flatMap((group) => group.items));
    if (activePath) {
        openMenuPath(activePath.slice(0, -1));
    }
    scrollActiveIntoView();
};

let isInitialRouteEval = true;

watch(
    route,
    (newRoute) => {
        const currentModule = allowedRoutesStore.selectedModule;
        const owningModuleCodes = findModulesForPath(newRoute.path);
        const currentModuleOwnsPath = !!currentModule && owningModuleCodes.includes(currentModule.code);

        const keepPersistedModule = isInitialRouteEval && !!currentModule;
        isInitialRouteEval = false;

        if (!keepPersistedModule && !currentModuleOwnsPath && owningModuleCodes.length) {
            const entitledCodes = allowedRoutesStore.entitledModuleCodes;
            const targetModuleCode = owningModuleCodes.find(
                (code) => allowedRoutesStore.isSuperAdmin || entitledCodes.includes(code)
            );
            if (targetModuleCode) {
                moduleCode.value = targetModuleCode;
            }
        }

        openActiveMenuPath();
    },
    { immediate: true }
);

watch(menuGroups, () => openActiveMenuPath());

watch(
    () => [modules.value, allowedRoutesStore.entitledModuleCodes, moduleCode.value] as const,
    ([newModules]) => {
        const entitledCodes = allowedRoutesStore.entitledModuleCodes;
        const isEntitled = (code?: string) =>
            !!code && (allowedRoutesStore.isSuperAdmin || entitledCodes.includes(code));

        // 1. A module derived from the current route (deep link) wins — as long as
        //    the tenant is entitled to it.
        const routeModule = newModules.find((module: any) => module.code === moduleCode.value);
        if (routeModule && isEntitled(routeModule.code)) {
            allowedRoutesStore.setSelectedModule(routeModule);
            return;
        }

        // 2. Fall back to the first entitled module when nothing is selected OR the
        //    persisted selection is no longer entitled (e.g. the module was revoked
        //    after it had been selected — don't keep it as selected on refresh).
        const selected = allowedRoutesStore.selectedModule;
        if (!isEntitled(selected?.code) && newModules.length) {
            const firstEntitled = newModules.find((module: any) => isEntitled(module.code));
            allowedRoutesStore.setSelectedModule(firstEntitled ?? null);
        }
    },
    { immediate: true }
);
</script>

<template>
    <!-- Mobile overlay -->
    <div
        v-if="isMobileOpen"
        class="scroll fixed inset-0 z-500 bg-black/70 transition-all duration-300 lg:hidden"
        @click="isMobileOpen = false"></div>

    <!-- Mobile Sidebar Overlay -->
    <transition name="fade-overlay">
        <div
            v-if="isMobileOpen"
            class="fixed inset-0 z-900 bg-black/50 lg:hidden"
            @click="toggleMobileSidebar"></div>
    </transition>

    <!-- Sidebar -->
    <transition name="slide-sidebar">
        <aside
            :class="[
                'bg-surface-elevated border-border-default fixed top-0 left-0 z-1000 flex h-screen flex-col border-r px-0 pb-0 transition-[width,transform] duration-300 ease-in-out',
                {
                    'lg:w-72': isExpanded || isMobileOpen,
                    'lg:w-20': !isExpanded && !isMobileOpen,
                    'w-72 translate-x-0': isMobileOpen,
                    '-translate-x-full': !isMobileOpen,
                    'lg:translate-x-0': true
                }
            ]">
            <!-- Top Menu (Fixed) — height-matched to the header so the divider lines up -->
            <!-- <div
                v-if="isExpanded || isMobileOpen"
                class="flex h-16 items-end px-2">
                <SidebarTopMenu class="w-full" />
            </div> -->

            <div
                class="flex items-center gap-2 p-4"
                :class="isCollapsed ? 'lg:justify-center' : 'justify-between'">
                <div class="flex min-w-0 items-center gap-2.5">
                    <img
                        src="@/assets/logo.png"
                        class="h-10 w-10 shrink-0 rounded-full object-cover" />
                    <div
                        v-if="isExpanded || isMobileOpen"
                        class="flex min-w-0 flex-col leading-tight">
                        <span class="text-schedule-icon-brand truncate text-lg font-bold">Wollo University</span>
                        <span class="text-schedule-text-primary truncate text-sm font-bold">Scheduling System</span>
                    </div>
                </div>
            </div>

            <!-- Close button (mobile only) -->
            <div class="mx-2 flex items-center justify-end lg:hidden">
                <MainButton
                    v-if="isMobileOpen"
                    :icon="Close"
                    type="button"
                    outlined
                    outline-severity="none"
                    @click="isMobileOpen = false" />
            </div>

            <!-- Navigation (Scrollable) -->
            <div class="no-scrollbar mx-2 flex flex-1 flex-col overflow-y-auto pt-4 duration-300 ease-linear">
                <nav class="mb-6">
                    <!-- Loading -->
                    <div
                        v-if="allowedRoutesStore.isLoading && !allowedRoutesStore.isInitialized"
                        class="flex h-full items-center justify-center">
                        <span class="loader"></span>
                    </div>

                    <!-- Menu -->
                    <div
                        v-else
                        class="flex flex-col gap-5">
                        <div
                            v-for="(menuGroup, groupIndex) in menuGroups"
                            :key="groupIndex">
                            <h2
                                v-if="isExpanded || isMobileOpen"
                                :class="[
                                    'text-text-tertiary mb-2 flex px-3 text-[11px] leading-5 font-semibold tracking-wider uppercase',
                                    !isExpanded ? 'lg:justify-center' : 'justify-start'
                                ]">
                                {{ menuGroup.title }}
                            </h2>

                            <!-- Use SidebarRecursiveItem for all items -->
                            <ul class="flex flex-col gap-1 overflow-x-visible overflow-y-auto">
                                <SidebarRecursiveItem
                                    v-for="(item, index) in menuGroup.items"
                                    :key="`${groupIndex}-${index}`"
                                    :item="item"
                                    :depth="1"
                                    :uniqueKey="`${groupIndex}-${index}`"
                                    :isExpanded="isExpanded"
                                    :isMobileOpen="isMobileOpen" />
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>

            <div class="border-border-subtle mx-2 mb-4 space-y-1 border-t pt-3">
                <router-link
                    to="/settings"
                    active-class="bg-schedule-surface-subtle text-schedule-text-primary shadow-sm dark:bg-schedule-brand-blue-subtle dark:text-white/90 dark:font-bold dark:shadow-none"
                    class="text-schedule-text-secondary hover:bg-schedule-surface-subtle hover:text-schedule-text-primary dark:text-text-tertiary dark:hover:bg-schedule-brand-blue/10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors dark:hover:text-white/80"
                    :class="isCollapsed ? 'lg:justify-center' : ''">
                    <Setting class="h-5 w-5 shrink-0" />
                    <span v-if="isExpanded || isMobileOpen">{{ $lang.settings || 'Settings' }}</span>
                </router-link>
                <router-link
                    to="/help"
                    active-class="bg-schedule-surface-subtle text-schedule-text-primary shadow-sm dark:bg-schedule-brand-blue-subtle dark:text-white/90 dark:font-bold dark:shadow-none"
                    class="text-schedule-text-secondary hover:bg-schedule-surface-subtle hover:text-schedule-text-primary dark:text-text-tertiary dark:hover:bg-schedule-brand-blue/10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors dark:hover:text-white/80"
                    :class="isCollapsed ? 'lg:justify-center' : ''">
                    <InfoIcon class="h-5 w-5 shrink-0" />
                    <span v-if="isExpanded || isMobileOpen">{{ $lang.help || 'Help' }}</span>
                </router-link>
            </div>
        </aside>
    </transition>
</template>
