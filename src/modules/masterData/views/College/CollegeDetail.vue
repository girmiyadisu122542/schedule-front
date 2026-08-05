<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getCollege } from '@/modules/masterData/services/collegeService';
import { fetchDepartments } from '@/modules/masterData/services/departmentService';

import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import BuildingCityIcon from '@/assets/icons/BuildingCityIcon.vue';
import type { Department } from '@/modules/masterData/types/department';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: college, isLoading, notFound, load } = useDetailResource(getCollege);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('colleges', 'Colleges'), to: '/colleges' },
    { label: college.value?.name ?? '' }
]);

const departmentColumns = computed(() => [
    { key: 'code', label: customizeLanguageData('code', 'Code') },
    { key: 'name', label: customizeLanguageData('name', 'Name') },
    {
        key: 'head',
        label: customizeLanguageData('departmentHead', 'Head'),
        format: (row: Department) => row.head?.full_name
    },
    {
        key: 'is_active',
        label: customizeLanguageData('state', 'State'),
        format: (row: Department) =>
            row.is_active ? customizeLanguageData('active', 'Active') : customizeLanguageData('inactive', 'Inactive')
    }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="BuildingCityIcon"
        :title="college?.name ?? ''"
        :subtitle="college?.dean?.full_name ? `${$lang.dean || 'Dean'}: ${college.dean.full_name}` : ''"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.collegeNotFound || 'College not found'">
        <template #header-actions>
            <BoolChip :value="!!college?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="college?.code" />
            <DetailField
                :label="$lang.dean || 'Dean'"
                :value="college?.dean?.full_name" />
            <DetailField
                :label="$lang.departments || 'Departments'"
                :value="college?.departments_count"
                numeric />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="college?.created_by?.full_name" />
        </template>

        <DetailPanel
            v-if="college"
            :title="$lang.departments || 'Departments'"
            :fetcher="() => fetchDepartments({ college_id: college!.id, limit: 50 })"
            :columns="departmentColumns"
            :empty-text="$lang.noDepartmentsHere || 'No departments in this college yet.'"
            to="/departments"
            :see-all-label="$lang.seeAll || 'See all'" />
    </DetailPage>
</template>
