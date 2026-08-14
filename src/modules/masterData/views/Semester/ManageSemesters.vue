<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useSemester } from '@/modules/masterData/composables/useSemester';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';

import StatusBadge from '@/components/common/StatusBadge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ChangeStatusModal from '@/components/common/ChangeStatusModal.vue';
import SemesterFormDialog from '@/modules/masterData/components/Semester/SemesterFormDialog.vue';

import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';

import type { Semester } from '@/modules/masterData/types/semester';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    semesters,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchSemesters,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveSemesterForm,

    statusFlow,
    statusOptions,
    statusModalVisible,
    statusModalAnchor,
    statusTarget,
    applyStatusChange
} = useSemester();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('semesters', 'Semesters') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const statusChip = (semester: Semester) => statusFlow.resolve(semester.status_code);

onMounted(() => {
    fetchSemesters();
    // useStatusFlow lives inside a shared composable, so its auto-fetch never
    // fires — pull the status catalogue and transition edges explicitly.
    statusFlow.refetch();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="ClockTimeTimerArrow" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageSemesters || 'Manage Semesters' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageSemestersDesc ||
                        'The scheduling unit. A semester moves planning → scheduling → active → closed, and only along those steps.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="semesters"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchSemesters || 'Search semesters...'"
                :show-add-button="$can('createSemester')"
                :show-refresh="true"
                @refresh="fetchSemesters"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchSemesters({ page })"
                @update:limit="(value: number) => fetchSemesters({ perPage: value })">
                <template #cell-academic_year="{ item }">
                    <span class="text-text-secondary">{{ (item as Semester).academic_year?.code || '—' }}</span>
                </template>

                <template #cell-term="{ item }">
                    <span class="text-text-secondary">{{ (item as Semester).term }}</span>
                </template>

                <template #cell-is_current="{ item }">
                    <BoolChip :value="(item as Semester).is_current" />
                </template>

                <template #cell-status_code="{ item }">
                    <StatusBadge
                        :value="statusChip(item as Semester)"
                        :fallback="(item as Semester).status?.name" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Semester)" />
                </template>
            </MainTable>
        </div>

        <SemesterFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveSemesterForm" />

        <!--
            The popover is a state machine: it greys out every status the seeded
            lookup_transitions do not allow from the current one. The backend
            re-checks the same edge, so a stale UI still cannot skip a step.
        -->
        <ChangeStatusModal
            v-model:visible="statusModalVisible"
            :statuses="statusOptions"
            :rect="statusModalAnchor"
            :current="statusTarget?.status_code ?? null"
            :type-code="LOOKUP_TYPE.SEMESTER_STATUS"
            :item-label="statusTarget?.name ?? null"
            @change="applyStatusChange" />

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
