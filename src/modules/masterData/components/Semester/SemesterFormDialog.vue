<script setup lang="ts">
import { computed, onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLanguageStore } from '@/stores/languageStore';
import { DROPDOWN_PARAM_KEY, MIN_SEMESTER_TERM, MAX_SEMESTER_TERM } from '@/config/appConfig';
import type { SemesterForm } from '@/modules/masterData/types/semester';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: SemesterForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const { customizeLanguageData } = useLanguageStore();
const academicYearDropdown = useDropdownOptions<DropdownOption>('/academic-years', { [DROPDOWN_PARAM_KEY]: true });

/**
 * Terms are a fixed 1..3 CHECK on the table, not a lookup vocabulary — the
 * options are derived from the same bounds the Zod schema uses.
 */
const termOptions = computed(() =>
    Array.from({ length: MAX_SEMESTER_TERM - MIN_SEMESTER_TERM + 1 }, (_unused, index) => {
        const term = MIN_SEMESTER_TERM + index;
        return { id: term, name: `${customizeLanguageData('semester', 'Semester')} ${term}` };
    })
);

onMounted(() => {
    academicYearDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editSemester || 'Edit Semester' : $lang.createSemester || 'Create Semester'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.semesterInformation || 'Semester Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        @refresh="academicYearDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.term"
                        :label-text="$lang.term || 'Term'"
                        :options="termOptions"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectTerm || 'Select a term'"
                        :invalid="!!errors.term"
                        :message="errors.term"
                        message-type="error"
                        size="normal"
                        is-required />
                </div>

                <InputText
                    v-model="form.name"
                    :label="$lang.name || 'Name'"
                    :placeholder="$lang.enterSemesterName || 'Optional — defaults to \'2025/26 - Semester 2\''"
                    :invalid="!!errors.name"
                    :message="errors.name"
                    message-type="error"
                    size="normal" />

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DateTimePicker
                        v-model="form.start_date"
                        :label-text="$lang.startDate || 'Start date'"
                        :invalid="!!errors.start_date"
                        :message="errors.start_date"
                        message-type="error"
                        is-required />
                    <DateTimePicker
                        v-model="form.end_date"
                        :label-text="$lang.endDate || 'End date'"
                        :invalid="!!errors.end_date"
                        :message="errors.end_date"
                        message-type="error"
                        is-required />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <ToggleSwitch
                    v-model="form.is_current"
                    :label="$lang.currentSemester || 'Current semester'"
                    has-border />

                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.semesterStatusHint ||
                        'A new semester starts at Planning. Move it along the lifecycle from the row menu — the allowed steps come from the lookup transitions.'
                    }}
                </p>
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
