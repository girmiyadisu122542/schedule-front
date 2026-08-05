<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useAvailability } from '@/modules/invigilation/composables/useAvailability';

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AvailabilityFormDialog from '@/modules/invigilation/components/AvailabilityFormDialog.vue';

import UserCheckIcon from '@/assets/icons/UserCheckIcon.vue';
import type { Availability } from '@/modules/invigilation/types/availability';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    availabilities,
    tableColumns,
    filterFields,
    dialogVisible,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchAvailabilities,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveAvailabilityForm
} = useAvailability();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('invigilatorAvailabilities', 'Invigilator Availability') }
]);

onMounted(() => {
    fetchAvailabilities();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="UserCheckIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.invigilatorAvailabilities || 'Invigilator Availability' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.availabilitiesDesc ||
                        'Windows the department offers on an instructor’s behalf. A window means available; leaving one out is how the department says no.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="availabilities"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchAvailabilities || 'Search by instructor name or employee number...'"
                :show-add-button="$can('submitInvigilatorAvailability')"
                :show-refresh="true"
                @refresh="fetchAvailabilities"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchAvailabilities({ page })"
                @update:limit="(value: number) => fetchAvailabilities({ perPage: value })">
                <template #cell-instructor="{ item }">
                    <div class="flex flex-col">
                        <span class="text-text-primary font-medium">
                            {{ (item as Availability).instructor?.name || '—' }}
                        </span>
                        <span class="text-text-tertiary text-xs">
                            {{ (item as Availability).instructor?.employee_no }}
                        </span>
                    </div>
                </template>

                <template #cell-available_date="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as Availability).available_date }}</span>
                </template>

                <template #cell-time_range="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as Availability).time_range }}</span>
                </template>

                <template #cell-semester="{ item }">
                    <span class="text-text-secondary">{{ (item as Availability).semester?.name || '—' }}</span>
                </template>

                <template #cell-submitted_by="{ item }">
                    <span class="text-text-secondary">{{ (item as Availability).submitted_by?.full_name || '—' }}</span>
                </template>

                <template #cell-remark="{ item }">
                    <span class="text-text-tertiary text-sm">{{ (item as Availability).remark || '—' }}</span>
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Availability)" />
                </template>
            </MainTable>
        </div>

        <AvailabilityFormDialog
            v-model:visible="dialogVisible"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveAvailabilityForm" />

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
