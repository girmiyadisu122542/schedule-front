<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getProgram } from '@/modules/masterData/services/programService';
import { fetchSections } from '@/modules/masterData/services/sectionService';

import StatusBadge from '@/components/common/StatusBadge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import BookIcon from '@/assets/icons/BookIcon.vue';

import type { Section } from '@/modules/masterData/types/section';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: program, isLoading, notFound, load } = useDetailResource(getProgram);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('programs', 'Programs'), to: '/programs' },
    { label: program.value?.name ?? '' }
]);

const sectionColumns = computed(() => [
    { key: 'name', label: customizeLanguageData('section', 'Section') },
    { key: 'year_level', label: customizeLanguageData('yearLevel', 'Year'), numeric: true },
    {
        key: 'academic_year',
        label: customizeLanguageData('academicYear', 'Academic year'),
        format: (row: Section) => row.academic_year?.name
    },
    { key: 'expected_students', label: customizeLanguageData('expectedStudents', 'Students'), numeric: true }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="BookIcon"
        :title="program?.name ?? ''"
        :subtitle="program?.department?.name ?? ''"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.programNotFound || 'Program not found'">
        <template #header-actions>
            <!-- Label and colour both come from the lookup value. -->
            <StatusBadge
                v-if="program?.degree_level"
                :value="program.degree_level" />
            <BoolChip :value="!!program?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="program?.code" />
            <DetailField
                :label="$lang.department || 'Department'"
                :value="program?.department?.name" />
            <DetailField
                :label="$lang.degreeLevel || 'Degree level'"
                :value="program?.degree_level?.name" />
            <DetailField
                :label="$lang.durationYears || 'Duration (years)'"
                :value="program?.duration_years"
                numeric />
        </template>

        <DetailPanel
            v-if="program"
            :title="$lang.sections || 'Sections'"
            :fetcher="() => fetchSections({ program_id: program!.id, limit: 50 })"
            :columns="sectionColumns"
            :empty-text="$lang.noSectionsHere || 'No sections on this program yet.'"
            to="/sections"
            :see-all-label="$lang.seeAll || 'See all'" />
    </DetailPage>
</template>
