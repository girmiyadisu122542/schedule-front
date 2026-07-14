<script setup lang="ts">
import { ref, computed } from 'vue';
import { markRaw } from 'vue';
import { useRouter } from 'vue-router';

import Footer from '@/modules/user/components/Footer.vue';
import TabList from '@/components/common/TabList.vue';

import Search from '@/assets/icons/Search.vue';
import UserIcon from '@/assets/icons/UserIcon.vue';

const router = useRouter();

const searchQuery = ref('');

const sections = ref([
    {
        name: 'Inventory Management',
        stats: '3/4',
        modules: [
            {
                id: 1,
                title: 'Inventory Management',
                description: 'Tracks stock levels, movements, and warehouse operations...',
                isSubscribed: true,
                isNew: true,
                icon: markRaw(UserIcon),
                color: 'bg-blue-50 text-schedule-text-brand-primary'
            },
            {
                id: 2,
                title: 'Finance Management',
                description: 'Tracks stock levels, movements, and warehouse operations...',
                isSubscribed: true,
                icon: markRaw(UserIcon),
                color: 'bg-emerald-50 text-emerald-600'
            },
            {
                id: 3,
                title: 'Inventory Management',
                description: 'Tracks stock levels, movements, and warehouse operations...',
                isSubscribed: false,
                icon: markRaw(UserIcon),
                color: 'bg-red-50 text-red-400'
            }
        ]
    },
    {
        name: 'Human Resources',
        stats: '2/3',
        modules: [
            {
                id: 4,
                title: 'Inventory Management',
                description: 'Tracks stock levels...',
                isSubscribed: true,
                icon: markRaw(UserIcon),

                color: 'bg-orange-50 text-orange-400'
            },
            {
                id: 5,
                title: 'Procurement',
                description: 'Tracks stock levels...',
                isSubscribed: false,
                icon: markRaw(UserIcon),
                color: 'bg-gray-100 text-gray-400'
            },
            {
                id: 6,
                title: 'Inventory Management',
                description: 'Tracks stock levels...',
                isSubscribed: true,
                icon: markRaw(UserIcon),
                color: 'bg-purple-50 text-purple-400'
            }
        ]
    }
]);

const filteredSections = computed(() => {
    return sections.value
        .map((section) => {
            const filteredModules = section.modules.filter((mod) => {
                const matchesSearch =
                    mod.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                    mod.description.toLowerCase().includes(searchQuery.value.toLowerCase());

                const matchesTab =
                    activeFilter.value === 'All' ||
                    (activeFilter.value === 'Subscribed' && mod.isSubscribed) ||
                    (activeFilter.value === 'Not Subscribed' && !mod.isSubscribed);

                return matchesSearch && matchesTab;
            });

            return {
                ...section,
                modules: filteredModules
            };
        })
        .filter((section) => section.modules.length > 0);
});

const handleModuleClick = (module: any) => {
    if (!module.isSubscribed) {
        return;
    }

    const slug = module.title.toLowerCase().replace(/ /g, '-');

    router.push({
        path: '/dashboard',
        query: { module: slug }
    });
};

const filterOptions = [
    { label: 'All', value: 'All' },
    { label: 'Subscribed', value: 'Subscribed' },
    { label: 'Not Subscribed', value: 'Not Subscribed' }
];

const activeFilter = ref('All');
</script>

<template>
    <div
        ref="app-content"
        class="dark:bg-schedule-dark bg-schedule-primary">
        <div class="dark:bg-schedule-dark min-h-screen">
            <div
                class="from-schedule-brand-blue-primary to-schedule-icon-info dark:bg-schedule-dark bg-linear-to-r px-4 pb-24 text-center text-white">
                <h1 class="text-schedule-text-inverse mb-4 text-4xl font-bold">{{ $lang.welcome }}!</h1>
                <p class="text-schedule-text-inverse mb-10 text-2xl">{{ $lang.selectModuleToGetStarted }}.</p>

                <div class="relative mx-auto max-w-3xl">
                    <Search class="text-schedule-generic-white absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search Everything..."
                        class="bg-schedule-icon-info text-schedule-generic-white w-full rounded-full py-3 pr-4 pl-12 shadow-sm outline-none" />
                </div>
            </div>

            <div class="px-6 pt-10 md:mx-24">
                <div class="mb-12 justify-between rounded-2xl md:flex md:items-center md:p-4">
                    <div class="flex gap-2 rounded-xl p-1">
                        <TabList
                            v-model="activeFilter"
                            :options="filterOptions" />
                    </div>
                    <div class="text-sm font-medium text-gray-500">
                        <span class="text-schedule-text-primary dark:text-schedule-tertiary">5 of 10</span>
                        {{ $lang.moduleSubscribed }}
                    </div>
                </div>

                <div
                    v-if="filteredSections.length > 0"
                    v-for="section in filteredSections"
                    :key="section.name"
                    class="mb-12">
                    <div class="mb-6 flex items-center gap-3">
                        <h2 class="text-schedule-text-primary dark:text-schedule-tertiary text-lg font-bold">
                            {{ section.name }}
                        </h2>
                        <span class="text-schedule-text-tertiary text-xs font-medium">{{ section.stats }}</span>
                    </div>

                    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <button
                            v-for="mod in section.modules"
                            :key="mod.id"
                            type="button"
                            :disabled="!mod.isSubscribed"
                            class="dark:bg-surface-card dark:border-border-default flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-shadow enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            @click="handleModuleClick(mod)">
                            <div class="flex w-full items-center justify-between">
                                <span
                                    class="flex h-11 w-11 items-center justify-center rounded-xl"
                                    :class="mod.color">
                                    <component
                                        :is="mod.icon"
                                        class="h-5 w-5" />
                                </span>
                                <span
                                    v-if="mod.isNew"
                                    class="bg-schedule-brand-blue-subtle text-schedule-brand-blue rounded-full px-2 py-0.5 text-xs font-medium">
                                    {{ $lang.new || 'New' }}
                                </span>
                            </div>
                            <h3 class="text-schedule-text-primary dark:text-schedule-tertiary text-base font-semibold">
                                {{ mod.title }}
                            </h3>
                            <p class="text-schedule-text-tertiary text-sm">{{ mod.description }}</p>
                            <span
                                class="mt-2 text-xs font-medium"
                                :class="
                                    mod.isSubscribed
                                        ? 'text-schedule-brand-blue'
                                        : 'text-schedule-text-tertiary'
                                ">
                                {{ mod.isSubscribed ? $lang.subscribed || 'Subscribed' : $lang.notSubscribed || 'Not Subscribed' }}
                            </span>
                        </button>
                    </div>
                </div>
                <div
                    v-else
                    class="flex flex-col items-center justify-center py-16">
                    <h1 class="text-schedule-text-primary dark:text-schedule-tertiary mb-2 text-2xl font-bold">
                        {{ $lang.noModulesFound }}
                    </h1>
                    <p class="text-schedule-text-tertiary max-w-md text-center">
                        {{ $lang.tryAdjustingYourFilter }}
                    </p>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>
