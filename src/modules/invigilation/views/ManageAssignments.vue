<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentSemester } from '@/composables/useCurrentSemester';
import { useInvigilatorExport } from '@/modules/invigilation/composables/useInvigilatorExport';
import { useAssignment } from '@/modules/invigilation/composables/useAssignment';
import { useDropdownOptions } from '@/composables/useDropdownOptions';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import ScheduleExportMenu from '@/modules/scheduling/components/ScheduleExportMenu.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainDialog from '@/components/common/MainDialog.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import TextArea from '@/components/common/TextArea.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';

import ShieldCheckAltIcon from '@/assets/icons/ShieldCheckAltIcon.vue';
import { DROPDOWN_PARAM_KEY, STATUS_LIGHT, STATUS_WARNING } from '@/config/appConfig';
import type { Assignment } from '@/modules/invigilation/types/assignment';
import type { DropdownOption } from '@/types/CommonTypes';

const { customizeLanguageData } = useLanguageStore();
const currentSemester = useCurrentSemester();
const {
    isLoading,
    isSavingAction,
    assignments,
    tableColumns,
    filterFields,
    statuses,
    roles,
    semesterDropdown,
    examScheduleDropdown,
    fetchAllForExport,
    lastRun,
    statusChip,
    fetchAssignments,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    autoAssign,

    replaceDialogVisible,
    replaceTarget,
    replaceInstructorId,
    replaceRemark,
    submitReplacement
} = useAssignment();

const semesterId = ref<number | null>(null);
// Only someone able to invigilate can take over a duty; the backend refuses the
// rest, so do not offer them.
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    can_invigilate: true
});

/**
 * The duty roster export — what an examinations office pins up: who is on
 * duty, where and when, grouped by sitting.
 *
 * It honours the filter bar, so narrowing to one exam produces that exam's
 * duty sheet. It exports every matching duty rather than the visible page: a
 * roster printed from page 1 of 4 looks complete and is not.
 */
const { isExporting, exportRoster } = useInvigilatorExport(() => currentSemester.semester.value?.name);

const runExport = async (format: string) => exportRoster(format, await fetchAllForExport());

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('invigilatorAssignments', 'Duty Roster') }]);

const canAutoAssign = computed(() => !!semesterId.value && !isSavingAction.value);

const runAutoAssign = async () => {
    if (!semesterId.value) return;

    await autoAssign(semesterId.value);
};

onMounted(() => {
    fetchAssignments();
    // useLookupValues auto-fetches from its own onMounted, which never fires
    // inside a shared composable — pull the status catalogue explicitly.
    statuses.refetch();
    // Shared composables never fire their own onMounted — pull the filter
    // catalogues explicitly, same reason as the statuses above.
    roles.refetch();
    semesterDropdown.fetchOptions();
    examScheduleDropdown.fetchOptions();
    instructorDropdown.fetchOptions();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="ShieldCheckAltIcon" />
        </div>

        <div>
            <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 class="text-text-primary text-xl font-semibold">
                        {{ $lang.invigilatorAssignments || 'Duty Roster' }}
                    </h1>
                    <p class="text-md text-text-tertiary font-normal">
                        {{
                            $lang.assignmentsDesc ||
                            'Who is on duty at each exam. Declining frees the invigilator’s window; the record of the decline stays.'
                        }}
                    </p>
                </div>

                <!-- The duty sheet an examinations office pins up. -->
                <ScheduleExportMenu
                    :loading="isExporting"
                    @export="runExport" />
            </div>

            <!-- ---- staff a whole semester ---- -->
            <section
                v-if="$can('assignInvigilator')"
                class="schedule-card border-border-default mb-6 space-y-4 rounded-2xl border p-6">
                <div class="flex flex-wrap items-end justify-between gap-4">
                    <div class="min-w-0">
                        <h2 class="text-text-primary text-base font-semibold">
                            {{ $lang.autoAssign || 'Staff the exam period' }}
                        </h2>
                        <p class="text-text-tertiary mt-1 text-sm">
                            {{
                                $lang.autoAssignHint ||
                                'Every exam is filled from the windows the department offered, fewest duties first. Double-booking is refused by the database.'
                            }}
                        </p>
                    </div>

                    <div class="flex flex-wrap items-end gap-3">
                        <MainSelect
                            v-model="semesterId"
                            class="min-w-56"
                            :label-text="$lang.semester || 'Semester'"
                            :options="semesterDropdown.options.value"
                            option-label="name"
                            option-value="id"
                            :placeholder="$lang.selectSemester || 'Select a semester'"
                            size="normal"
                            search
                            show-refresh
                            :loading="semesterDropdown.loading.value"
                            @refresh="semesterDropdown.fetchOptions(true)" />
                        <MainButton
                            severity="primary"
                            :label="$lang.runAutoAssign || 'Assign'"
                            :loading="isSavingAction"
                            :disabled="!canAutoAssign"
                            @click="runAutoAssign" />
                    </div>
                </div>

                <div
                    v-if="lastRun"
                    class="border-border-subtle space-y-3 border-t pt-4">
                    <p class="text-text-secondary text-sm">
                        {{ lastRun.assigned }} {{ $lang.dutiesAssigned || 'duties assigned' }}
                    </p>

                    <!--
                        Sittings still short are the point of the run: they are
                        the work a human has to finish, so they are listed rather
                        than buried in the roster.
                    -->
                    <div
                        v-if="lastRun.short.length"
                        class="space-y-2">
                        <h3 class="text-text-primary text-sm font-semibold">
                            {{ $lang.stillShort || 'Still short of invigilators' }}
                        </h3>
                        <ul class="space-y-1">
                            <li
                                v-for="item in lastRun.short"
                                :key="item.exam_schedule_id"
                                class="border-border-subtle flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                                <span class="text-text-secondary min-w-0 text-sm">{{ item.label }}</span>
                                <Badge
                                    :variant="STATUS_WARNING"
                                    :label="`${item.on_duty}/${item.required}`" />
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <MainTable
                :columns="tableColumns"
                :items="assignments"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchDuties || 'Search by invigilator or course code...'"
                :show-add-button="false"
                :show-refresh="true"
                @refresh="fetchAssignments"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchAssignments({ page })"
                @update:limit="(value: number) => fetchAssignments({ perPage: value })">
                <template #cell-exam_schedule="{ item }">
                    <span class="text-text-primary font-medium">
                        {{ (item as Assignment).exam_schedule?.name || '—' }}
                    </span>
                </template>

                <template #cell-instructor="{ item }">
                    <div class="flex flex-col">
                        <span class="text-text-primary font-medium">
                            {{ (item as Assignment).instructor?.name || '—' }}
                        </span>
                        <span class="text-text-tertiary text-xs">
                            {{ (item as Assignment).instructor?.employee_no }}
                        </span>
                    </div>
                </template>

                <template #cell-role_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: (item as Assignment).role?.color ?? undefined,
                            borderColor: (item as Assignment).role?.color ?? undefined
                        }"
                        :label="(item as Assignment).role?.name || (item as Assignment).role_code || '—'" />
                </template>

                <template #cell-exam_date="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as Assignment).exam_date }}</span>
                </template>

                <template #cell-time_range="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as Assignment).time_range }}</span>
                </template>

                <template #cell-status_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: statusChip(item as Assignment)?.color ?? undefined,
                            borderColor: statusChip(item as Assignment)?.color ?? undefined
                        }"
                        :label="statusChip(item as Assignment)?.name || (item as Assignment).status?.name || '—'" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Assignment)" />
                </template>
            </MainTable>
        </div>

        <MainDialog
            v-model:visible="replaceDialogVisible"
            :header="$lang.replaceInvigilatorAction || 'Replace invigilator'"
            max-width="max-w-xl">
            <div class="mx-4 space-y-4 py-1">
                <p class="text-text-secondary text-sm">{{ replaceTarget?.name }}</p>
                <MainSelect
                    v-model="replaceInstructorId"
                    :label-text="$lang.replacementInvigilator || 'Who takes over'"
                    :options="instructorDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.selectInstructor || 'Select an instructor'"
                    size="normal"
                    is-required
                    search
                    show-refresh
                    :loading="instructorDropdown.loading.value"
                    @refresh="instructorDropdown.fetchOptions(true)" />
                <TextArea
                    v-model="replaceRemark"
                    :label="$lang.remark || 'Remark'"
                    :rows="3"
                    :placeholder="$lang.enterReplacementRemark || 'Why the swap is happening'" />
            </div>

            <template #footer>
                <div class="mx-2 flex items-center justify-end gap-3">
                    <MainButton
                        outlined
                        :label="$lang.cancel || 'Cancel'"
                        @click="replaceDialogVisible = false" />
                    <MainButton
                        severity="primary"
                        :label="$lang.replaceInvigilatorAction || 'Replace invigilator'"
                        :loading="isSavingAction"
                        @click="submitReplacement" />
                </div>
            </template>
        </MainDialog>
    </div>
</template>
