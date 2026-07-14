<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import ThemeToggle from '@/components/ThemeToggle.vue';

import UsersIcon from '@/assets/icons/UsersIcon.vue';
import InventoryIcon from '@/assets/icons/InventoryIcon.vue';
import RightArrowIcon from '@/assets/icons/RightArrowIcon.vue';
import AdvancedAnalyticsIcon from '@/assets/icons/AdvancedAnalyticsIcon.vue';

const isVisible = ref(false);

const kpis = [
    { label: 'Active Campuses', value: '42' },
    { label: 'Monthly Fee Collection', value: '$1.8M' },
    { label: 'Staff on Payroll', value: '3,260' }
];

const modules = ['Admissions', 'Finance', 'HR', 'Transport', 'Inventory', 'Exams'];

const featureCards = [
    {
        icon: InventoryIcon,
        title: 'Smart Inventory',
        description: 'Real-time tracking, batch control & multi-warehouse support.',
        color: 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300'
    },
    {
        icon: AdvancedAnalyticsIcon,
        title: 'Advanced Analytics',
        description: 'Dashboards, forecasting & insights.',
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
    },
    {
        icon: UsersIcon,
        title: 'Team Management',
        description: 'RBAC, performance tracking & collaboration.',
        color: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300'
    }
];

onMounted(() => {
    setTimeout(() => (isVisible.value = true), 100);
});
</script>

<template>
    <div class="min-h-screen bg-(--background-color) text-(--text-color)">
        <header class="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur dark:bg-[#0a0f1e]/85">
            <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
                <RouterLink
                    to="/"
                    class="flex items-center gap-2">
                    <div
                        class="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white">
                        HS
                    </div>
                    <span class="font-bold text-slate-900 dark:text-white">Schedule Systems</span>
                </RouterLink>

                <nav class="hidden flex-1 gap-6 text-sm font-medium text-slate-700 md:flex dark:text-slate-300">
                    <RouterLink
                        to="/features"
                        class="hover:text-primary-500">
                        Features
                    </RouterLink>
                    <RouterLink
                        to="/modules"
                        class="hover:text-primary-500">
                        Modules
                    </RouterLink>
                    <RouterLink
                        to="/pricing"
                        class="hover:text-primary-500">
                        Pricing
                    </RouterLink>
                    <RouterLink
                        to="/contact"
                        class="hover:text-primary-500">
                        Contact
                    </RouterLink>
                </nav>

                <div class="flex items-center gap-2">
                    <RouterLink
                        to="/login"
                        class="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                        Sign in
                    </RouterLink>

                    <RouterLink
                        to="/book-demo"
                        class="bg-primary-600 hover:bg-primary-700 rounded-md px-4 py-2 text-sm font-semibold text-white">
                        Book Demo
                    </RouterLink>

                    <RouterLink
                        to="/dashboard"
                        class="bg-primary-600 hover:bg-primary-700 rounded-md px-4 py-2 text-sm font-semibold text-white">
                        Example
                    </RouterLink>

                    <ThemeToggle />
                </div>
            </div>
        </header>

        <section class="px-4 pt-24 pb-12 lg:px-8">
            <div class="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
                <div class="space-y-6">
                    <span class="bg-primary-100 text-primary-600 inline-block rounded-full px-3 py-1 text-xs">
                        ERP PLATFORM
                    </span>

                    <h1 class="text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                        Manage everything from one
                        <span class="text-primary-500">dashboard</span>
                    </h1>

                    <p class="max-w-lg text-slate-600 dark:text-slate-300">
                        Automate finance, HR, and inventory with real-time control and insights.
                    </p>

                    <div class="flex flex-wrap gap-3">
                        <RouterLink
                            to="/erp/demo"
                            class="bg-primary-600 hover:bg-primary-700 rounded-md px-5 py-2.5 text-sm font-semibold text-white">
                            Request Demo
                        </RouterLink>

                        <RouterLink
                            to="/login"
                            class="rounded-md border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                            Sign In
                        </RouterLink>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-3">
                        <div
                            v-for="item in kpis"
                            :key="item.label"
                            class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p class="text-lg font-bold text-slate-900 dark:text-white">{{ item.value }}</p>
                            <p class="text-xs text-slate-500">{{ item.label }}</p>
                        </div>
                    </div>
                </div>

                <div
                    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div class="mb-4 flex justify-between">
                        <h2 class="text-sm font-semibold text-slate-900 dark:text-white">ERP Snapshot</h2>
                        <span class="bg-primary-100 text-primary-600 rounded-full px-2 py-1 text-xs">LIVE</span>
                    </div>

                    <div class="mb-4">
                        <div class="mb-1 flex justify-between text-xs">
                            <span>Revenue</span>
                            <span>78%</span>
                        </div>
                        <div class="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                            <div class="h-2 w-[78%] rounded-full bg-blue-500"></div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <span
                            v-for="m in modules"
                            :key="m"
                            class="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                            {{ m }}
                        </span>
                    </div>
                </div>
            </div>
        </section>

        <section class="px-4 py-16 lg:px-8">
            <div class="mx-auto mb-10 max-w-7xl text-center">
                <span class="bg-primary-100 text-primary-600 rounded-full px-3 py-1 text-xs">Features</span>
                <h2 class="mt-3 text-2xl font-bold lg:text-3xl">Everything you need</h2>
            </div>

            <div class="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
                <div
                    v-for="card in featureCards"
                    :key="card.title"
                    class="rounded-xl border border-slate-200 bg-white p-6 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div
                        :class="card.color"
                        class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                        <component :is="card.icon" />
                    </div>

                    <h3 class="mb-2 font-bold">{{ card.title }}</h3>
                    <p class="mb-4 text-sm text-gray-500">{{ card.description }}</p>

                    <div class="text-primary-500 flex items-center gap-1 text-sm font-semibold">
                        Learn more
                        <RightArrowIcon />
                    </div>
                </div>
            </div>
        </section>

        <section class="bg-primary-600 px-4 py-16 text-center text-white">
            <h2 class="mb-3 text-2xl font-bold">Ready to transform your workflow?</h2>
            <p class="mb-6 text-white/80">Start managing your business smarter today.</p>

            <div class="flex flex-wrap justify-center gap-3">
                <a
                    href="/login"
                    class="text-primary-600 rounded-md bg-white px-6 py-2 font-semibold">
                    Start Free Trial
                </a>

                <a
                    href="#features"
                    class="rounded-md border border-white px-6 py-2">
                    View Demo
                </a>
            </div>
        </section>

        <footer class="border-t py-6 text-center text-xs text-gray-400 dark:border-gray-800">
            © {{ new Date().getFullYear() }} ERP Suite
        </footer>
    </div>
</template>
