<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { SectionForm } from '@/modules/masterData/types/section';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: SectionForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const programDropdown = useDropdownOptions<DropdownOption>('/programs', { [DROPDOWN_PARAM_KEY]: true });
const academicYearDropdown = useDropdownOptions<DropdownOption>('/academic-years', { [DROPDOWN_PARAM_KEY]: true });

onMounted(() => {
    programDropdown.fetchOptions();
    academicYearDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editSection || 'Edit Section' : $lang.createSection || 'Create Section'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.cohortInformation || 'Cohort' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.program_id"
                        :label-text="$lang.program || 'Program'"
                        :options="programDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectProgram || 'Select a program'"
                        :invalid="!!errors.program_id"
                        :message="errors.program_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="programDropdown.loading.value"
                        @refresh="programDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.academic_year_id"
                        :label-text="$lang.academicYear || 'Academic year'"
                        :options="academicYearDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectAcademicYear || 'Select an academic year'"
                        :invalid="!!errors.academic_year_id"
                        :message="errors.academic_year_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="academicYearDropdown.loading.value"
                        :helper-message="
                            $lang.sectionYearScopeHint ||
                            'A cohort is scoped to the academic year — the same section spans both semesters.'
                        "
                        @refresh="academicYearDropdown.fetchOptions(true)" />
                    <InputText
                        v-model="form.year_level"
                        :label="$lang.yearLevel || 'Year level'"
                        :placeholder="$lang.enterYearLevel || 'e.g. 2'"
                        :invalid="!!errors.year_level"
                        :message="errors.year_level"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.label"
                        :label="$lang.label || 'Section label'"
                        :placeholder="$lang.enterSectionLabel || 'e.g. A or Night-1'"
                        :invalid="!!errors.label"
                        :message="errors.label"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.expected_students"
                        :label="$lang.expectedStudents || 'Expected students'"
                        :placeholder="$lang.enterExpectedStudents || 'e.g. 45'"
                        :invalid="!!errors.expected_students"
                        :message="errors.expected_students"
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
