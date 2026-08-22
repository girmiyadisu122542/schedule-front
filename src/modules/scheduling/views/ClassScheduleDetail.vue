<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { roomLabel } from '@/modules/scheduling/utils/roomLabel';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { getClassSchedule } from '@/modules/scheduling/services/classScheduleService';

import StatusBadge from '@/components/common/StatusBadge.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';

import Calendar from '@/assets/icons/Calendar.vue';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: session, isLoading, notFound, load } = useDetailResource(getClassSchedule);
const schedulingConstants = useSchedulingConstants();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('classSchedules', 'Class Timetable'), to: '/scheduling/classes' },
    { label: session.value?.course_offering?.name ?? '' }
]);

const slot = computed(() =>
    session.value ? `${schedulingConstants.dayName(session.value.day_of_week)} ${session.value.time_range}` : ''
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
        :title="session?.course_offering?.name ?? ''"
        :subtitle="slot"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.classScheduleNotFound || 'Class schedule not found'">
        <template #header-actions>
            <StatusBadge
                v-if="session?.session_type"
                :value="session.session_type" />
            <StatusBadge
                v-if="session?.status"
                :value="session.status" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.dayOfWeek || 'Day'"
                :value="schedulingConstants.dayName(session?.day_of_week)" />
            <DetailField
                :label="$lang.time || 'Time'"
                :value="session?.time_range"
                numeric />
            <DetailField
                :label="$lang.room || 'Room'"
                :value="roomLabel(session?.room)" />
            <DetailField
                :label="$lang.instructor || 'Instructor'"
                :value="session?.instructor?.name" />
            <DetailField
                :label="$lang.section || 'Section'"
                :value="session?.section?.name" />
            <DetailField
                :label="$lang.semester || 'Semester'"
                :value="session?.semester?.name" />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="session?.created_by?.full_name" />
            <DetailField
                :label="$lang.publishedBy || 'Published by'"
                :value="session?.published_by?.full_name" />
            <DetailField
                :label="$lang.publishedAt || 'Published at'"
                :value="session?.published_at"
                numeric />
            <!--
                `state` is the conflict-liveness flag the three EXCLUDE
                constraints read — 0 means this row no longer blocks its slot.
            -->
            <DetailField
                :label="$lang.conflictState || 'Blocks its slot'"
                :value="session?.state === 1 ? $lang.yes || 'Yes' : $lang.no || 'No'" />
        </template>
    </DetailPage>
</template>
