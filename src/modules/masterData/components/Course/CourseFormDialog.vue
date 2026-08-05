<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import TextArea from '@/components/common/TextArea.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLookupValues } from '@/composables/useLookupValues';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';
import type { CourseForm } from '@/modules/masterData/types/course';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: CourseForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const departmentDropdown = useDropdownOptions<DropdownOption>('/departments', { [DROPDOWN_PARAM_KEY]: true });
const courseTypes = useLookupValues(LOOKUP_TYPE.COURSE_TYPE);

onMounted(() => {
    departmentDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editCourse || 'Edit Course' : $lang.createCourse || 'Create Course'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.courseInformation || 'Course Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.code"
                        :label="$lang.code || 'Code'"
                        :placeholder="$lang.enterCourseCode || 'e.g. CS101'"
                        :invalid="!!errors.code"
                        :message="errors.code"
                        message-type="error"
                        size="normal"
                        :helper-message="
                            $lang.courseCodeHint || 'Globally unique — it prints bare on timetables and exam papers.'
                        " />
                    <InputText
                        v-model="form.title"
                        :label="$lang.title || 'Title'"
                        :placeholder="$lang.enterCourseTitle || 'e.g. Introduction to Computer Science'"
                        :invalid="!!errors.title"
                        :message="errors.title"
                        message-type="error"
                        size="normal" />
                    <MainSelect
                        v-model="form.department_id"
                        :label-text="$lang.department || 'Owning department'"
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
                        v-model="form.course_type_lookup_value_id"
                        :label-text="$lang.courseType || 'Course type'"
                        :options="courseTypes.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectCourseType || 'Select a course type'"
                        :invalid="!!errors.course_type_lookup_value_id"
                        :message="errors.course_type_lookup_value_id"
                        message-type="error"
                        size="normal"
                        is-required
                        :loading="courseTypes.loading.value" />
                    <InputText
                        v-model="form.credit_hours"
                        :label="$lang.creditHours || 'Credit hours'"
                        :placeholder="$lang.enterCreditHours || 'e.g. 4'"
                        :invalid="!!errors.credit_hours"
                        :message="errors.credit_hours"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.contact_hours"
                        :label="$lang.contactHours || 'Contact hours'"
                        :placeholder="$lang.enterContactHours || 'Optional'"
                        :invalid="!!errors.contact_hours"
                        :message="errors.contact_hours"
                        message-type="error"
                        size="normal" />
                </div>

                <TextArea
                    v-model="form.description"
                    :label="$lang.description || 'Description'"
                    :rows="3"
                    :placeholder="$lang.enterDescription || 'Optional'"
                    :invalid="!!errors.description"
                    :message="errors.description"
                    message-type="error" />
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.weeklyLoad || 'Weekly Load' }}
                </h3>
                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.weeklyLoadHint ||
                        'The automatic class scheduler fans a course out into this many weekly meetings and fills them from these hours.'
                    }}
                </p>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.lecture_hours_per_week"
                        :label="$lang.lectureHoursPerWeek || 'Lecture hours / week'"
                        placeholder="e.g. 3"
                        :invalid="!!errors.lecture_hours_per_week"
                        :message="errors.lecture_hours_per_week"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.lab_hours_per_week"
                        :label="$lang.labHoursPerWeek || 'Lab hours / week'"
                        placeholder="e.g. 3"
                        :invalid="!!errors.lab_hours_per_week"
                        :message="errors.lab_hours_per_week"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.tutorial_hours_per_week"
                        :label="$lang.tutorialHoursPerWeek || 'Tutorial hours / week'"
                        placeholder="e.g. 1"
                        :invalid="!!errors.tutorial_hours_per_week"
                        :message="errors.tutorial_hours_per_week"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.sessions_per_week"
                        :label="$lang.sessionsPerWeek || 'Sessions / week'"
                        placeholder="e.g. 2"
                        :invalid="!!errors.sessions_per_week"
                        :message="errors.sessions_per_week"
                        message-type="error"
                        size="normal" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <ToggleSwitch
                    v-model="form.is_active"
                    :label="$lang.active || 'Active'"
                    has-border />
            </section>
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end gap-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    :label="isEditing ? $lang.saveChanges || 'Save Changes' : $lang.save || 'Save'"
                    severity="primary"
                    :loading="isSaving"
                    @click="emit('save')" />
            </div>
        </template>
    </MainDialog>
</template>
