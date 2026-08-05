<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getAcademicYear } from '@/modules/masterData/services/academicYearService';
import { fetchSemesters } from '@/modules/masterData/services/semesterService';
import { fetchSections } from '@/modules/masterData/services/sectionService';

import Badge from '@/components/common/Badge.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import Calendar from '@/assets/icons/Calendar.vue';
import { STATUS_SUCCESS } from '@/config/appConfig';
import type { Semester } from '@/modules/masterData/types/semester';
import type { Section } from '@/modules/masterData/types/section';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: year, isLoading, notFound, load } = useDetailResource(getAcademicYear);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('academicYears', 'Academic Years'), to: '/academic-years' },
    { label: year.value?.name ?? '' }
]);

const semesterColumns = computed(() => [
    { key: 'name', label: customizeLanguageData('name', 'Name') },
    { key: 'term', label: customizeLanguageData('term', 'Term'), numeric: true },
    { key: 'start_date', label: customizeLanguageData('startDate', 'Start date'), numeric: true },
    { key: 'end_date', label: customizeLanguageData('endDate', 'End date'), numeric: true },
    {
        key: 'status',
        label: customizeLanguageData('status', 'Status'),
        format: (row: Semester) => row.status?.name
    }
]);

const sectionColumns = computed(() => [
    { key: 'name', label: customizeLanguageData('section', 'Section') },
    {
        key: 'program',
        label: customizeLanguageData('program', 'Program'),
        format: (row: Section) => row.program?.name
    },
    { key: 'year_level', label: customizeLanguageData('yearLevel', 'Year'), numeric: true },
    { key: 'expected_students', label: customizeLanguageData('expectedStudents', 'Students'), numeric: true }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="Calendar"
        :title="year?.name ?? ''"
        :subtitle="year ? `${year.start_date} – ${year.end_date}` : ''"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.academicYearNotFound || 'Academic year not found'">
        <template #header-actions>
            <!-- A period, not a record you retire — so no state chip here. -->
            <Badge
                v-if="year?.is_current"
                :variant="STATUS_SUCCESS"
                :label="$lang.currentYear || 'Current'" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="year?.code" />
            <DetailField
                :label="$lang.startDate || 'Start date'"
                :value="year?.start_date"
                numeric />
            <DetailField
                :label="$lang.endDate || 'End date'"
                :value="year?.end_date"
                numeric />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="year?.created_by?.full_name" />
        </template>

        <template v-if="year">
            <DetailPanel
                :title="$lang.semesters || 'Semesters'"
                :fetcher="() => fetchSemesters({ academic_year_id: year!.id, limit: 50 })"
                :columns="semesterColumns"
                :empty-text="$lang.noSemestersHere || 'No semesters in this year yet.'"
                to="/semesters"
                :see-all-label="$lang.seeAll || 'See all'" />

            <DetailPanel
                :title="$lang.sections || 'Sections'"
                :fetcher="() => fetchSections({ academic_year_id: year!.id, limit: 50 })"
                :columns="sectionColumns"
                :empty-text="$lang.noSectionsHere || 'No cohorts in this year yet.'"
                to="/sections"
                :see-all-label="$lang.seeAll || 'See all'" />
        </template>
    </DetailPage>
</template>
