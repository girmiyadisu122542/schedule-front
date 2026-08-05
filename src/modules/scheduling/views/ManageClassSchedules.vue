<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useClassSchedule } from '@/modules/scheduling/composables/useClassSchedule';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import InlineSelect from '@/components/common/InlineSelect.vue';
import TimePickerField from '@/components/common/TimePickerField.vue';
import ClassScheduleFormDialog from '@/modules/scheduling/components/ClassScheduleFormDialog.vue';
import GenerationRunPanel from '@/modules/scheduling/components/GenerationRunPanel.vue';

import Calendar from '@/assets/icons/Calendar.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY, STATUS_LIGHT } from '@/config/appConfig';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import type { DropdownOption } from '@/types/CommonTypes';

const { customizeLanguageData } = useLanguageStore();
const allowedRoutesStore = useAllowedRoutesStore();
const {
    isLoading,
    schedules,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchSchedules,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveScheduleForm,
    isEditable,
    saveInlineEdit,
    savingRowId,

    statusFlow,
    schedulingConstants
} = useClassSchedule();

/** Catalogues the inline room / instructor cells pick from. */
const roomDropdown = useDropdownOptions<DropdownOption>('/rooms', { [DROPDOWN_PARAM_KEY]: true });
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    can_teach: true
});

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('classSchedules', 'Class Timetable') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const statusChip = (schedule: ClassSchedule) => statusFlow.resolve(schedule.status_code);

/**
 * Whether this row's cells accept an edit right now: only drafts are editable,
 * and only when no save is already in flight for the row.
 */
const canEditInline = (schedule: ClassSchedule) =>
    isEditable(schedule) && allowedRoutesStore.can('updateClassSchedule') && savingRowId.value !== schedule.id;

/** The generator just wrote rows; show that semester's timetable. */
const onGenerated = (semesterId: number) => {
    handleFilterChange({ semester_id: semesterId });
};

onMounted(() => {
    fetchSchedules();
    // useStatusFlow lives inside a shared composable, so its auto-fetch never
    // fires — pull the status catalogue and transition edges explicitly.
    statusFlow.refetch();
    schedulingConstants.load();
    roomDropdown.fetchOptions();
    instructorDropdown.fetchOptions();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="Calendar" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.classSchedules || 'Class Timetable' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.classSchedulesDesc ||
                        'One row per weekly class meeting. Generate a draft timetable, adjust it, then publish — a published meeting is cancelled rather than deleted.'
                    }}
                </p>
            </div>

            <GenerationRunPanel
                v-if="$can('runClassScheduleGeneration')"
                class="mb-6"
                @generated="onGenerated" />

            <MainTable
                :columns="tableColumns"
                :items="schedules"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchSchedules || 'Search by course code, title or room...'"
                :show-add-button="$can('createClassSchedule')"
                :show-refresh="true"
                @refresh="fetchSchedules"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchSchedules({ page })"
                @update:limit="(value: number) => fetchSchedules({ perPage: value })">
                <template #cell-course_offering="{ item }">
                    <span class="text-text-primary font-medium">
                        {{ (item as ClassSchedule).course_offering?.name || '—' }}
                    </span>
                </template>

                <!--
                    Draft rows are edited in place. A published or cancelled row
                    renders no edit control at all — the backend refuses the
                    write, so offering it would only mislead.
                -->
                <template #cell-day_of_week="{ item }">
                    <InlineSelect
                        v-if="canEditInline(item as ClassSchedule)"
                        :model-value="(item as ClassSchedule).day_of_week"
                        :options="schedulingConstants.dayOptions.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectDay || 'Select a day'"
                        size="small"
                        @update:modelValue="
                            (value: unknown) => saveInlineEdit(item as ClassSchedule, { day_of_week: Number(value) })
                        " />
                    <span
                        v-else
                        class="text-text-secondary">
                        {{ schedulingConstants.dayName((item as ClassSchedule).day_of_week) }}
                    </span>
                </template>

                <template #cell-time_range="{ item }">
                    <div
                        v-if="canEditInline(item as ClassSchedule)"
                        class="flex items-center gap-1">
                        <TimePickerField
                            use24h
                            :minute-step="5"
                            :model-value="(item as ClassSchedule).start_time"
                            :placeholder="$lang.selectStartTime || '08:00'"
                            @update:modelValue="
                                (value: string) => saveInlineEdit(item as ClassSchedule, { start_time: value })
                            " />
                        <span class="text-text-tertiary">–</span>
                        <TimePickerField
                            use24h
                            :minute-step="5"
                            :model-value="(item as ClassSchedule).end_time"
                            :placeholder="$lang.selectEndTime || '09:30'"
                            @update:modelValue="
                                (value: string) => saveInlineEdit(item as ClassSchedule, { end_time: value })
                            " />
                    </div>
                    <span
                        v-else
                        class="text-text-secondary tabular-nums">
                        {{ (item as ClassSchedule).time_range }}
                    </span>
                </template>

                <template #cell-room="{ item }">
                    <InlineSelect
                        v-if="canEditInline(item as ClassSchedule)"
                        :model-value="(item as ClassSchedule).room_id"
                        :options="roomDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectRoom || 'Select a room'"
                        size="small"
                        search
                        show-clear
                        :loading="roomDropdown.loading.value"
                        @update:modelValue="
                            (value: unknown) =>
                                saveInlineEdit(item as ClassSchedule, {
                                    room_id: value === null ? null : Number(value)
                                })
                        " />
                    <span
                        v-else
                        class="text-text-secondary">
                        {{ (item as ClassSchedule).room?.name || '—' }}
                    </span>
                </template>

                <template #cell-instructor="{ item }">
                    <InlineSelect
                        v-if="canEditInline(item as ClassSchedule)"
                        :model-value="(item as ClassSchedule).instructor_id"
                        :options="instructorDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectInstructor || 'Select an instructor'"
                        size="small"
                        search
                        show-clear
                        :loading="instructorDropdown.loading.value"
                        @update:modelValue="
                            (value: unknown) =>
                                saveInlineEdit(item as ClassSchedule, {
                                    instructor_id: value === null ? null : Number(value)
                                })
                        " />
                    <span
                        v-else
                        class="text-text-secondary">
                        {{ (item as ClassSchedule).instructor?.name || '—' }}
                    </span>
                </template>

                <template #cell-session_type_code="{ item }">
                    <Badge
                        v-if="(item as ClassSchedule).session_type"
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: (item as ClassSchedule).session_type?.color ?? undefined,
                            borderColor: (item as ClassSchedule).session_type?.color ?? undefined
                        }"
                        :label="(item as ClassSchedule).session_type?.name ?? ''" />
                    <span v-else>—</span>
                </template>

                <template #cell-status_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: statusChip(item as ClassSchedule)?.color ?? undefined,
                            borderColor: statusChip(item as ClassSchedule)?.color ?? undefined
                        }"
                        :label="
                            statusChip(item as ClassSchedule)?.name || (item as ClassSchedule).status?.name || '—'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as ClassSchedule)" />
                </template>
            </MainTable>
        </div>

        <ClassScheduleFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveScheduleForm" />

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
