<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getCourse } from '@/modules/masterData/services/courseService';
import { fetchOfferings } from '@/modules/offerings/services/offeringService';

import Badge from '@/components/common/Badge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import BookIcon from '@/assets/icons/BookIcon.vue';
import { STATUS_LIGHT } from '@/config/appConfig';
import type { Offering } from '@/modules/offerings/types/offering';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: course, isLoading, notFound, load } = useDetailResource(getCourse);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('courses', 'Courses'), to: '/courses' },
    { label: course.value?.title ?? '' }
]);

const offeringColumns = computed(() => [
    {
        key: 'semester',
        label: customizeLanguageData('semester', 'Semester'),
        format: (row: Offering) => row.semester?.name
    },
    {
        key: 'section',
        label: customizeLanguageData('section', 'Cohort'),
        format: (row: Offering) => row.section?.name ?? row.program?.name
    },
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

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="BookIcon"
        :title="course?.title ?? ''"
        :subtitle="[course?.code, course?.department?.name].filter(Boolean).join(' · ')"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.courseNotFound || 'Course not found'">
        <template #header-actions>
            <Badge
                v-if="course?.course_type"
                outlined
                :variant="STATUS_LIGHT"
                :style="{
                    color: course.course_type.color ?? undefined,
                    borderColor: course.course_type.color ?? undefined
                }"
                :label="course.course_type.name" />
            <BoolChip :value="!!course?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="course?.code" />
            <DetailField
                :label="$lang.department || 'Department'"
                :value="course?.department?.name" />
            <DetailField
                :label="$lang.creditHours || 'Credit hours'"
                :value="course?.credit_hours"
                numeric />
            <DetailField
                :label="$lang.contactHours || 'Contact hours'"
                :value="course?.contact_hours"
                numeric />
            <!-- The weekly load the class generator fans out into meetings. -->
            <DetailField
                :label="$lang.lectureHours || 'Lecture h/week'"
                :value="course?.lecture_hours_per_week"
                numeric />
            <DetailField
                :label="$lang.labHours || 'Lab h/week'"
                :value="course?.lab_hours_per_week"
                numeric />
            <DetailField
                :label="$lang.tutorialHours || 'Tutorial h/week'"
                :value="course?.tutorial_hours_per_week"
                numeric />
            <DetailField
                :label="$lang.sessionsPerWeek || 'Sessions / week'"
                :value="course?.sessions_per_week"
                numeric />
        </template>

        <p
            v-if="course?.description"
            class="text-text-secondary schedule-card border-border-default rounded-2xl border p-6 text-sm">
            {{ course.description }}
        </p>

        <DetailPanel
            v-if="course"
            :title="$lang.courseOfferings || 'Course Offerings'"
            :fetcher="() => fetchOfferings({ course_id: course!.id, limit: 50 })"
            :columns="offeringColumns"
            :empty-text="$lang.noOfferingsHere || 'This course has never been offered yet.'"
            to="/offerings"
            :see-all-label="$lang.seeAll || 'See all'" />
    </DetailPage>
</template>
