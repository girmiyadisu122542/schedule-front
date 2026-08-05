<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { DepartmentForm } from '@/modules/masterData/types/department';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: DepartmentForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const collegeDropdown = useDropdownOptions<DropdownOption>('/colleges', { [DROPDOWN_PARAM_KEY]: true });
const headDropdown = useDropdownOptions<DropdownOption>('/user', { [DROPDOWN_PARAM_KEY]: true });

onMounted(() => {
    collegeDropdown.fetchOptions();
    headDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editDepartment || 'Edit Department' : $lang.createDepartment || 'Create Department'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.departmentInformation || 'Department Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.name"
                        :label="$lang.name || 'Name'"
                        :placeholder="$lang.enterDepartmentName || 'e.g. Computer Science'"
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
                        v-model="form.college_id"
                        :label-text="$lang.college || 'College'"
                        :options="collegeDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectCollege || 'Select a college'"
                        :invalid="!!errors.college_id"
                        :message="errors.college_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="collegeDropdown.loading.value"
                        @refresh="collegeDropdown.fetchOptions(true)" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.approvalRouting || 'Approval Routing' }}
                </h3>

                <MainSelect
                    v-model="form.head_user_id"
                    :label-text="$lang.departmentHead || 'Department head'"
                    :options="headDropdown.options.value"
                    option-label="full_name"
                    option-value="id"
                    :placeholder="$lang.selectDepartmentHead || 'Select the head (optional)'"
                    :invalid="!!errors.head_user_id"
                    :message="errors.head_user_id"
                    message-type="error"
                    size="normal"
                    search
                    show-clear
                    show-refresh
                    :loading="headDropdown.loading.value"
                    :helper-message="
                        $lang.headRoutingHint ||
                        'Names who the department-approval step goes to. Permission to act still comes from the user\'s role.'
                    "
                    @refresh="headDropdown.fetchOptions(true)" />

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
