<script setup lang="ts">
import { onMounted } from 'vue';

import { useInvigilationRequest } from '@/modules/invigilation/composables/useInvigilationRequest';
import { useLookupValues } from '@/composables/useLookupValues';

import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import InputText from '@/components/common/InputText.vue';
import TextArea from '@/components/common/TextArea.vue';

import PlusIcon from '@/assets/icons/PlusIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';

/**
 * Raise or revise an ask for invigilators.
 *
 * The shape that matters is the department list: each row is a department AND
 * its own quantity, because asking Computer Science for ten and Accounting for
 * four is one request carrying two numbers. A single "how many" field would
 * make that impossible to express.
 */
defineProps<{ visible: boolean }>();

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

const {
    editForm,
    editErrors,
    isSavingEdit,
    isEditingDialog,
    semesterDropdown,
    departmentDropdown,
    addDepartmentRow,
    removeDepartmentRow,
    saveRequestForm
} = useInvigilationRequest();

/** The examination this ask covers — a semester plus one of these. */
const examTypes = useLookupValues(LOOKUP_TYPE.EXAM_TYPE);

onMounted(() => {
    semesterDropdown.fetchOptions();
    departmentDropdown.fetchOptions();
    examTypes.refetch();
});
</script>

<template>
    <MainDialog
        :visible="visible"
        :header="
            isEditingDialog
                ? $lang.editInvigilationRequest || 'Edit Invigilation Request'
                : $lang.createInvigilationRequest || 'Create Invigilation Request'
        "
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-5 py-1">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MainSelect
                    v-model="editForm.semester_id"
                    :label-text="$lang.semester || 'Semester'"
                    :options="semesterDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.selectSemester || 'Choose a semester'"
                    size="normal"
                    search
                    is-required
                    :invalid="!!editErrors.semester_id"
                    :message="editErrors.semester_id"
                    :loading="semesterDropdown.loading.value" />

                <MainSelect
                    v-model="editForm.exam_type_lookup_value_id"
                    :label-text="$lang.examType || 'Exam Type'"
                    :options="examTypes.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.selectExamType || 'Choose an exam type'"
                    size="normal"
                    is-required
                    :invalid="!!editErrors.exam_type_lookup_value_id"
                    :message="editErrors.exam_type_lookup_value_id"
                    :loading="examTypes.loading.value" />
            </div>

            <!-- ---- one row per department, each with its OWN quantity ---- -->
            <section>
                <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 class="text-text-primary text-sm font-semibold">
                            {{ $lang.departmentsAsked || 'Departments asked' }}
                        </h3>
                        <p class="text-text-tertiary text-xs">
                            {{
                                $lang.departmentsAskedHint ||
                                'Each department is asked for its own number — they need not be the same.'
                            }}
                        </p>
                    </div>

                    <MainButton
                        outlined
                        size="small"
                        :icon="PlusIcon"
                        :label="$lang.addDepartment || 'Add department'"
                        @click="addDepartmentRow" />
                </div>

                <p
                    v-if="editErrors.departments"
                    class="text-schedule-error-500 mb-2 text-xs">
                    {{ editErrors.departments }}
                </p>

                <div class="space-y-2">
                    <div
                        v-for="(row, index) in editForm.departments"
                        :key="index"
                        class="border-border-subtle flex flex-wrap items-end gap-3 rounded-xl border p-3">
                        <MainSelect
                            v-model="row.department_id"
                            class="min-w-56 flex-1"
                            :label-text="$lang.department || 'Department'"
                            :options="departmentDropdown.options.value"
                            option-label="name"
                            option-value="id"
                            :placeholder="$lang.selectDepartment || 'Choose a department'"
                            size="normal"
                            search
                            :loading="departmentDropdown.loading.value" />

                        <InputText
                            v-model="row.required_count"
                            type="number"
                            class="w-40"
                            :label="$lang.requiredInvigilators || 'Invigilators needed'"
                            placeholder="e.g. 4" />

                        <MainButton
                            outlined
                            outline-severity="danger"
                            size="small"
                            :icon="TrashIcon"
                            :disabled="editForm.departments.length <= 1"
                            :tooltip="$lang.removeDepartment || 'Remove'"
                            @click="removeDepartmentRow(index)" />
                    </div>
                </div>
            </section>

            <TextArea
                v-model="editForm.remark"
                :label="$lang.remark || 'Remark'"
                :rows="2"
                :placeholder="$lang.invigilationRequestRemarkHint || 'Anything the departments should know'" />
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end gap-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    severity="primary"
                    :label="$lang.save || 'Save'"
                    :loading="isSavingEdit"
                    @click="saveRequestForm" />
            </div>
        </template>
    </MainDialog>
</template>
