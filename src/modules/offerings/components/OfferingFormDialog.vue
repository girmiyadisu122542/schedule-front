<script setup lang="ts">
import { onMounted, watch } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import TextArea from '@/components/common/TextArea.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { OfferingForm } from '@/modules/offerings/types/offering';
import type { DropdownOption } from '@/types/CommonTypes';

const props = defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: OfferingForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });
const courseDropdown = useDropdownOptions<DropdownOption>('/courses', { [DROPDOWN_PARAM_KEY]: true });
const departmentDropdown = useDropdownOptions<DropdownOption>('/departments', { [DROPDOWN_PARAM_KEY]: true });
const programDropdown = useDropdownOptions<DropdownOption>('/programs', { [DROPDOWN_PARAM_KEY]: true });
const sectionDropdown = useDropdownOptions<DropdownOption>('/sections', { [DROPDOWN_PARAM_KEY]: true });
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    // Only someone marked as able to teach can be the proposed teacher; the
    // backend rejects the rest, so do not offer them.
    can_teach: true
});

/**
 * Picking a course names the owning department, which is the offering
 * department in every normal case — prefill it rather than making the user
 * repeat the answer. Only fills a blank, so a deliberate override survives.
 */
watch(
    () => props.form.course_id,
    (courseId) => {
        if (!courseId || props.form.department_id) return;

        const course = courseDropdown.options.value.find((option: DropdownOption) => option.id === courseId);
        if (course?.department_id) {
            props.form.department_id = course.department_id as number;
        }
    }
);

onMounted(() => {
    semesterDropdown.fetchOptions();
    courseDropdown.fetchOptions();
    departmentDropdown.fetchOptions();
    programDropdown.fetchOptions();
    sectionDropdown.fetchOptions();
    instructorDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editOffering || 'Edit Offering' : $lang.createOffering || 'Create Offering'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whatIsOffered || 'What Is Offered' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.semester_id"
                        :label-text="$lang.semester || 'Semester'"
                        :options="semesterDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectSemester || 'Select a semester'"
                        :invalid="!!errors.semester_id"
                        :message="errors.semester_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="semesterDropdown.loading.value"
                        @refresh="semesterDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.course_id"
                        :label-text="$lang.course || 'Course'"
                        :options="courseDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectCourse || 'Select a course'"
                        :invalid="!!errors.course_id"
                        :message="errors.course_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="courseDropdown.loading.value"
                        @refresh="courseDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.department_id"
                        :label-text="$lang.department || 'Offering department'"
                        :options="departmentDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectDepartment || 'Select a department'"
                        :invalid="!!errors.department_id"
                        :message="errors.department_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="departmentDropdown.loading.value"
                        @refresh="departmentDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.instructor_id"
                        :label-text="$lang.instructor || 'Proposed instructor'"
                        :options="instructorDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectInstructor || 'Optional at draft stage'"
                        :invalid="!!errors.instructor_id"
                        :message="errors.instructor_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        show-refresh
                        :loading="instructorDropdown.loading.value"
                        @refresh="instructorDropdown.fetchOptions(true)" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whoItIsFor || 'Who It Is For' }}
                </h3>
                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.offeringCohortHint ||
                        'Name a section for a single cohort, or just a program for a whole-year lecture. One of the two is required to submit.'
                    }}
                </p>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.section_id"
                        :label-text="$lang.section || 'Section'"
                        :options="sectionDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectSection || 'Select a cohort'"
                        :invalid="!!errors.section_id"
                        :message="errors.section_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        show-refresh
                        :loading="sectionDropdown.loading.value"
                        @refresh="sectionDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.program_id"
                        :label-text="$lang.program || 'Program'"
                        :options="programDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectProgram || 'Optional'"
                        :invalid="!!errors.program_id"
                        :message="errors.program_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        show-refresh
                        :loading="programDropdown.loading.value"
                        @refresh="programDropdown.fetchOptions(true)" />
                    <InputText
                        v-model="form.expected_students"
                        :label="$lang.expectedStudents || 'Expected students'"
                        :placeholder="$lang.enterExpectedStudents || 'e.g. 45'"
                        :invalid="!!errors.expected_students"
                        :message="errors.expected_students"
                        message-type="error"
                        size="normal" />
                </div>

                <TextArea
                    v-model="form.remark"
                    :label="$lang.remark || 'Remark'"
                    :rows="3"
                    :placeholder="$lang.enterRemark || 'Optional note for the approval tiers'"
                    :invalid="!!errors.remark"
                    :message="errors.remark"
                    message-type="error" />
            </section>
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end gap-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    :label="isEditing ? $lang.saveChanges || 'Save Changes' : $lang.saveAsDraft || 'Save as draft'"
                    severity="primary"
                    :loading="isSaving"
                    @click="emit('save')" />
            </div>
        </template>
    </MainDialog>
</template>
