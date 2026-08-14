<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getRoom } from '@/modules/masterData/services/roomService';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';
import { fetchExamSchedules } from '@/modules/scheduling/services/examScheduleService';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';

import Badge from '@/components/common/Badge.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import KeyIcon from '@/assets/icons/KeyIcon.vue';
import { STATUS_SUCCESS } from '@/config/appConfig';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: room, isLoading, notFound, load } = useDetailResource(getRoom);
const schedulingConstants = useSchedulingConstants();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('rooms', 'Rooms'), to: '/rooms' },
    { label: room.value?.name || room.value?.code || '' }
]);

/** "New Block → Main Campus" — a room's location is only complete through both. */
const location = computed(() => [room.value?.building?.name, room.value?.campus?.name].filter(Boolean).join(' → '));

const sessionColumns = computed(() => [
    {
        key: 'day_of_week',
        label: customizeLanguageData('dayOfWeek', 'Day'),
        format: (row: ClassSchedule) => schedulingConstants.dayName(row.day_of_week)
    },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    { key: 'name', label: customizeLanguageData('classSchedule', 'Class session') },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: ClassSchedule) => row.status?.name
    }
]);

const sittingColumns = computed(() => [
    { key: 'exam_date', label: customizeLanguageData('examDate', 'Date'), numeric: true },
    { key: 'time_range', label: customizeLanguageData('time', 'Time'), numeric: true },
    { key: 'name', label: customizeLanguageData('examSitting', 'Exam') },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: ExamSchedule) => row.status?.name
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
        :icon="KeyIcon"
        :title="room?.name || room?.code || ''"
        :subtitle="location"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.roomNotFound || 'Room not found'">
        <template #header-actions>
            <StatusBadge
                v-if="room?.room_type"
                :value="room.room_type" />
            <Badge
                v-if="room?.is_exam_venue"
                :variant="STATUS_SUCCESS"
                :label="$lang.examVenue || 'Exam venue'" />
            <BoolChip :value="!!room?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="room?.code" />
            <DetailField
                :label="$lang.building || 'Building'"
                :value="room?.building?.name" />
            <DetailField
                :label="$lang.floor || 'Floor'"
                :value="room?.floor"
                numeric />
            <DetailField
                :label="$lang.capacity || 'Capacity'"
                :value="room?.capacity"
                numeric />
            <!-- Spaced exam seating is far below teaching capacity; both are shown. -->
            <DetailField
                :label="$lang.examCapacity || 'Exam seating capacity'"
                :value="room?.exam_capacity"
                numeric />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="room?.created_by?.full_name" />
        </template>

        <template v-if="room">
            <DetailPanel
                :title="$lang.classSchedules || 'Class Timetable'"
                :fetcher="() => fetchClassSchedules({ room_id: room!.id, limit: 100 })"
                :columns="sessionColumns"
                :empty-text="$lang.noClassSessionsHere || 'Nothing is scheduled in this room yet.'"
                to="/scheduling/classes"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                v-if="room.is_exam_venue"
                :title="$lang.examSchedules || 'Exam Timetable'"
                :fetcher="() => fetchExamSchedules({ room_id: room!.id, limit: 100 })"
                :columns="sittingColumns"
                :empty-text="$lang.noSittingsHere || 'No exams booked in this hall yet.'"
                to="/scheduling/exams"
                :see-all-label="$lang.seeAll || 'See all'" />
        </template>
    </DetailPage>
</template>
