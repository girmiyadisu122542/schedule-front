<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useExamSchedule } from '@/modules/scheduling/composables/useExamSchedule';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import TextArea from '@/components/common/TextArea.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ExamScheduleFormDialog from '@/modules/scheduling/components/ExamScheduleFormDialog.vue';
import GenerationRunPanel from '@/modules/scheduling/components/GenerationRunPanel.vue';

import CalendarCheckIcon from '@/assets/icons/CalendarCheckIcon.vue';
import { STATUS_LIGHT } from '@/config/appConfig';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    exams,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchExams,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveExamForm,

    statusFlow,
    isSavingAction,
    confirmDialogVisible,
    confirmTarget,
    confirmRemark,
    submitConfirmation
} = useExamSchedule();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('examSchedules', 'Exam Timetable') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const statusChip = (schedule: ExamSchedule) => statusFlow.resolve(schedule.status_code);

/** The generator just wrote sittings; show that semester's calendar. */
const onGenerated = (semesterId: number) => {
    handleFilterChange({ semester_id: semesterId });
};

onMounted(() => {
    fetchExams();
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
                :icon="CalendarCheckIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.examSchedules || 'Exam Timetable' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.examSchedulesDesc ||
                        'One row per exam sitting. A sitting can go straight to publication, or via the department for confirmation first.'
                    }}
                </p>
            </div>

            <GenerationRunPanel
                v-if="$can('runExamScheduleGeneration')"
                class="mb-6"
                mode="exam"
                :title="$lang.generateExamTimetable || 'Generate the exam timetable'"
                :hint="
                    $lang.generateExamTimetableHint ||
                    'Every registrar-approved offering gets a sitting in a free hall and window. Halls are judged on exam capacity, and clashes are refused by the database.'
                "
                @generated="onGenerated" />

            <MainTable
                :columns="tableColumns"
                :items="exams"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchSittings || 'Search by course code, title or hall...'"
                :show-add-button="$can('createExamSchedule')"
                :show-refresh="true"
                @refresh="fetchExams"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchExams({ page })"
                @update:limit="(value: number) => fetchExams({ perPage: value })">
                <template #cell-course_offering="{ item }">
                    <span class="text-text-primary font-medium">
                        {{ (item as ExamSchedule).course_offering?.name || '—' }}
                    </span>
                </template>

                <template #cell-exam_type_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: (item as ExamSchedule).exam_type?.color ?? undefined,
                            borderColor: (item as ExamSchedule).exam_type?.color ?? undefined
                        }"
                        :label="
                            (item as ExamSchedule).exam_type?.name || (item as ExamSchedule).exam_type_code || '—'
                        " />
                </template>

                <template #cell-exam_date="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as ExamSchedule).exam_date }}</span>
                </template>

                <template #cell-time_range="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as ExamSchedule).time_range }}</span>
                </template>

                <template #cell-room="{ item }">
                    <span class="text-text-secondary">{{ (item as ExamSchedule).room?.name || '—' }}</span>
                </template>

                <template #cell-required_invigilators="{ item }">
                    <span
                        class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ (item as ExamSchedule).required_invigilators }}
                    </span>
                </template>

                <template #cell-status_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: statusChip(item as ExamSchedule)?.color ?? undefined,
                            borderColor: statusChip(item as ExamSchedule)?.color ?? undefined
                        }"
                        :label="statusChip(item as ExamSchedule)?.name || (item as ExamSchedule).status?.name || '—'" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as ExamSchedule)" />
                </template>
            </MainTable>
        </div>

        <ExamScheduleFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveExamForm" />

        <!--
            The department's own decision carries a remark; asking for it does
            not, so only this half gets a dialog.
        -->
        <MainDialog
            v-model:visible="confirmDialogVisible"
            :header="$lang.confirmSitting || 'Confirm sitting'"
            max-width="max-w-xl">
            <div class="mx-4 space-y-4 py-1">
                <p class="text-text-secondary text-sm">{{ confirmTarget?.name }}</p>
                <TextArea
                    v-model="confirmRemark"
                    :label="$lang.confirmationRemark || 'Confirmation remark'"
                    :rows="3"
                    :placeholder="$lang.enterConfirmationRemark || 'Optional note on what was agreed'" />
            </div>

            <template #footer>
                <div class="mx-2 flex items-center justify-end gap-3">
                    <MainButton
                        outlined
                        :label="$lang.cancel || 'Cancel'"
                        @click="confirmDialogVisible = false" />
                    <MainButton
                        severity="primary"
                        :label="$lang.confirmSitting || 'Confirm sitting'"
                        :loading="isSavingAction"
                        @click="submitConfirmation" />
                </div>
            </template>
        </MainDialog>

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
