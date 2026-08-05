<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { CollegeForm } from '@/modules/masterData/types/college';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: CollegeForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const deanDropdown = useDropdownOptions<DropdownOption>('/user', { [DROPDOWN_PARAM_KEY]: true });

onMounted(() => {
    deanDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editCollege || 'Edit College' : $lang.createCollege || 'Create College'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.collegeInformation || 'College Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.name"
                        :label="$lang.name || 'Name'"
                        :placeholder="$lang.enterCollegeName || 'e.g. College of Engineering and Technology'"
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
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.approvalRouting || 'Approval Routing' }}
                </h3>

                <MainSelect
                    v-model="form.dean_user_id"
                    :label-text="$lang.dean || 'Dean'"
                    :options="deanDropdown.options.value"
                    option-label="full_name"
                    option-value="id"
                    :placeholder="$lang.selectDean || 'Select the dean (optional)'"
                    :invalid="!!errors.dean_user_id"
                    :message="errors.dean_user_id"
                    message-type="error"
                    size="normal"
                    search
                    show-clear
                    show-refresh
                    :loading="deanDropdown.loading.value"
                    :helper-message="
                        $lang.deanRoutingHint ||
                        'Names who the college-approval step goes to. Permission to act as Dean still comes from the user\'s role.'
                    "
                    @refresh="deanDropdown.fetchOptions(true)" />

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
