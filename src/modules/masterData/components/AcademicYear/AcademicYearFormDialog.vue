<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';
import type { AcademicYearForm } from '@/modules/masterData/types/academicYear';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: AcademicYearForm;
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
        :header="
            isEditing
                ? $lang.editAcademicYear || 'Edit Academic Year'
                : $lang.createAcademicYear || 'Create Academic Year'
        "
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.academicYearInformation || 'Academic Year' }}
                </h3>

                <InputText
                    v-model="form.code"
                    :label="$lang.academicYear || 'Academic Year'"
                    :placeholder="$lang.enterAcademicYear || 'e.g. 2025/26'"
                    :invalid="!!errors.code"
                    :message="errors.code"
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
                    :label="$lang.currentAcademicYear || 'Current academic year'"
                    has-border />

                <p
                    v-if="form.is_current"
                    class="text-text-tertiary text-xs">
                    {{
                        $lang.currentAcademicYearHint ||
                        'Only one academic year can be current — saving this will clear the flag from the year that holds it now.'
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
