<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLookupValues } from '@/composables/useLookupValues';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';
import type { ProgramForm } from '@/modules/masterData/types/program';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: ProgramForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const departmentDropdown = useDropdownOptions<DropdownOption>('/departments', { [DROPDOWN_PARAM_KEY]: true });
const degreeLevels = useLookupValues(LOOKUP_TYPE.DEGREE_LEVEL);

onMounted(() => {
    departmentDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editProgram || 'Edit Program' : $lang.createProgram || 'Create Program'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.programInformation || 'Program Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.name"
                        :label="$lang.name || 'Name'"
                        :placeholder="$lang.enterProgramName || 'e.g. BSc in Computer Science'"
                        :invalid="!!errors.name"
                        :message="errors.name"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.code"
                        :label="$lang.code || 'Code'"
                        :placeholder="$lang.leaveBlankToAutoGenerate || 'Leave blank to auto-generate'"
                        :invalid="!!errors.code"
                        :message="errors.code"
                        message-type="error"
                        size="normal" />
                    <MainSelect
                        v-model="form.department_id"
                        :label-text="$lang.department || 'Department'"
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
                        v-model="form.degree_level_lookup_value_id"
                        :label-text="$lang.degreeLevel || 'Degree level'"
                        :options="degreeLevels.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectDegreeLevel || 'Select a degree level'"
                        :invalid="!!errors.degree_level_lookup_value_id"
                        :message="errors.degree_level_lookup_value_id"
                        message-type="error"
                        size="normal"
                        is-required
                        :loading="degreeLevels.loading.value" />
                    <InputText
                        v-model="form.duration_years"
                        :label="$lang.durationYears || 'Duration (years)'"
                        :placeholder="$lang.enterDurationYears || 'e.g. 4'"
                        :invalid="!!errors.duration_years"
                        :message="errors.duration_years"
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
