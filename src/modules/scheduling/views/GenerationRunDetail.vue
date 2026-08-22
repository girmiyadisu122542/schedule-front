<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { roomLabel } from '@/modules/scheduling/utils/roomLabel';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getGenerationRun, restoreGenerationRun } from '@/modules/scheduling/services/generationRunService';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';
import { fetchExamSchedules } from '@/modules/scheduling/services/examScheduleService';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';

import Badge from '@/components/common/Badge.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import MainButton from '@/components/common/MainButton.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';
import { STATUS_WARNING, STATUS_SUCCESS } from '@/config/appConfig';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';
import { readApiErrorMessage } from '@/utils/apiError';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: run, isLoading, notFound, load } = useDetailResource(getGenerationRun);
const schedulingConstants = useSchedulingConstants();

/**
 * What a placed row shows: how many sessions were laid down for a class run,
 * or the date for an exam run.
 *
 * `meetings` is the summary jsonb's old name for `sessions`. Runs recorded
 * before the rename still carry it, so both are read — dropping the old name
 * would blank this column out for every historical run.
 */
const placedDetail = (item: { sessions?: number; meetings?: number; exam_date?: string }) =>
    item.sessions ?? item.meetings ?? item.exam_date ?? '';

/**
 * Put this run's timetable back (C41).
 *
 * Confirmed first because it replaces whatever is currently in draft. The
 * result is reported honestly: rows whose slots have since been taken cannot
 * be restored, and saying so beats a bare "done".
 */
const isRestoring = ref(false);

const confirmRestore = async () => {
    isRestoring.value = true;
    try {
        const result = await restoreGenerationRun(run.value!.id);
        const detail = result.data;

        if (detail && detail.rejected > 0) {
            // A partial restore is not a failure, but the user has to know the
            // timetable did not come back whole.
            toast.warning(
                result.message ??
                    `${detail.restored} restored, ${detail.rejected} could not be put back — their slots are taken.`
            );
        } else {
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
        }

        await load(String(route.params.uuid));
    } catch (error: unknown) {
        toast.error(readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong')));
    } finally {
        isRestoring.value = false;
    }
};

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('generationRuns', 'Generation Runs') },
    { label: run.value?.name ?? '' }
]);

const isExamRun = computed(() => run.value?.type_code === 'exam');

/** The three outcome lists the run recorded, straight from its `summary` jsonb. */
const placed = computed(() => run.value?.summary?.placed ?? []);
const unplaced = computed(() => run.value?.summary?.unplaced ?? []);
const skipped = computed(() => run.value?.summary?.skipped ?? []);

const sessionColumns = computed(() => [
    {
        key: 'day_of_week',
        label: customizeLanguageData('dayOfWeek', 'Day'),
        format: (row: ClassSchedule) => schedulingConstants.dayName(row.day_of_week)
    },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    { key: 'name', label: customizeLanguageData('classSchedule', 'Class Schedule') },
    {
        key: 'room',
        label: customizeLanguageData('room', 'Room'),
        format: (row: ClassSchedule) => roomLabel(row.room)
    }
]);

const sittingColumns = computed(() => [
    { key: 'exam_date', label: customizeLanguageData('examDate', 'Date'), numeric: true },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    { key: 'name', label: customizeLanguageData('examSitting', 'Exam') },
    {
        key: 'room',
        label: customizeLanguageData('examHall', 'Hall'),
        format: (row: ExamSchedule) => roomLabel(row.room)
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
            <StatusBadge
                v-if="run?.status"
                :value="run.status" />

            <!--
                Hidden rather than disabled when there is nothing to restore:
                runs from before snapshots existed, and failed runs, have no
                copy to put back, and a permanently greyed-out button reads as
                a fault rather than as "not applicable here".
            -->
            <MainButton
                v-if="run?.has_snapshot && $can(isExamRun ? 'runExamScheduleGeneration' : 'runClassScheduleGeneration')"
                outlined
                :label="$lang.restoreRun || 'Restore this timetable'"
                :loading="isRestoring"
                @click="confirmRestore" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.semester || 'Semester'"
                :value="run?.semester?.name" />
            <DetailField
                :label="$lang.generationType || 'Type'"
                :value="run?.type?.name" />
            <!--
                Field labels, not the panel's sentence fragment: `classSessionsPlaced`
                reads "6 sessions placed" and is wrong as a label.
            -->
            <DetailField
                :label="
                    isExamRun
                        ? $lang.placedSittingsLabel || 'Schedules placed'
                        : $lang.placedClassSessionsLabel || 'Schedules placed'
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
                    :label="`${item.label} · ${placedDetail(item)}`" />
            </div>
        </section>

        <!-- The rows this run actually wrote. -->
        <template v-if="run">
            <DetailPanel
                v-if="isExamRun"
                :title="$lang.examSchedules || 'Exam Timetable'"
                :fetcher="() => fetchExamSchedules({ generation_run_id: run!.id, limit: 100 })"
                :columns="sittingColumns"
                :empty-text="$lang.noSittingsHere || 'This run produced no exam schedules.'" />

            <DetailPanel
                v-else
                :title="$lang.classSchedules || 'Class Timetable'"
                :fetcher="() => fetchClassSchedules({ generation_run_id: run!.id, limit: 100 })"
                :columns="sessionColumns"
                :empty-text="$lang.noClassSessionsHere || 'This run produced no class schedules.'" />
        </template>
    </DetailPage>
</template>
