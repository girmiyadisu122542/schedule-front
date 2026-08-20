<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLookupValues } from '@/composables/useLookupValues';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { InstructorForm } from '@/modules/masterData/types/instructor';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: InstructorForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const departmentDropdown = useDropdownOptions<DropdownOption>('/departments', { [DROPDOWN_PARAM_KEY]: true });
const academicRanks = useLookupValues(LOOKUP_TYPE.ACADEMIC_RANK);

onMounted(() => {
    departmentDropdown.fetchOptions();
});

</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editInstructor || 'Edit Instructor' : $lang.createInstructor || 'Create Instructor'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.instructorInformation || 'Instructor Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.full_name"
                        :label="$lang.fullName || 'Full name'"
                        :placeholder="$lang.enterInstructorName || 'e.g. Dr. Alemu Bekele'"
                        :invalid="!!errors.full_name"
                        :message="errors.full_name"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.employee_no"
                        :label="$lang.employeeNo || 'Employee number'"
                        :placeholder="$lang.enterEmployeeNo || 'e.g. EMP-1001'"
                        :invalid="!!errors.employee_no"
                        :message="errors.employee_no"
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
                        v-model="form.academic_rank_lookup_value_id"
                        :label-text="$lang.academicRank || 'Academic rank'"
                        :options="academicRanks.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectAcademicRank || 'Select an academic rank'"
                        :invalid="!!errors.academic_rank_lookup_value_id"
                        :message="errors.academic_rank_lookup_value_id"
                        message-type="error"
                        size="normal"
                        show-refresh
                        :loading="academicRanks.loading.value"
                        @refresh="academicRanks.refetch(true)" />
                    <!-- Required: this becomes the instructor's login, and the
                         only address their one-time password is sent to. -->
                    <InputText
                        v-model="form.email"
                        :label="$lang.email || 'Email'"
                        :placeholder="$lang.enterEmail || 'e.g. alemu.bekele@school.edu'"
                        :invalid="!!errors.email"
                        :message="errors.email"
                        message-type="error"
                        is-required
                        size="normal" />
                    <InputText
                        v-model="form.phone"
                        :label="$lang.phone || 'Phone'"
                        :placeholder="$lang.enterPhone || 'Optional'"
                        :invalid="!!errors.phone"
                        :message="errors.phone"
                        message-type="error"
                        size="normal" />
                </div>

                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.instructorAccountHint ||
                        'A portal account is created automatically from the email above, and the login details are sent to it.'
                    }}
                </p>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.capabilities || 'Capabilities' }}
                </h3>
                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.capabilitiesHint ||
                        'Instructors and invigilators are one population — a lab technician may only invigilate, a visiting lecturer only teach.'
                    }}
                </p>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ToggleSwitch
                        v-model="form.can_teach"
                        :label="$lang.canTeach || 'Can teach'"
                        has-border />
                    <ToggleSwitch
                        v-model="form.can_invigilate"
                        :label="$lang.canInvigilate || 'Can invigilate'"
                        has-border />
                </div>

                <p
                    v-if="errors.can_teach"
                    class="text-schedule-error text-xs">
                    {{ errors.can_teach }}
                </p>

                <InputText
                    v-model="form.max_weekly_hours"
                    :label="$lang.maxWeeklyHours || 'Max weekly hours'"
                    :placeholder="$lang.enterMaxWeeklyHours || 'Optional soft ceiling, e.g. 18'"
                    :invalid="!!errors.max_weekly_hours"
                    :message="errors.max_weekly_hours"
                    message-type="error"
                    size="normal" />

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
