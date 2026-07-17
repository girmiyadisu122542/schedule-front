<script setup lang="ts">
import UserIcon from '@/assets/icons/UserIcon.vue';
import CopyIcon from '@/assets/icons/CopyIcon.vue';
import CrownIcon from '@/assets/icons/CrownIcon.vue';
import ExitLogOut from '@/assets/icons/ExitLogOut.vue';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon.vue';

import { useUserMenu } from '@/composables/useUserMenu';

const props = defineProps<{
    onlyAvatar?: boolean;
    forceExpanded?: boolean;
    nameColor?: string;
}>();

const {
    showCollapsed,
    upgradeRoute,
    dropdownOpen,
    dropdownRef,
    panelClass,
    isFloating,
    navLinks,
    labels,
    user,
    signOut,
    copyEmail,
    closeDropdown,
    toggleDropdown,
    handleMenuClick,
    getUserMenuPosition
} = useUserMenu(props);
</script>

<template>
    <div
        ref="dropdownRef"
        :class="['user-menu-container relative w-full', showCollapsed ? 'flex justify-center' : 'w-full']">
        <div
            @click.prevent="toggleDropdown"
            :class="[
                'user-menu-item flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-1 text-sm font-medium transition-colors',
                nameColor ? nameColor : 'text-text-tertiary',
                {
                    'dark:bg-gray-800': dropdownOpen,
                    'justify-center': showCollapsed
                }
            ]">
            <div
                v-if="showCollapsed"
                class="relative flex h-10 w-10 shrink-0 items-center justify-center">
                <div class="bg-primary-500 absolute h-10 w-10 overflow-hidden rounded-full p-2">
                    <UserIcon
                        v-if="!user.photo"
                        class="h-full w-full text-white" />
                    <img
                        v-else
                        :src="user.photo"
                        :alt="user.fullName"
                        class="h-full w-full rounded-full object-cover" />
                </div>
                <span
                    class="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
            </div>

            <!-- Expanded State - Show full user info -->
            <div
                v-else
                class="flex w-full flex-row items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="relative h-10 w-10 shrink-0">
                        <div class="bg-primary-500 absolute h-10 w-10 overflow-hidden rounded-full">
                            <img
                                v-if="user.photo"
                                :src="user.photo"
                                :alt="user.fullName"
                                class="h-full w-full rounded-full object-cover" />
                            <UserIcon
                                v-else
                                class="h-full w-full p-2 text-white" />
                        </div>
                        <span
                            class="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                    </div>
                    <div class="min-w-0 text-left">
                        <!-- <span
                            :class="[
                                'block truncate text-sm font-semibold capitalize dark:text-gray-100',
                                nameColor && !dropdownOpen ? nameColor : 'text-schedule-text-tertiary'
                            ]">
                            {{ user.fullName }}
                        </span> -->
                    </div>
                </div>
                <!-- <ArrowDownIcon
                    class="ml-2 h-4 w-4 shrink-0 transition-transform duration-200"
                    :class="dropdownOpen ? 'rotate-180' : ''" /> -->
            </div>
        </div>

        <!-- Dropdown panel (inline when in place, teleported to body when the
             collapsed rail would clip it). One markup block drives both. -->
        <teleport
            to="body"
            :disabled="!isFloating">
            <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 translate-y-1 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 translate-y-1 scale-95">
                <div
                    v-if="dropdownOpen"
                    :class="[
                        panelClass,
                        'border-border-default bg-surface-card overflow-y-auto rounded-2xl border p-2 shadow-xl'
                    ]"
                    :style="
                        isFloating
                            ? { left: `${getUserMenuPosition().x}px`, top: `${getUserMenuPosition().y}px` }
                            : undefined
                    ">
                    <!-- Header: name + email with a copy affordance -->
                    <div class="px-2 pt-1 pb-2">
                        <p class="text-text-primary truncate text-base font-bold capitalize">
                            {{ user.fullName }}
                        </p>
                        <div class="mt-0.5 flex items-center gap-1">
                            <span class="text-text-tertiary min-w-0 truncate text-sm">
                                {{ user.email }}
                            </span>
                            <button
                                type="button"
                                :title="labels.copyEmail"
                                @click.stop="copyEmail"
                                class="text-text-muted hover:bg-surface-hover hover:text-text-secondary shrink-0 rounded-md p-1 transition-colors">
                                <CopyIcon class="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div class="border-border-subtle my-2 border-t"></div>

                    <!-- Upgrade subscription -->

                    <div class="border-border-subtle my-2 border-t"></div>

                    <!-- Navigation links -->
                    <router-link
                        v-for="link in navLinks"
                        :key="link.key"
                        :to="link.to"
                        @click="handleMenuClick(closeDropdown)"
                        class="text-text-secondary hover:bg-surface-hover flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors">
                        <component
                            :is="link.icon"
                            class="h-5 w-5 shrink-0" />
                        <span>{{ link.label }}</span>
                    </router-link>

                    <div class="border-border-subtle my-2 border-t"></div>

                    <!-- Logout -->
                    <button
                        type="button"
                        @click="handleMenuClick(signOut)"
                        class="text-text-secondary hover:bg-schedule-error-subtle hover:text-schedule-error-default dark:hover:bg-schedule-error-default/15 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors">
                        <ExitLogOut class="h-5 w-5 shrink-0" />
                        <span>{{ labels.logout }}</span>
                    </button>
                </div>
            </transition>
        </teleport>
    </div>
</template>
