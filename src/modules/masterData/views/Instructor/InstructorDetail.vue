<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getInstructor } from '@/modules/masterData/services/instructorService';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';
import { fetchAvailabilities } from '@/modules/invigilation/services/invigilatorAvailabilityService';
import { fetchAssignments } from '@/modules/invigilation/services/examInvigilatorAssignmentService';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';

import Badge from '@/components/common/Badge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import UserIcon from '@/assets/icons/UserIcon.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import type { Availability } from '@/modules/invigilation/types/availability';
import type { Assignment } from '@/modules/invigilation/types/assignment';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: instructor, isLoading, notFound, load } = useDetailResource(getInstructor);
const schedulingConstants = useSchedulingConstants();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('instructors', 'Instructors'), to: '/instructors' },
    { label: instructor.value?.full_name ?? '' }
]);

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

const dutyColumns = computed(() => [
    { key: 'exam_date', label: customizeLanguageData('examDate', 'Date'), numeric: true },
    { key: 'time_range', label: customizeLanguageData('availabilityWindow', 'Window'), numeric: true },
    {
        key: 'exam_schedule',
        label: customizeLanguageData('examSitting', 'Sitting'),
        format: (row: Assignment) => row.exam_schedule?.name
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
    }
]);

const availabilityColumns = computed(() => [
    { key: 'available_date', label: customizeLanguageData('availableDate', 'Date'), numeric: true },
    { key: 'time_range', label: customizeLanguageData('availabilityWindow', 'Window'), numeric: true },
    {
        key: 'semester',
        label: customizeLanguageData('semester', 'Semester'),
        format: (row: Availability) => row.semester?.name
    },
    { key: 'remark', label: customizeLanguageData('remark', 'Remark') }
]);

onMounted(() => {
    load(String(route.params.uuid));
    schedulingConstants.load();
});
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="UserIcon"
        :title="instructor?.full_name ?? ''"
        :subtitle="[instructor?.employee_no, instructor?.department?.name].filter(Boolean).join(' · ')"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.instructorNotFound || 'Instructor not found'">
        <template #header-actions>
            <Badge
                v-if="instructor?.academic_rank"
                outlined
                :variant="STATUS_LIGHT"
                :label="instructor.academic_rank.name" />
            <Badge
                v-if="instructor?.can_invigilate"
                :variant="STATUS_SUCCESS"
                :label="$lang.canInvigilate || 'Can invigilate'" />
            <BoolChip :value="!!instructor?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.employeeNo || 'Employee no'"
                :value="instructor?.employee_no" />
            <DetailField
                :label="$lang.department || 'Department'"
                :value="instructor?.department?.name" />
            <DetailField
                :label="$lang.email || 'Email'"
                :value="instructor?.email" />
            <DetailField
                :label="$lang.phone || 'Phone'"
                :value="instructor?.phone" />
            <DetailField
                :label="$lang.maxWeeklyHours || 'Max weekly hours'"
                :value="instructor?.max_weekly_hours"
                numeric />
            <!--
                The optional portal account. The registry precedes the login, so
                this is often empty and that is not a gap.
            -->
            <DetailField
                :label="$lang.portalAccount || 'Portal account'"
                :value="instructor?.person?.full_name" />
        </template>

        <template v-if="instructor">
            <DetailPanel
                :title="$lang.teachingLoad || 'Teaching load'"
                :fetcher="() => fetchClassSchedules({ instructor_id: instructor!.id, limit: 100 })"
                :columns="meetingColumns"
                :empty-text="$lang.noMeetingsHere || 'This instructor teaches nothing scheduled yet.'"
                to="/timetable"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                v-if="instructor.can_invigilate"
                :title="$lang.invigilatorAssignments || 'Duty Roster'"
                :fetcher="() => fetchAssignments({ instructor_id: instructor!.id, limit: 100 })"
                :columns="dutyColumns"
                :empty-text="$lang.noDutiesHere || 'No invigilation duties yet.'"
                to="/invigilation/assignments"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                v-if="instructor.can_invigilate"
                :title="$lang.invigilatorAvailabilities || 'Invigilator Availability'"
                :fetcher="() => fetchAvailabilities({ instructor_id: instructor!.id, limit: 100 })"
                :columns="availabilityColumns"
                :empty-text="$lang.noAvailabilityHere || 'The department has offered no windows for this instructor.'"
                to="/invigilation/availabilities"
                :see-all-label="$lang.seeAll || 'See all'" />
        </template>
    </DetailPage>
</template>
