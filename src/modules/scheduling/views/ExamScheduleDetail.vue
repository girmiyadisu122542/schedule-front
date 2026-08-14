<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getExamSchedule } from '@/modules/scheduling/services/examScheduleService';
import { fetchAssignments } from '@/modules/invigilation/services/examInvigilatorAssignmentService';

import StatusBadge from '@/components/common/StatusBadge.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';
import MainButton from '@/components/common/MainButton.vue';
import ExamInvigilatorsDialog from '@/modules/scheduling/components/ExamInvigilatorsDialog.vue';

import CalendarCheckIcon from '@/assets/icons/CalendarCheckIcon.vue';

import type { Assignment } from '@/modules/invigilation/types/assignment';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: sitting, isLoading, notFound, load } = useDetailResource(getExamSchedule);

/** Opens the per-hall staffing dialog, and forces the roster panel to redraw. */
const invigilatorsVisible = ref(false);
const rosterKey = ref(0);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('examSchedules', 'Exam Timetable'), to: '/scheduling/exams' },
    { label: sitting.value?.course_offering?.name ?? '' }
]);

const when = computed(() => (sitting.value ? `${sitting.value.exam_date} ${sitting.value.time_range}` : ''));

const dutyColumns = computed(() => [
    {
        key: 'instructor',
        label: customizeLanguageData('instructor', 'Invigilator'),
        format: (row: Assignment) => row.instructor?.name
    },
    {
        key: 'role',
        label: customizeLanguageData('invigilatorRole', 'Role'),
        format: (row: Assignment) => row.role?.name
    },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: Assignment) => row.status?.name
    },
    { key: 'remark', label: customizeLanguageData('remark', 'Remark') }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="CalendarCheckIcon"
        :title="sitting?.course_offering?.name ?? ''"
        :subtitle="when"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.examScheduleNotFound || 'Exam schedule not found'">
        <template #header-actions>
            <StatusBadge
                v-if="sitting?.exam_type"
                :value="sitting.exam_type" />
            <StatusBadge
                v-if="sitting?.status"
                :value="sitting.status" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.examDate || 'Date'"
                :value="sitting?.exam_date"
                numeric />
            <DetailField
                :label="$lang.time || 'Time'"
                :value="sitting?.time_range"
                numeric />
            <DetailField
                :label="$lang.examHall || 'Hall'"
                :value="sitting?.room?.name" />
            <DetailField
                :label="$lang.section || 'Section'"
                :value="sitting?.section?.name" />
            <DetailField
                :label="$lang.invigilators || 'Invigilators needed'"
                :value="sitting?.required_invigilators"
                numeric />
            <DetailField
                :label="$lang.semester || 'Semester'"
                :value="sitting?.semester?.name" />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="sitting?.created_by?.full_name" />
            <DetailField
                :label="$lang.publishedBy || 'Published by'"
                :value="sitting?.published_by?.full_name" />
        </template>

        <!--
            The department-confirmation step, when it happened. Absent for a
            sitting that went straight from draft to published.
        -->
        <section
            v-if="sitting?.confirmed_by"
            class="schedule-card border-border-default rounded-2xl border p-6">
            <h2 class="text-text-primary mb-4 text-base font-semibold">
                {{ $lang.departmentConfirmation || 'Department confirmation' }}
            </h2>
            <dl class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <DetailField
                    :label="$lang.confirmedBy || 'Confirmed by'"
                    :value="sitting.confirmed_by.full_name" />
                <DetailField
                    :label="$lang.confirmedAt || 'Confirmed at'"
                    :value="sitting.confirmed_at"
                    numeric />
                <DetailField
                    :label="$lang.confirmationRemark || 'Remark'"
                    :value="sitting.confirmation_remark" />
            </dl>
        </section>

        <div
            v-if="sitting"
            class="space-y-3">
            <DetailPanel
                :key="rosterKey"
                :title="$lang.invigilatorAssignments || 'Duty Roster'"
                :fetcher="() => fetchAssignments({ exam_schedule_id: sitting!.id, limit: 50 })"
                :columns="dutyColumns"
                :empty-text="$lang.noDutiesHere || 'Nobody is on duty at this exam yet.'"
                to="/invigilation/assignments"
                :see-all-label="$lang.seeAll || 'See all'" />

            <MainButton
                v-if="$can('assignInvigilator')"
                outlined
                :label="$lang.manageInvigilators || 'Invigilators'"
                @click="invigilatorsVisible = true" />
        </div>

        <!--
            Staffing this hall. The panel is keyed on a counter so it refetches
            when the dialog changes something — its fetcher runs once on mount
            and has no other way to know.
        -->
        <ExamInvigilatorsDialog
            v-model:visible="invigilatorsVisible"
            :sitting="sitting"
            @changed="rosterKey++" />
    </DetailPage>
</template>
