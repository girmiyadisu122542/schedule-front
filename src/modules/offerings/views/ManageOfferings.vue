<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useOffering } from '@/modules/offerings/composables/useOffering';
import { OFFERING_LOOKUP_TYPE } from '@/modules/offerings/constants/offeringStatus';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ChangeStatusModal from '@/components/common/ChangeStatusModal.vue';
import OfferingFormDialog from '@/modules/offerings/components/OfferingFormDialog.vue';

import FileText from '@/assets/icons/FileText.vue';
import { STATUS_LIGHT } from '@/config/appConfig';
import type { Offering } from '@/modules/offerings/types/offering';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    offerings,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchOfferings,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveOfferingForm,

    statusFlow,
    statusOptions,
    statusModalVisible,
    statusModalAnchor,
    statusTarget,
    applyStatusChange
} = useOffering();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('courseOfferings', 'Course Offerings') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const statusChip = (offering: Offering) => statusFlow.resolve(offering.status_code);

onMounted(() => {
    fetchOfferings();
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
                :icon="FileText" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageOfferings || 'Course Offerings' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageOfferingsDesc ||
                        'The pivot of the system. An offering is drafted, submitted, then approved by committee, department, college and registrar before it can be scheduled.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="offerings"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchOfferings || 'Search by course code or title...'"
                :show-add-button="$can('createCourseOffering')"
                :show-refresh="true"
                @refresh="fetchOfferings"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchOfferings({ page })"
                @update:limit="(value: number) => fetchOfferings({ perPage: value })">
                <template #cell-course="{ item }">
                    <div class="flex flex-col">
                        <span class="text-text-primary font-medium">{{ (item as Offering).course?.code }}</span>
                        <span class="text-text-tertiary text-xs">{{ (item as Offering).course?.name }}</span>
                    </div>
                </template>

                <template #cell-section="{ item }">
                    <span class="text-text-secondary">
                        {{ (item as Offering).section?.name || (item as Offering).program?.name || '—' }}
                    </span>
                </template>

                <template #cell-instructor="{ item }">
                    <span class="text-text-secondary">{{ (item as Offering).instructor?.name || '—' }}</span>
                </template>

                <template #cell-semester="{ item }">
                    <span class="text-text-secondary">{{ (item as Offering).semester?.name || '—' }}</span>
                </template>

                <template #cell-expected_students="{ item }">
                    <span
                        class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ (item as Offering).expected_students }}
                    </span>
                </template>

                <template #cell-status_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: statusChip(item as Offering)?.color ?? undefined,
                            borderColor: statusChip(item as Offering)?.color ?? undefined
                        }"
                        :label="statusChip(item as Offering)?.name || (item as Offering).status?.name || '—'" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Offering)" />
                </template>
            </MainTable>
        </div>

        <OfferingFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveOfferingForm" />

        <!--
            The popover greys out every status the seeded lookup_transitions do
            not allow from the current one; the backend re-checks the same edge.
        -->
        <ChangeStatusModal
            v-model:visible="statusModalVisible"
            :statuses="statusOptions"
            :rect="statusModalAnchor"
            :current="statusTarget?.status_code ?? null"
            :type-code="OFFERING_LOOKUP_TYPE"
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
