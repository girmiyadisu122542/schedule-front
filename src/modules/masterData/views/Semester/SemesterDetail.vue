<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getSemester } from '@/modules/masterData/services/semesterService';
import { fetchOfferings } from '@/modules/offerings/services/offeringService';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';
import { fetchExamSchedules } from '@/modules/scheduling/services/examScheduleService';

import Badge from '@/components/common/Badge.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';
import { STATUS_SUCCESS } from '@/config/appConfig';
import type { Offering } from '@/modules/offerings/types/offering';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: semester, isLoading, notFound, load } = useDetailResource(getSemester);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('semesters', 'Semesters'), to: '/semesters' },
    { label: semester.value?.name ?? '' }
]);

const offeringColumns = computed(() => [
    { key: 'name', label: customizeLanguageData('courseOffering', 'Offering') },
    {
        key: 'instructor',
        label: customizeLanguageData('instructor', 'Instructor'),
        format: (row: Offering) => row.instructor?.name
    },
    { key: 'expected_students', label: customizeLanguageData('expectedStudents', 'Students'), numeric: true },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: Offering) => row.status?.name
    }
]);

const sessionColumns = computed(() => [
    { key: 'name', label: customizeLanguageData('classSchedule', 'Class session') },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    {
        key: 'room',
        label: customizeLanguageData('room', 'Room'),
        format: (row: ClassSchedule) => row.room?.name
    },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: ClassSchedule) => row.status?.name
    }
]);

const sittingColumns = computed(() => [
    { key: 'name', label: customizeLanguageData('examSitting', 'Exam') },
    { key: 'exam_date', label: customizeLanguageData('examDate', 'Date'), numeric: true },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: ExamSchedule) => row.status?.name
    }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="ClockTimeTimerArrow"
        :title="semester?.name ?? ''"
        :subtitle="semester?.academic_year?.name ?? ''"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.semesterNotFound || 'Semester not found'">
        <template #header-actions>
            <Badge
                v-if="semester?.is_current"
                :variant="STATUS_SUCCESS"
                :label="$lang.currentSemester || 'Current semester'" />
            <StatusBadge
                v-if="semester?.status"
                :value="semester.status" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.academicYear || 'Academic year'"
                :value="semester?.academic_year?.name" />
            <DetailField
                :label="$lang.term || 'Term'"
                :value="semester?.term"
                numeric />
            <DetailField
                :label="$lang.startDate || 'Start date'"
                :value="semester?.start_date"
                numeric />
            <DetailField
                :label="$lang.endDate || 'End date'"
                :value="semester?.end_date"
                numeric />
        </template>

        <template v-if="semester">
            <DetailPanel
                :title="$lang.courseOfferings || 'Course Offerings'"
                :fetcher="() => fetchOfferings({ semester_id: semester!.id, limit: 50 })"
                :columns="offeringColumns"
                :empty-text="$lang.noOfferingsHere || 'Nothing offered this semester yet.'"
                to="/offerings"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                :title="$lang.classSchedules || 'Class Timetable'"
                :fetcher="() => fetchClassSchedules({ semester_id: semester!.id, limit: 50 })"
                :columns="sessionColumns"
                :empty-text="$lang.noClassSessionsHere || 'Nothing scheduled this semester yet.'"
                to="/scheduling/classes"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                :title="$lang.examSchedules || 'Exam Timetable'"
                :fetcher="() => fetchExamSchedules({ semester_id: semester!.id, limit: 50 })"
                :columns="sittingColumns"
                :empty-text="$lang.noSittingsHere || 'No exams scheduled this semester yet.'"
                to="/scheduling/exams"
                :see-all-label="$lang.seeAll || 'See all'" />
        </template>
    </DetailPage>
</template>
