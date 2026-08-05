<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import TextArea from '@/components/common/TextArea.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import type { CampusForm } from '@/modules/masterData/types/campus';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: CampusForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editCampus || 'Edit Campus' : $lang.createCampus || 'Create Campus'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.campusInformation || 'Campus Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.name"
                        :label="$lang.name || 'Name'"
                        :placeholder="$lang.enterCampusName || 'e.g. Main Campus'"
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
                    <InputText
                        v-model="form.city"
                        :label="$lang.city || 'City'"
                        :placeholder="$lang.enterCity || 'e.g. Addis Ababa'"
                        :invalid="!!errors.city"
                        :message="errors.city"
                        message-type="error"
                        size="normal" />
                </div>

                <TextArea
                    v-model="form.address"
                    :label="$lang.address || 'Address'"
                    :rows="3"
                    :placeholder="$lang.enterAddress || 'Street, district, landmark...'"
                    :invalid="!!errors.address"
                    :message="errors.address"
                    message-type="error" />
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.settings || 'Settings' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ToggleSwitch
                        v-model="form.is_main"
                        :label="$lang.mainCampus || 'Main campus'"
                        has-border />
                    <ToggleSwitch
                        v-model="form.is_active"
                        :label="$lang.active || 'Active'"
                        has-border />
                </div>

                <p
                    v-if="form.is_main"
                    class="text-text-tertiary text-xs">
                    {{
                        $lang.mainCampusHint ||
                        'Only one campus can be the main one — saving this will clear the flag from the current main campus.'
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
