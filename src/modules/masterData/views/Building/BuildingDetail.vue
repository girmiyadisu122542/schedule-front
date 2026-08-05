<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useDetailResource } from '@/composables/useDetailResource';
import { getBuilding } from '@/modules/masterData/services/buildingService';
import { fetchRooms } from '@/modules/masterData/services/roomService';

import BoolChip from '@/components/common/BoolChip.vue';
import DetailPage from '@/components/common/DetailPage.vue';
import DetailField from '@/components/common/DetailField.vue';
import DetailPanel from '@/components/common/DetailPanel.vue';

import ModernBuilding from '@/assets/icons/ModernBuilding.vue';
import type { Room } from '@/modules/masterData/types/room';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const { item: building, isLoading, notFound, load } = useDetailResource(getBuilding);

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('buildings', 'Buildings'), to: '/buildings' },
    { label: building.value?.name ?? '' }
]);

const roomColumns = computed(() => [
    { key: 'code', label: customizeLanguageData('code', 'Code') },
    { key: 'name', label: customizeLanguageData('name', 'Name') },
    { key: 'capacity', label: customizeLanguageData('capacity', 'Capacity'), numeric: true },
    { key: 'exam_capacity', label: customizeLanguageData('examCapacity', 'Exam capacity'), numeric: true },
    {
        key: 'is_exam_venue',
        label: customizeLanguageData('examVenue', 'Exam venue'),
        format: (row: Room) =>
            row.is_exam_venue ? customizeLanguageData('yes', 'Yes') : customizeLanguageData('no', 'No')
    }
]);

onMounted(() => load(String(route.params.uuid)));
</script>

<template>
    <DetailPage
        :breadcrumb-items="breadcrumbItems"
        :icon="ModernBuilding"
        :title="building?.name ?? ''"
        :subtitle="building?.campus?.name ?? ''"
        :is-loading="isLoading"
        :not-found="notFound"
        :not-found-title="$lang.buildingNotFound || 'Building not found'">
        <template #header-actions>
            <BoolChip :value="!!building?.is_active" />
        </template>

        <template #fields>
            <DetailField
                :label="$lang.code || 'Code'"
                :value="building?.code" />
            <DetailField
                :label="$lang.campus || 'Campus'"
                :value="building?.campus?.name" />
            <DetailField
                :label="$lang.floors || 'Floors'"
                :value="building?.floors"
                numeric />
            <DetailField
                :label="$lang.createdBy || 'Created by'"
                :value="building?.created_by?.full_name" />
        </template>

        <DetailPanel
            v-if="building"
            :title="$lang.rooms || 'Rooms'"
            :fetcher="() => fetchRooms({ building_id: building!.id, limit: 50 })"
            :columns="roomColumns"
            :empty-text="$lang.noRoomsHere || 'No rooms in this building yet.'"
            to="/rooms"
            :see-all-label="$lang.seeAll || 'See all'" />
    </DetailPage>
</template>
