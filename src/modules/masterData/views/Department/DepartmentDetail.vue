<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getDepartment } from '@/modules/masterData/services/departmentService';
import { fetchPrograms } from '@/modules/masterData/services/programService';
import { fetchCourses } from '@/modules/masterData/services/courseService';
import { fetchInstructors } from '@/modules/masterData/services/instructorService';

import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import BuildingIcon from '@/assets/icons/BuildingIcon.vue';
import type { Program } from '@/modules/masterData/types/program';
import type { Course } from '@/modules/masterData/types/course';
import type { Instructor } from '@/modules/masterData/types/instructor';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: department, isLoading, notFound, load } = useDetailResource(getDepartment);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('departments', 'Departments'), to: '/departments' },
    { label: department.value?.name ?? '' }
]);

const programColumns = computed(() => [
    { key: 'code', label: customizeLanguageData('code', 'Code') },
    { key: 'name', label: customizeLanguageData('name', 'Name') },
    {
        key: 'degree_level',
        label: customizeLanguageData('degreeLevel', 'Degree level'),
        format: (row: Program) => row.degree_level?.name
    },
    { key: 'duration_years', label: customizeLanguageData('durationYears', 'Years'), numeric: true }
]);

const courseColumns = computed(() => [
    { key: 'code', label: customizeLanguageData('code', 'Code') },
    { key: 'title', label: customizeLanguageData('title', 'Title') },
    { key: 'credit_hours', label: customizeLanguageData('creditHours', 'Credits'), numeric: true },
    {
        key: 'course_type',
        label: customizeLanguageData('courseType', 'Type'),
        format: (row: Course) => row.course_type?.name
    }
]);

const instructorColumns = computed(() => [
    { key: 'employee_no', label: customizeLanguageData('employeeNo', 'Employee no') },
    { key: 'name', label: customizeLanguageData('name', 'Name') },
    {
        key: 'can_teach',
        label: customizeLanguageData('canTeach', 'Can teach'),
        format: (row: Instructor) =>
            row.can_teach ? customizeLanguageData('yes', 'Yes') : customizeLanguageData('no', 'No')
    },
    {
        key: 'can_invigilate',
        label: customizeLanguageData('canInvigilate', 'Can invigilate'),
        format: (row: Instructor) =>
            row.can_invigilate ? customizeLanguageData('yes', 'Yes') : customizeLanguageData('no', 'No')
    }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="BuildingIcon"
        :title="department?.name ?? ''"
        :subtitle="department?.college?.name ?? ''"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.departmentNotFound || 'Department not found'">
        <template #header-actions>
            <BoolChip :value="!!department?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="department?.code" />
            <DetailField
                :label="$lang.college || 'College'"
                :value="department?.college?.name" />
            <DetailField
                :label="$lang.departmentHead || 'Head'"
                :value="department?.head?.full_name" />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="department?.created_by?.full_name" />
        </template>

        <template v-if="department">
            <DetailPanel
                :title="$lang.programs || 'Programs'"
                :fetcher="() => fetchPrograms({ department_id: department!.id, limit: 50 })"
                :columns="programColumns"
                :empty-text="$lang.noProgramsHere || 'No programs in this department yet.'"
                to="/programs"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                :title="$lang.courses || 'Courses'"
                :fetcher="() => fetchCourses({ department_id: department!.id, limit: 50 })"
                :columns="courseColumns"
                :empty-text="$lang.noCoursesHere || 'No courses in this department yet.'"
                to="/courses"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                :title="$lang.instructors || 'Instructors'"
                :fetcher="() => fetchInstructors({ department_id: department!.id, limit: 50 })"
                :columns="instructorColumns"
                :empty-text="$lang.noInstructorsHere || 'No instructors in this department yet.'"
                to="/instructors"
                :see-all-label="$lang.seeAll || 'See all'" />
        </template>
    </DetailPage>
</template>
