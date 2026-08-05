<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useCampus } from '@/modules/masterData/composables/useCampus';

import Badge from '@/components/common/Badge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import CampusFormDialog from '@/modules/masterData/components/Campus/CampusFormDialog.vue';

import MapPin from '@/assets/icons/MapPin.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Campus } from '@/modules/masterData/types/campus';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    campuses,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchCampuses,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveCampusForm
} = useCampus();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('campuses', 'Campuses') }]);

onMounted(() => {
    fetchCampuses();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="MapPin" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageCampuses || 'Manage Campuses' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageCampusesDesc ||
                        'Campuses are the root of the physical hierarchy — buildings and rooms hang off them.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="campuses"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :add-button-label="$lang.createCampus || 'Create Campus'"
                :search-placeholder="$lang.searchCampuses || 'Search campuses...'"
                :show-add-button="$can('createCampus')"
                :show-refresh="true"
                @refresh="fetchCampuses"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchCampuses({ page })"
                @update:limit="(value: number) => fetchCampuses({ perPage: value })">
                <template #cell-city="{ item }">
                    <span class="text-text-secondary">{{ (item as Campus).city || '—' }}</span>
                </template>

                <template #cell-buildings_count="{ item }">
                    <span
                        class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ (item as Campus).buildings_count ?? 0 }}
                    </span>
                </template>

                <template #cell-is_main="{ item }">
                    <BoolChip :value="(item as Campus).is_main" />
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Campus).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="(item as Campus).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Campus)" />
                </template>
            </MainTable>
        </div>

        <CampusFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveCampusForm" />

        <ConfirmDialog
            v-model:show="confirmState.show"
            :title="confirmState.title"
            :message="confirmState.message"
            :item-label="confirmState.itemLabel"
            :item-name="confirmState.itemName"
            :item-names="confirmState.itemNames"
            :status-transition="confirmState.statusTransition"
            :confirm-label="confirmState.confirmLabel"
            :cancel-label="$lang.cancel"
            :type="confirmState.type"
            :loading="confirmState.loading"
            @confirm="confirmState.onConfirm" />
    </div>
</template>
