<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { getClassSchedule } from '@/modules/scheduling/services/classScheduleService';

import Badge from '@/components/common/Badge.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';

import Calendar from '@/assets/icons/Calendar.vue';
import { STATUS_LIGHT } from '@/config/appConfig';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: meeting, isLoading, notFound, load } = useDetailResource(getClassSchedule);
const schedulingConstants = useSchedulingConstants();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('classSchedules', 'Class Timetable'), to: '/scheduling/classes' },
    { label: meeting.value?.course_offering?.name ?? '' }
]);

const slot = computed(() =>
    meeting.value ? `${schedulingConstants.dayName(meeting.value.day_of_week)} ${meeting.value.time_range}` : ''
);

onMounted(() => {
    load(String(route.params.uuid));
    schedulingConstants.load();
});
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="Calendar"
        :title="meeting?.course_offering?.name ?? ''"
        :subtitle="slot"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.classScheduleNotFound || 'Class meeting not found'">
        <template #header-actions>
            <Badge
                v-if="meeting?.session_type"
                outlined
                :variant="STATUS_LIGHT"
                :style="{
                    color: meeting.session_type.color ?? undefined,
                    borderColor: meeting.session_type.color ?? undefined
                }"
                :label="meeting.session_type.name" />
            <Badge
                v-if="meeting?.status"
                outlined
                :variant="STATUS_LIGHT"
                :style="{ color: meeting.status.color ?? undefined, borderColor: meeting.status.color ?? undefined }"
                :label="meeting.status.name" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.dayOfWeek || 'Day'"
                :value="schedulingConstants.dayName(meeting?.day_of_week)" />
            <DetailField
                :label="$lang.time || 'Time'"
                :value="meeting?.time_range"
                numeric />
            <DetailField
                :label="$lang.room || 'Room'"
                :value="meeting?.room?.name" />
            <DetailField
                :label="$lang.instructor || 'Instructor'"
                :value="meeting?.instructor?.name" />
            <DetailField
                :label="$lang.section || 'Cohort'"
                :value="meeting?.section?.name" />
            <DetailField
                :label="$lang.semester || 'Semester'"
                :value="meeting?.semester?.name" />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="meeting?.created_by?.full_name" />
            <DetailField
                :label="$lang.publishedBy || 'Published by'"
                :value="meeting?.published_by?.full_name" />
            <DetailField
                :label="$lang.publishedAt || 'Published at'"
                :value="meeting?.published_at"
                numeric />
            <!--
                `state` is the conflict-liveness flag the three EXCLUDE
                constraints read — 0 means this row no longer blocks its slot.
            -->
            <DetailField
                :label="$lang.conflictState || 'Blocks its slot'"
                :value="meeting?.state === 1 ? $lang.yes || 'Yes' : $lang.no || 'No'" />
        </template>
    </DetailPage>
</template>
