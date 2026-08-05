<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getGenerationRun } from '@/modules/scheduling/services/generationRunService';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';
import { fetchExamSchedules } from '@/modules/scheduling/services/examScheduleService';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';

import Badge from '@/components/common/Badge.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';
import { STATUS_LIGHT, STATUS_WARNING, STATUS_SUCCESS } from '@/config/appConfig';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: run, isLoading, notFound, load } = useDetailResource(getGenerationRun);
const schedulingConstants = useSchedulingConstants();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('generationRuns', 'Generation Runs') },
    { label: run.value?.name ?? '' }
]);

const isExamRun = computed(() => run.value?.type_code === 'exam');

/** The three outcome lists the run recorded, straight from its `summary` jsonb. */
const placed = computed(() => run.value?.summary?.placed ?? []);
const unplaced = computed(() => run.value?.summary?.unplaced ?? []);
const skipped = computed(() => run.value?.summary?.skipped ?? []);

const meetingColumns = computed(() => [
    {
        key: 'day_of_week',
        label: customizeLanguageData('dayOfWeek', 'Day'),
        format: (row: ClassSchedule) => schedulingConstants.dayName(row.day_of_week)
    },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    { key: 'name', label: customizeLanguageData('classSchedule', 'Meeting') },
    {
        key: 'room',
        label: customizeLanguageData('room', 'Room'),
        format: (row: ClassSchedule) => row.room?.name
    }
]);

const sittingColumns = computed(() => [
    { key: 'exam_date', label: customizeLanguageData('examDate', 'Date'), numeric: true },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    { key: 'name', label: customizeLanguageData('examSitting', 'Sitting') },
    {
        key: 'room',
        label: customizeLanguageData('examHall', 'Hall'),
        format: (row: ExamSchedule) => row.room?.name
    }
]);

onMounted(() => {
    load(String(route.params.uuid));
    schedulingConstants.load();
});
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="ClockTimeTimerArrow"
        :title="run?.name ?? ''"
        :subtitle="run?.run_by?.full_name ? `${$lang.runBy || 'Run by'} ${run.run_by.full_name}` : ''"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.generationRunNotFound || 'Generation run not found'">
        <template #header-actions>
            <Badge
                v-if="run?.status"
                outlined
                :variant="STATUS_LIGHT"
                :style="{ color: run.status.color ?? undefined, borderColor: run.status.color ?? undefined }"
                :label="run.status.name" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.semester || 'Semester'"
                :value="run?.semester?.name" />
            <DetailField
                :label="$lang.generationType || 'Type'"
                :value="run?.type?.name" />
            <!--
                Field labels, not the panel's sentence fragment: `meetingsPlaced`
                reads "6 meetings placed" and is wrong as a label.
            -->
            <DetailField
                :label="
                    isExamRun
                        ? $lang.placedSittingsLabel || 'Sittings placed'
                        : $lang.placedMeetingsLabel || 'Meetings placed'
                "
                :value="run?.scheduled_count"
                numeric />
            <DetailField
                :label="$lang.unplacedOfferingsLabel || 'Offerings unplaced'"
                :value="run?.unplaced_count"
                numeric />
            <DetailField
                :label="$lang.durationSeconds || 'Duration (s)'"
                :value="run?.duration_seconds"
                numeric />
            <DetailField
                :label="$lang.startedAt || 'Started at'"
                :value="run?.started_at"
                numeric />
            <DetailField
                :label="$lang.completedAt || 'Completed at'"
                :value="run?.completed_at"
                numeric />
            <DetailField
                :label="$lang.runBy || 'Run by'"
                :value="run?.run_by?.full_name" />
        </template>

        <!--
            The summary is the point of keeping a run at all: what could not be
            placed is the work a human still has to finish.
        -->
        <section
            v-if="unplaced.length"
            class="schedule-card border-border-default rounded-2xl border p-6">
            <h2 class="text-text-primary mb-4 text-base font-semibold">
                {{ $lang.unplacedOfferings || 'Could not be placed' }}
                <span class="text-text-tertiary ml-2 text-sm font-normal">{{ unplaced.length }}</span>
            </h2>
            <ul class="space-y-2">
                <li
                    v-for="item in unplaced"
                    :key="item.course_offering_id"
                    class="border-border-subtle flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <span class="text-text-secondary min-w-0 text-sm">{{ item.label }}</span>
                    <span class="flex items-center gap-2">
                        <Badge
                            :variant="STATUS_WARNING"
                            :label="`${item.placed}/${item.requested}`" />
                        <span class="text-text-tertiary text-xs">{{ item.reason }}</span>
                    </span>
                </li>
            </ul>
        </section>

        <section
            v-if="skipped.length"
            class="schedule-card border-border-default rounded-2xl border p-6">
            <h2 class="text-text-primary mb-4 text-base font-semibold">
                {{ $lang.skippedOfferings || 'Already on the timetable' }}
                <span class="text-text-tertiary ml-2 text-sm font-normal">{{ skipped.length }}</span>
            </h2>
            <ul class="text-text-tertiary space-y-1 text-sm">
                <li
                    v-for="item in skipped"
                    :key="item.course_offering_id">
                    {{ item.label }}
                </li>
            </ul>
        </section>

        <section
            v-if="placed.length"
            class="schedule-card border-border-default rounded-2xl border p-6">
            <h2 class="text-text-primary mb-4 text-base font-semibold">
                {{ $lang.placedOfferings || 'Placed in full' }}
                <span class="text-text-tertiary ml-2 text-sm font-normal">{{ placed.length }}</span>
            </h2>
            <div class="flex flex-wrap gap-2">
                <Badge
                    v-for="item in placed"
                    :key="item.course_offering_id"
                    :variant="STATUS_SUCCESS"
                    :label="`${item.label} · ${item.meetings ?? item.exam_date ?? ''}`" />
            </div>
        </section>

        <!-- The rows this run actually wrote. -->
        <template v-if="run">
            <DetailPanel
                v-if="isExamRun"
                :title="$lang.examSchedules || 'Exam Timetable'"
                :fetcher="() => fetchExamSchedules({ generation_run_id: run!.id, limit: 100 })"
                :columns="sittingColumns"
                :empty-text="$lang.noSittingsHere || 'This run produced no sittings.'" />

            <DetailPanel
                v-else
                :title="$lang.classSchedules || 'Class Timetable'"
                :fetcher="() => fetchClassSchedules({ generation_run_id: run!.id, limit: 100 })"
                :columns="meetingColumns"
                :empty-text="$lang.noMeetingsHere || 'This run produced no meetings.'" />
        </template>
    </DetailPage>
</template>
