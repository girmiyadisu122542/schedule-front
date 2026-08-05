<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getCampus } from '@/modules/masterData/services/campusService';
import { fetchBuildings } from '@/modules/masterData/services/buildingService';

import Badge from '@/components/common/Badge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import BuildingCityIcon from '@/assets/icons/BuildingCityIcon.vue';
import { STATUS_SUCCESS } from '@/config/appConfig';
import type { Building } from '@/modules/masterData/types/building';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: campus, isLoading, notFound, load } = useDetailResource(getCampus);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('campuses', 'Campuses'), to: '/campuses' },
    { label: campus.value?.name ?? '' }
]);

const buildingColumns = computed(() => [
    { key: 'code', label: customizeLanguageData('code', 'Code') },
    { key: 'name', label: customizeLanguageData('name', 'Name') },
    { key: 'floors', label: customizeLanguageData('floors', 'Floors'), numeric: true },
    {
        key: 'is_active',
        label: customizeLanguageData('state', 'State'),
        format: (row: Building) =>
            row.is_active ? customizeLanguageData('active', 'Active') : customizeLanguageData('inactive', 'Inactive')
    }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="BuildingCityIcon"
        :title="campus?.name ?? ''"
        :subtitle="[campus?.city, campus?.address].filter(Boolean).join(' · ')"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.campusNotFound || 'Campus not found'">
        <template #header-actions>
            <!-- The partial unique index allows exactly one main campus. -->
            <Badge
                v-if="campus?.is_main"
                :variant="STATUS_SUCCESS"
                :label="$lang.mainCampus || 'Main campus'" />
            <BoolChip :value="!!campus?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="campus?.code" />
            <DetailField
                :label="$lang.city || 'City'"
                :value="campus?.city" />
            <DetailField
                :label="$lang.address || 'Address'"
                :value="campus?.address" />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="campus?.created_by?.full_name" />
        </template>

        <DetailPanel
            v-if="campus"
            :title="$lang.buildings || 'Buildings'"
            :fetcher="() => fetchBuildings({ campus_id: campus!.id, limit: 50 })"
            :columns="buildingColumns"
            :empty-text="$lang.noBuildingsHere || 'No buildings on this campus yet.'"
            to="/buildings"
            :see-all-label="$lang.seeAll || 'See all'" />
    </DetailPage>
</template>
