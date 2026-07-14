<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import ArrowDownIcon from '@/assets/icons/ArrowDownIcon.vue';
import SidebarTooltip from '@/components/common/SidebarTooltip.vue';

import { useSidebar } from '@/composables/useSidebar';
import { useAuthStore } from '@/modules/user/store/authStore';
import { useSidebarIconRegistry } from '@/composables/useSidebarIconRegistry';

const props = defineProps({
    isExpanded: Boolean,
    isMobileOpen: Boolean,
    isLast: Boolean,
    depth: { type: Number, default: 1 },
    item: { type: Object, required: true },
    uniqueKey: { type: String, required: true },
    parentNames: { type: Array, default: () => [] }
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { openMenus, closeAllMenus, collapsedSubmenuItem, openMenuExclusive } = useSidebar();
const isCollapsed = computed(() => !props.isExpanded && !props.isMobileOpen);
const isSubmenuOpen = computed(() => collapsedSubmenuItem.value === props.item.name);
const svgIcon = computed(() => {
    return props.item?.icon ? useSidebarIconRegistry[props.item?.icon] : null;
});

const hasChildren = computed(() => {
    return Array.isArray(props.item.subItems) && props.item.subItems.length > 0;
});

const sortedSubItems = computed(() => {
    if (!hasChildren.value) return [];
    return [...props.item.subItems].sort(
        (a: any, b: any) => (a?.order ?? Number.MAX_SAFE_INTEGER) - (b?.order ?? Number.MAX_SAFE_INTEGER)
    );
});

const matchesPath = (item: any): boolean => {
    if (!item.path || typeof item.path !== 'string') return false;
    // Prefix match so detail pages (/x/123) keep their parent list item (/x) highlighted.
    return route.path === item.path || route.path.startsWith(item.path + '/');
};

const isAnyActive = computed(() => {
    const checkActive = (item: any): boolean => {
        if (matchesPath(item)) return true;
        if (item.subItems) return item.subItems.some(checkActive);
        return false;
    };
    return checkActive(props.item);
});

/** This very row points at the current route (leaf OR a group with its own page). */
const isSelfActive = computed(() => matchesPath(props.item));

/** True only for the deepest matching (leaf) item -- the scroll-into-view target. */
const isActiveLeaf = computed(() => !hasChildren.value && matchesPath(props.item));

/** Tree connector tone: stronger when this branch leads to the active page. */
const connectorClass = computed(() => (isAnyActive.value ? 'border-border-strong' : 'border-border-default'));

const isAnySubActive = computed(() => {
    if (!hasChildren.value) return false;

    const checkActive = (item: any): boolean => {
        if (matchesPath(item)) return true;
        if (item.subItems) return item.subItems.some(checkActive);
        return false;
    };

    return props.item.subItems.some(checkActive);
});

const isOpen = computed({
    get: () => openMenus.value[props.item.name] || false,
    set: (value: boolean) => {
        if (value) {
            openMenus.value[props.item.name] = true;
        } else {
            delete openMenus.value[props.item.name];
        }
    }
});

const shouldShowChildren = computed(() => {
    if (props.isExpanded || props.isMobileOpen) {
        return isOpen.value;
    }
    return false;
});

const openActiveHierarchy = (item: any, parents: string[] = []) => {
    if (item.path && route.path === item.path) {
        closeAllMenus();

        parents.forEach((parentName) => {
            openMenus.value[parentName] = true;
        });
        return true;
    }

    if (item.subItems) {
        for (const child of item.subItems) {
            const found = openActiveHierarchy(child, [...parents, item.name]);
            if (found) return true;
        }
    }

    return false;
};

const findParentChain = (item: any, targetPath: string, parents: string[] = []): string[] | null => {
    if (item.path && typeof item.path === 'string') {
        const hasKids = Array.isArray(item.subItems) && item.subItems.length > 0;
        const matched = hasKids
            ? targetPath === item.path || targetPath.startsWith(item.path + '/')
            : targetPath === item.path;
        if (matched) return parents;
    }

    if (item.subItems) {
        for (const child of item.subItems) {
            const result = findParentChain(child, targetPath, [...parents, item.name]);
            if (result) return result;
        }
    }

    return null;
};

const goTo = (event?: MouseEvent) => {
    if (isCollapsed.value && hasChildren.value && event) {
        event.stopPropagation();

        if (collapsedSubmenuItem.value === props.item.name) {
            collapsedSubmenuItem.value = null;
        } else {
            collapsedSubmenuItem.value = props.item.name;
        }
        return;
    }

    // Pure group (no page of its own): expand/collapse in place so a second
    // click on the parent actually closes it (closeAllMenus below would reset it).
    if (!props.item.path && hasChildren.value) {
        if (isOpen.value) {
            isOpen.value = false;
        } else {
            openMenuExclusive(props.item.name, props.parentNames as string[]);
        }
        return;
    }

    if (
        props.item.path &&
        typeof props.item.path === 'string' &&
        (route.path === props.item.path || route.path.startsWith(props.item.path + '/'))
    ) {
        if (route.path !== props.item.path) {
            router.push(props.item.path);
        } else {
            return;
        }
    }

    closeAllMenus();

    if (props.item.path) {
        let targetPath: any = props.item.path;

        if (
            typeof props.item.path === 'string' &&
            props.item.path.includes('complete-profile') &&
            authStore.user?.username
        ) {
            router.push({
                name: 'CompleteProfile',
                params: {
                    username: authStore.user.username
                }
            });
            return;
        }

        const parentChain = findParentChain(props.item, targetPath);

        if (parentChain && parentChain.length) {
            parentChain.forEach((name) => {
                openMenus.value[name] = true;
            });
        }

        router.push(targetPath);
    } else if (hasChildren.value) {
        isOpen.value = !isOpen.value;
    }
};

const closeSubmenu = () => {
    collapsedSubmenuItem.value = null;
    isOpen.value = false;
};

const handleSubmenuItemClick = (childItem: any, event: MouseEvent) => {
    if (childItem.subItems && childItem.subItems.length > 0) {
        event.stopPropagation();

        if (openMenus.value[childItem.name]) {
            delete openMenus.value[childItem.name];
        } else {
            openMenus.value[childItem.name] = true;
        }
    } else if (childItem.path) {
        router.push(childItem.path);

        if (isCollapsed.value) {
            closeSubmenu();
        }
    }
};

const getSubmenuPosition = () => {
    const element = document.querySelector(`[data-sidebar-item="${props.item.name}"]`);
    if (element) {
        const rect = element.getBoundingClientRect();
        const menuWidth = 280;
        const menuHeight = 400;

        let x = rect.right + 4;

        if (x + menuWidth > window.innerWidth - 20) {
            x = rect.left - menuWidth - 4;
        }

        let y = rect.top;
        if (y + menuHeight > window.innerHeight - 20) {
            y = window.innerHeight - menuHeight - 20;
        }
        if (y < 20) {
            y = 20;
        }

        return { x, y };
    }
    return { x: 0, y: 0 };
};
</script>

<template>
    <li
        class="relative"
        :class="depth > 1 ? 'pl-4' : ''"
        :data-sidebar-item="item.name"
        :data-active="isActiveLeaf ? 'true' : null">
        <template v-if="depth > 1">
            <!-- Last child: a rounded corner (corner) so the branch closes cleanly -->
            <span
                v-if="isLast"
                aria-hidden="true"
                class="absolute -top-2 left-0 h-7 w-4 rounded-bl-lg border-b border-l"
                :class="connectorClass"></span>
            <!-- Through child: trunk continues past the elbow (tee) -->
            <template v-else>
                <span
                    aria-hidden="true"
                    class="absolute -top-2 left-0 h-7 border-l"
                    :class="connectorClass"></span>
                <span
                    aria-hidden="true"
                    class="border-border-default absolute top-5 left-0 h-[calc(100%-1rem)] border-l"></span>
                <span
                    aria-hidden="true"
                    class="absolute top-5 left-0 w-4 border-t"
                    :class="connectorClass"></span>
            </template>
            <!-- Active node where the branch meets the current page -->
            <span
                v-if="isSelfActive"
                aria-hidden="true"
                class="bg-schedule-text-secondary dark:bg-schedule-icon-brand absolute top-5 left-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"></span>
        </template>
        <div
            class="sidebar-menu-item group relative flex cursor-pointer items-center justify-between gap-2 overflow-visible rounded-lg px-3 py-2.5 text-sm transition-colors"
            @click="goTo($event)"
            :class="[
                isSelfActive
                    ? 'bg-schedule-surface-subtle text-schedule-text-primary dark:bg-schedule-brand-blue-subtle mb-1 font-semibold shadow-sm dark:font-bold dark:text-white/90'
                    : isAnySubActive
                      ? 'bg-schedule-surface-subtle text-schedule-text-secondary dark:bg-schedule-brand-blue-subtle font-medium dark:text-white/70'
                      : 'text-schedule-text-secondary hover:bg-schedule-surface-subtle hover:text-schedule-text-primary dark:text-text-tertiary dark:hover:bg-schedule-brand-blue/10 hover:shadow-sm dark:hover:text-white/80',
                isCollapsed ? 'lg:mt-2 lg:justify-center' : ''
            ]">
            <SidebarTooltip
                v-if="isCollapsed"
                :text="item.name"
                direction="right">
                <div class="flex items-center gap-3">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center">
                        <component
                            v-if="svgIcon"
                            :is="svgIcon"
                            class="h-4.5 w-4.5" />
                        <i
                            v-else-if="item?.icon"
                            :class="item?.icon"
                            class="text-[17px] leading-none"></i>
                    </span>
                </div>
            </SidebarTooltip>

            <div
                v-else
                class="flex min-w-0 items-center gap-3">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center">
                    <component
                        v-if="svgIcon"
                        :is="svgIcon"
                        class="h-4.5 w-4.5" />
                    <i
                        v-else-if="item?.icon"
                        :class="item?.icon"
                        class="text-[17px] leading-none"></i>
                </span>
                <span
                    v-if="isExpanded || isMobileOpen"
                    class="truncate">
                    {{ item.name }}
                </span>
            </div>
            <ArrowDownIcon
                v-if="hasChildren && (isExpanded || isMobileOpen)"
                class="h-4 w-4 shrink-0 transition-transform duration-200"
                :class="!isOpen ? '-rotate-90' : ''" />
        </div>

        <transition name="fade">
            <ul
                v-if="shouldShowChildren && !isCollapsed"
                class="mt-2 ml-5.5 flex flex-col gap-1">
                <SidebarRecursiveItem
                    v-for="(child, idx) in sortedSubItems"
                    :key="`${uniqueKey}-${idx}`"
                    :item="child"
                    :depth="depth + 1"
                    :uniqueKey="`${uniqueKey}-${idx}`"
                    :isExpanded="isExpanded"
                    :isMobileOpen="isMobileOpen"
                    :isLast="idx === sortedSubItems.length - 1"
                    :parentNames="[...parentNames, item.name]" />
            </ul>
        </transition>

        <teleport to="body">
            <div
                v-if="isCollapsed && isSubmenuOpen && hasChildren && item.subItems"
                class="sidebar-submenu bg-surface-card border-border-default fixed z-50 w-56 rounded-xl border py-2 shadow-xl"
                :style="{
                    left: `${getSubmenuPosition().x}px`,
                    top: `${getSubmenuPosition().y}px`
                }">
                <div class="px-3 py-1.5">
                    <span class="text-text-muted text-[11px] font-semibold tracking-wide uppercase">
                        {{ item.name }}
                    </span>
                </div>
                <div class="flex flex-col px-1">
                    <button
                        v-for="(child, childIdx) in sortedSubItems"
                        :key="childIdx"
                        @click="handleSubmenuItemClick(child, $event)"
                        class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
                        :class="
                            matchesPath(child)
                                ? 'bg-schedule-surface-subtle text-schedule-text-primary dark:bg-schedule-brand-blue-subtle font-semibold dark:font-bold dark:text-white/90'
                                : 'text-schedule-text-secondary hover:bg-schedule-surface-subtle hover:text-schedule-text-primary dark:text-text-tertiary dark:hover:bg-schedule-brand-blue/10 dark:hover:text-white/80'
                        ">
                        <div class="flex min-w-0 items-center gap-2.5">
                            <component
                                v-if="child.icon && useSidebarIconRegistry[child.icon]"
                                :is="useSidebarIconRegistry[child.icon]"
                                class="h-4.5 w-4.5 shrink-0" />
                            <i
                                v-else-if="child.icon"
                                :class="[child.icon, 'w-5 shrink-0 text-center text-[17px] leading-none']"></i>
                            <span class="truncate">{{ child.name }}</span>
                        </div>
                        <ArrowDownIcon
                            v-if="child.subItems && child.subItems.length > 0"
                            class="h-4 w-4 shrink-0 -rotate-90 opacity-70" />
                    </button>
                </div>
            </div>
        </teleport>
    </li>
</template>
