<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { BuildingForm } from '@/modules/masterData/types/building';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: BuildingForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const campusDropdown = useDropdownOptions<DropdownOption>('/campuses', { [DROPDOWN_PARAM_KEY]: true });

onMounted(() => {
    campusDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editBuilding || 'Edit Building' : $lang.createBuilding || 'Create Building'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.buildingInformation || 'Building Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.name"
                        :label="$lang.name || 'Name'"
                        :placeholder="$lang.enterBuildingName || 'e.g. New Block'"
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
                        v-model="form.campus_id"
                        :label-text="$lang.campus || 'Campus'"
                        :options="campusDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectCampus || 'Select a campus'"
                        :invalid="!!errors.campus_id"
                        :message="errors.campus_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="campusDropdown.loading.value"
                        @refresh="campusDropdown.fetchOptions(true)" />
                    <InputText
                        v-model="form.floors"
                        :label="$lang.floors || 'Floors'"
                        :placeholder="$lang.enterFloors || 'e.g. 5'"
                        :invalid="!!errors.floors"
                        :message="errors.floors"
                        message-type="error"
                        size="normal" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.settings || 'Settings' }}
                </h3>

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
