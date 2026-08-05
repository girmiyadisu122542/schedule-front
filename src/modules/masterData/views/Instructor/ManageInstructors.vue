<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useInstructor } from '@/modules/masterData/composables/useInstructor';

import Badge from '@/components/common/Badge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import InstructorFormDialog from '@/modules/masterData/components/Instructor/InstructorFormDialog.vue';

import UserIcon from '@/assets/icons/UserIcon.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Instructor } from '@/modules/masterData/types/instructor';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    instructors,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchInstructors,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveInstructorForm
} = useInstructor();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('instructors', 'Instructors') }]);

onMounted(() => {
    fetchInstructors();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="UserIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageInstructors || 'Manage Instructors' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageInstructorsDesc ||
                        'Teachers and invigilators are one registry — two capability flags decide who can be assigned to what.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="instructors"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchInstructors || 'Search instructors...'"
                :show-add-button="$can('createInstructor')"
                :show-refresh="true"
                @refresh="fetchInstructors"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchInstructors({ page })"
                @update:limit="(value: number) => fetchInstructors({ perPage: value })">
                <template #cell-full_name="{ item }">
                    <div class="flex flex-col">
                        <span class="text-text-primary font-medium">{{ (item as Instructor).full_name }}</span>
                        <!-- The portal account is the person's login, when one exists. -->
                        <span
                            v-if="(item as Instructor).person"
                            class="text-text-tertiary text-xs">
                            {{ (item as Instructor).person?.email }}
                        </span>
                    </div>
                </template>

                <template #cell-department="{ item }">
                    <span class="text-text-secondary">{{ (item as Instructor).department?.name || '—' }}</span>
                </template>

                <template #cell-academic_rank="{ item }">
                    <span class="text-text-secondary">{{ (item as Instructor).academic_rank || '—' }}</span>
                </template>

                <template #cell-can_teach="{ item }">
                    <BoolChip :value="(item as Instructor).can_teach" />
                </template>

                <template #cell-can_invigilate="{ item }">
                    <BoolChip :value="(item as Instructor).can_invigilate" />
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Instructor).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="
                            (item as Instructor).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Instructor)" />
                </template>
            </MainTable>
        </div>

        <InstructorFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveInstructorForm" />

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
