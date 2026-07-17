<script setup lang="ts">
import { markRaw } from 'vue';
import { useRouter } from 'vue-router';

import BookIcon from '@/assets/icons/BookIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import UsersIcon from '@/assets/icons/UsersIcon.vue';
import BuildingIcon from '@/assets/icons/BuildingIcon.vue';
import BusinessChart from '@/assets/icons/BusinessChart.vue';
import ModernBuilding from '@/assets/icons/ModernBuilding.vue';
import BuildingCityIcon from '@/assets/icons/BuildingCityIcon.vue';
import CalendarCheckIcon from '@/assets/icons/CalendarCheckIcon.vue';
import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';

const router = useRouter();

// Static placeholder data — swap for API-driven values later.
const stats = [
    { key: 'colleges', label: 'Colleges/Schools', value: 10, icon: markRaw(BuildingCityIcon) },
    { key: 'departments', label: 'Departments', value: 20, icon: markRaw(BuildingIcon) },
    { key: 'instructors', label: 'Instructors', value: 200, icon: markRaw(UsersIcon) },
    { key: 'classes', label: 'Classes', value: 40, icon: markRaw(BusinessChart) },
    { key: 'courses', label: 'Courses', value: 10, icon: markRaw(BookIcon) },
    { key: 'rooms', label: 'Rooms', value: 20, icon: markRaw(ModernBuilding) }
];

const quickActions = [
    { key: 'add-class', label: 'Add Class', icon: markRaw(PlusIcon), to: '/classes', primary: true },
    { key: 'generate-schedule', label: 'Generate Schedule', icon: markRaw(ClockTimeTimerArrow), to: '/scheduling' },
    { key: 'schedule-exam', label: 'Schedule Exam', icon: markRaw(CalendarCheckIcon), to: '/exam' }
];

// Placeholder targets — the class/scheduling/exam pages aren't wired up yet, so
// only navigate when the route actually resolves. Buttons become live automatically
// once those routes exist.
const goTo = (to: string) => {
    if (router.resolve(to).matched.length) router.push(to);
};
</script>

<template>
    <div class="space-y-8">
        <!-- Header -->
        <header>
            <h1 class="text-text-primary text-2xl font-bold">Dashboard</h1>
            <p class="text-text-tertiary mt-1 text-sm">Overview of academic resources and scheduling status.</p>
        </header>

        <!-- Stat cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div
                v-for="stat in stats"
                :key="stat.key"
                class="bg-surface-card border-border-default border-b-schedule-brand-blue rounded-xl border border-b-[3px] p-5 shadow-sm transition-shadow hover:shadow-md">
                <div class="flex items-start justify-between gap-3">
                    <span class="text-text-tertiary text-sm font-medium">{{ stat.label }}</span>
                    <span
                        class="bg-schedule-brand-blue-subtle text-schedule-icon-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <component
                            :is="stat.icon"
                            class="h-5 w-5" />
                    </span>
                </div>
                <p class="text-text-primary mt-2 text-3xl font-bold">{{ stat.value }}</p>
            </div>
        </div>

        <!-- Quick Actions -->
        <section class="bg-surface-card border-border-default rounded-xl border p-6 shadow-sm">
            <h2 class="text-text-primary text-lg font-bold">Quick Actions</h2>
            <p class="text-text-tertiary mt-1 text-sm">Jump straight into common tasks.</p>

            <div class="mt-5 flex flex-wrap gap-3">
                <button
                    v-for="action in quickActions"
                    :key="action.key"
                    type="button"
                    @click="goTo(action.to)"
                    :class="[
                        'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                        action.primary
                            ? 'bg-schedule-brand-blue text-white hover:opacity-90'
                            : 'border-border-default text-schedule-icon-brand hover:bg-schedule-brand-blue-subtle border'
                    ]">
                    <component
                        :is="action.icon"
                        class="h-5 w-5 shrink-0" />
                    <span>{{ action.label }}</span>
                </button>
            </div>
        </section>
    </div>
</template>
