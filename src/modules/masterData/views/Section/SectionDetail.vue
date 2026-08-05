<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getSection } from '@/modules/masterData/services/sectionService';
import { fetchOfferings } from '@/modules/offerings/services/offeringService';
import { fetchClassSchedules } from '@/modules/scheduling/services/classScheduleService';

import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import BusinessChart from '@/assets/icons/BusinessChart.vue';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import type { Offering } from '@/modules/offerings/types/offering';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: section, isLoading, notFound, load } = useDetailResource(getSection);
const schedulingConstants = useSchedulingConstants();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('sections', 'Sections'), to: '/sections' },
    { label: section.value?.name ?? '' }
]);

const offeringColumns = computed(() => [
    { key: 'name', label: customizeLanguageData('courseOffering', 'Offering') },
    {
        key: 'instructor',
        label: customizeLanguageData('instructor', 'Instructor'),
        format: (row: Offering) => row.instructor?.name
    },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: Offering) => row.status?.name
    }
]);

/** The cohort's own weekly timetable — the thing a student actually wants. */
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
    },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: ClassSchedule) => row.status?.name
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
        :icon="BusinessChart"
        :title="section?.name ?? ''"
        :subtitle="[section?.program?.name, section?.academic_year?.name].filter(Boolean).join(' · ')"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.sectionNotFound || 'Section not found'">
        <template #header-actions>
            <BoolChip :value="!!section?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.program || 'Program'"
                :value="section?.program?.name" />
            <DetailField
                :label="$lang.academicYear || 'Academic year'"
                :value="section?.academic_year?.name" />
            <DetailField
                :label="$lang.yearLevel || 'Year level'"
                :value="section?.year_level"
                numeric />
            <DetailField
                :label="$lang.expectedStudents || 'Expected students'"
                :value="section?.expected_students"
                numeric />
        </template>

        <template v-if="section">
            <DetailPanel
                :title="$lang.classSchedules || 'Class Timetable'"
                :fetcher="() => fetchClassSchedules({ section_id: section!.id, limit: 100 })"
                :columns="meetingColumns"
                :empty-text="$lang.noMeetingsHere || 'This cohort has no meetings scheduled yet.'"
                to="/timetable"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                :title="$lang.courseOfferings || 'Course Offerings'"
                :fetcher="() => fetchOfferings({ section_id: section!.id, limit: 50 })"
                :columns="offeringColumns"
                :empty-text="$lang.noOfferingsHere || 'Nothing offered to this cohort yet.'"
                to="/offerings"
                :see-all-label="$lang.seeAll || 'See all'" />
        </template>
    </DetailPage>
</template>
