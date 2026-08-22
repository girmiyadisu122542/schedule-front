<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import TextArea from '@/components/common/TextArea.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { OfferingForm } from '@/modules/offerings/types/offering';
import type { DropdownOption } from '@/types/CommonTypes';

/**
 * Create / edit an offering, filled in the order the data actually depends on:
 *
 *     Semester → Department → Programme → Section
 *                          ↘ Course
 *                          ↘ Instructor
 *
 * Every level below the department is narrowed by it and disabled until it is
 * chosen. Before this the six dropdowns were fetched unfiltered, so a user could
 * pair a course from one department with a section from an unrelated programme
 * and only find out when the backend refused it — and the form worked BACKWARDS,
 * inferring the department from the course after the fact.
 */
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

const { customizeLanguageData } = useLanguageStore();

const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });
// `authorable` narrows this to the departments the signed-in user may file an
// offering for. A Committee Leader is bound to their own department, so the
// whole institution would be a list of choices the server refuses one by one.
// An unrestricted user (super admin, or anyone with `see:all:departments`)
// still sees everything — the server treats "unrestricted" as no narrowing.
const departmentDropdown = useDropdownOptions<DropdownOption>('/departments', {
    [DROPDOWN_PARAM_KEY]: true,
    authorable: true
});
const programDropdown = useDropdownOptions<DropdownOption>('/programs', { [DROPDOWN_PARAM_KEY]: true });
const sectionDropdown = useDropdownOptions<DropdownOption>('/sections', { [DROPDOWN_PARAM_KEY]: true });
const courseDropdown = useDropdownOptions<DropdownOption>('/courses', { [DROPDOWN_PARAM_KEY]: true });
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    // Only someone marked as able to teach can be the proposed teacher; the
    // backend rejects the rest, so do not offer them.
    can_teach: true
});

const hasDepartment = computed(() => !!props.form.department_id);
const hasProgram = computed(() => !!props.form.program_id);

/** "Select a department first" rather than an empty list with no explanation. */
const gatedPlaceholder = (isReady: boolean, ready: string, gate: string) =>
    isReady ? ready : customizeLanguageData('selectDepartmentFirst', gate);

/**
 * Narrowing is passed to `fetchOptions` rather than through
 * `useDropdownOptions`' reactive-params argument on purpose: that argument is
 * captured once, inside a per-endpoint singleton that outlives this component,
 * so after a remount the cascade would be driven by a scope already stopped.
 */
watch(
    () => props.form.department_id,
    (departmentId, previous) => {
        // Opening the edit dialog sets the department for the first time; that
        // must narrow the lists WITHOUT wiping the values being edited.
        if (previous !== undefined && previous !== null && departmentId !== previous) {
            props.form.program_id = null;
            props.form.section_id = null;
            props.form.course_id = null;
            props.form.instructor_id = null;
        }

        const narrow = departmentId ? { department_id: departmentId } : {};
        programDropdown.fetchOptions(true, narrow);
        courseDropdown.fetchOptions(true, narrow);
        instructorDropdown.fetchOptions(true, { ...narrow, can_teach: true });
    }
);

watch(
    () => props.form.program_id,
    (programId, previous) => {
        if (previous !== undefined && previous !== null && programId !== previous) {
            props.form.section_id = null;
        }

        sectionDropdown.fetchOptions(true, programId ? { program_id: programId } : {});
    }
);

onMounted(() => {
    semesterDropdown.fetchOptions();
    departmentDropdown.fetchOptions();

    // Honour whatever the form already carries — the edit dialog opens with a
    // department and programme already chosen.
    const narrow = props.form.department_id ? { department_id: props.form.department_id } : {};
    programDropdown.fetchOptions(true, narrow);
    courseDropdown.fetchOptions(true, narrow);
    instructorDropdown.fetchOptions(true, { ...narrow, can_teach: true });
    sectionDropdown.fetchOptions(true, props.form.program_id ? { program_id: props.form.program_id } : {});
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
                    {{ $lang.whoIsOffering || 'Who Is Offering' }}
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
                    <!-- First, and the gate for everything below it: the course,
                         the cohort and the teacher all belong to a department. -->
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
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whatIsOffered || 'What Is Offered' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.course_id"
                        :label-text="$lang.course || 'Course'"
                        :options="courseDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="
                            gatedPlaceholder(
                                hasDepartment,
                                $lang.selectCourse || 'Select a course',
                                'Select a department first'
                            )
                        "
                        :disabled="!hasDepartment"
                        :invalid="!!errors.course_id"
                        :message="errors.course_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        :loading="courseDropdown.loading.value" />
                    <MainSelect
                        v-model="form.instructor_id"
                        :label-text="$lang.instructor || 'Proposed instructor'"
                        :options="instructorDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="
                            gatedPlaceholder(
                                hasDepartment,
                                $lang.selectInstructor || 'Optional at draft stage',
                                'Select a department first'
                            )
                        "
                        :disabled="!hasDepartment"
                        :invalid="!!errors.instructor_id"
                        :message="errors.instructor_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        :loading="instructorDropdown.loading.value" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whoItIsFor || 'Who It Is For' }}
                </h3>
                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.offeringCohortHint ||
                        'Name a section for a single group, or just a program for a whole-year lecture. One of the two is required to submit.'
                    }}
                </p>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <!-- Programme before section: a section belongs to one. -->
                    <MainSelect
                        v-model="form.program_id"
                        :label-text="$lang.program || 'Program'"
                        :options="programDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="
                            gatedPlaceholder(
                                hasDepartment,
                                $lang.selectProgram || 'Optional',
                                'Select a department first'
                            )
                        "
                        :disabled="!hasDepartment"
                        :invalid="!!errors.program_id"
                        :message="errors.program_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        :loading="programDropdown.loading.value" />
                    <MainSelect
                        v-model="form.section_id"
                        :label-text="$lang.section || 'Section'"
                        :options="sectionDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="
                            hasProgram
                                ? $lang.selectSection || 'Select a section'
                                : $lang.selectProgramFirst || 'Select a program first'
                        "
                        :disabled="!hasProgram"
                        :invalid="!!errors.section_id"
                        :message="errors.section_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        :loading="sectionDropdown.loading.value" />
                    <!--
                        No "expected students" input: the number belongs to the
                        section, and the server now reads it from there. See
                        CourseOfferingService::buildAttributes().
                    -->
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
