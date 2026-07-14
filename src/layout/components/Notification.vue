<script setup lang="ts">
import BellIcon from '@/assets/icons/BellIcon.vue';
import { useUserMenu } from '@/composables/useUserMenu';

const { dropdownOpen, dropdownRef, toggleDropdown } = useUserMenu();
</script>

<template>
    <div
        class="relative"
        ref="dropdownRef">
        <div
            @click.prevent="toggleDropdown"
            class="hover:bg-surface-hover hover:text-text-primary relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors">
            <BellIcon class="h-5 w-5 self-center" />
            <div
                class="hover:bg-main-500/80 absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 p-0 text-xs font-semibold text-white transition-colors">
                3
            </div>
        </div>
        <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-1 scale-95">
            <div
                v-if="dropdownOpen"
                class="text-schedule-text-black absolute left-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg md:-right-12 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <div class="border-border border-b border-gray-100 p-3 dark:border-gray-700">
                    <h3 class="font-semibold">{{ $lang.notifications || 'Notifications' }}</h3>
                </div>

                <!-- As this is a sample data, translation is not necessary -->
                <div class="max-h-64 overflow-y-auto">
                    <div
                        class="hover:bg-main-50 dark:hover:bg-main-500/20 flex flex-col items-start gap-1 rounded-sm p-3 text-sm transition-colors">
                        <span class="text-sm font-bold">New Application Received</span>
                        <span class="text-opacity/50 text-xs">John Doe submitted admission for Grade 10</span>
                        <span class="text-opacity/50 text-xs">2 min ago</span>
                    </div>
                    <div
                        class="hover:bg-main-50 dark:hover:bg-main-500/20 flex flex-col items-start gap-1 rounded-sm p-3 text-sm transition-colors">
                        <span class="text-sm font-medium">Fee Payment Confirmed</span>
                        <span class="text-muted-foreground text-xs">Payment received from Sarah Smith</span>
                        <span class="text-muted-foreground text-xs">1 hour ago</span>
                    </div>
                    <div
                        class="hover:bg-main-50 dark:hover:bg-main-500/20 flex flex-col items-start gap-1 rounded-sm p-3 text-sm transition-colors">
                        <span class="text-sm font-medium">Application Approved</span>
                        <span class="text-muted-foreground text-xs">Mike Johnson's application approved</span>
                        <span class="text-muted-foreground text-xs">3 hours ago</span>
                    </div>
                </div>

                <div class="border-border border-t border-gray-100 p-2 dark:border-gray-700">
                    <button
                        class="hover:bg-main-500 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-bold whitespace-nowrap transition-colors hover:text-white">
                        {{ $lang.viewAllNotifications || 'View All Notifications' }}
                    </button>
                </div>
            </div>
        </transition>
    </div>
</template>
