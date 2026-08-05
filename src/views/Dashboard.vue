<script setup lang="ts">
import { computed, markRaw, onMounted, type Component } from 'vue';
import { useRouter } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDashboard } from '@/composables/useDashboard';

import Badge from '@/components/common/Badge.vue';
import StatCard from '@/components/common/StatCard.vue';
import Skeleton from '@/components/common/Skeleton.vue';

import Calendar from '@/assets/icons/Calendar.vue';
import FileText from '@/assets/icons/FileText.vue';
import CalendarCheckIcon from '@/assets/icons/CalendarCheckIcon.vue';
import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';
import ShieldCheckAltIcon from '@/assets/icons/ShieldCheckAltIcon.vue';

import { STATUS_LIGHT } from '@/config/appConfig';
import type { AllowedAction } from '@/constants/allowedActions';

const router = useRouter();
const { customizeLanguageData } = useLanguageStore();
const { isLoading, stats, load } = useDashboard();

const semester = computed(() => stats.value?.current_semester ?? null);

/**
 * Four figures, all for the current semester. Each is one count the backend
 * already did — the cards never fan out into a request apiece.
 */
const cards = computed(() => [
    {
        key: 'offerings',
        title: customizeLanguageData('approvedOfferings', 'Approved offerings'),
        value: stats.value?.registrar_approved_offerings_count ?? 0,
        icon: markRaw(FileText),
        variant: 'primary' as const
    },
    {
        key: 'classes',
        title: customizeLanguageData('publishedMeetings', 'Published class meetings'),
        value: stats.value?.published_class_schedules_count ?? 0,
        icon: markRaw(Calendar),
        variant: 'success' as const
    },
    {
        key: 'exams',
        title: customizeLanguageData('upcomingExams', 'Upcoming published exams'),
        value: stats.value?.upcoming_published_exams_count ?? 0,
        icon: markRaw(CalendarCheckIcon),
        variant: 'warning' as const
    },
    {
        key: 'semester',
        title: customizeLanguageData('currentSemester', 'Current semester'),
        value: semester.value?.name ?? '—',
        icon: markRaw(ClockTimeTimerArrow),
        variant: 'info' as const
    }
]);

interface QuickAction {
    key: string;
    label: string;
    to: string;
    /** The permission that unlocks it — the same key the backend gates on. */
    action: AllowedAction;
    icon: Component;
}

const quickActions: QuickAction[] = [
    {
        key: 'quickGenerateClass',
        label: 'Generate class timetable',
        to: '/scheduling/classes',
        action: 'runClassScheduleGeneration',
        icon: markRaw(Calendar)
    },
    {
        key: 'quickGenerateExam',
        label: 'Generate exam timetable',
        to: '/scheduling/exams',
        action: 'runExamScheduleGeneration',
        icon: markRaw(CalendarCheckIcon)
    },
    {
        key: 'quickViewTimetable',
        label: 'View the timetable',
        to: '/timetable',
        action: 'seeClassSchedule',
        icon: markRaw(ClockTimeTimerArrow)
    },
    {
        key: 'quickDutyRoster',
        label: 'Duty roster',
        to: '/invigilation/assignments',
        action: 'seeInvigilatorAssignment',
        icon: markRaw(ShieldCheckAltIcon)
    }
];

const goTo = (to: string) => {
    if (router.resolve(to).matched.length) router.push(to);
};

onMounted(() => {
    load();
});
</script>

<template>
    <div class="space-y-8">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-text-primary text-2xl font-bold">{{ $lang.dashboard || 'Dashboard' }}</h1>
                <p class="text-text-tertiary mt-1 text-sm">
                    {{ $lang.dashboardDesc || 'Where the current semester stands, and what to do next.' }}
                </p>
            </div>

            <div
                v-if="semester"
                class="flex items-center gap-3">
                <Badge
                    outlined
                    :variant="STATUS_LIGHT"
                    :label="semester.status_label || semester.status_code || '—'" />
                <span class="text-text-tertiary text-sm tabular-nums">
                    {{ semester.start_date }} – {{ semester.end_date }}
                </span>
            </div>
        </header>

        <Skeleton v-if="isLoading && !stats" />

        <div
            v-else
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                v-for="card in cards"
                :key="card.key"
                :title="card.title"
                :value="card.value"
                :icon="card.icon"
                :variant="card.variant" />
        </div>

        <section class="bg-surface-card border-border-default rounded-xl border p-6 shadow-sm">
            <h2 class="text-text-primary text-lg font-bold">{{ $lang.quickActions || 'Quick Actions' }}</h2>
            <p class="text-text-tertiary mt-1 text-sm">
                {{ $lang.quickActionsDesc || 'Jump straight into common tasks.' }}
            </p>

            <div class="mt-5 flex flex-wrap gap-3">
                <template
                    v-for="action in quickActions"
                    :key="action.key">
                    <button
                        v-if="$can(action.action)"
                        type="button"
                        class="border-border-default text-schedule-icon-brand hover:bg-schedule-brand-blue-subtle flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors"
                        @click="goTo(action.to)">
                        <component
                            :is="action.icon"
                            class="h-5 w-5 shrink-0" />
                        <span>{{ $lang[action.key] || action.label }}</span>
                    </button>
                </template>
            </div>
        </section>
    </div>
</template>
