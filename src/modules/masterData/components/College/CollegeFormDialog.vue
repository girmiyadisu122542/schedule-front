<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';
import type { CollegeForm } from '@/modules/masterData/types/college';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: CollegeForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'save'): void;
}>();
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
                        :placeholder="$lang.enterCollegeName || 'e.g. College of Engineering'"
                        :invalid="!!errors.name"
                        :message="errors.name"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.code"
                        :label="$lang.code || 'Code'"
                        :placeholder="$lang.enterCollegeCode || 'e.g. COE'"
                        :invalid="!!errors.code"
                        :message="errors.code"
                        message-type="error"
                        size="normal" />
                </div>

                <FieldWrapper
                    :label="$lang.description || 'Description'"
                    :required="false">
                    <textarea
                        v-model="form.description"
                        rows="3"
                        :placeholder="$lang.enterDescription || 'Enter a description...'"
                        class="border-border-default text-text-primary placeholder:text-text-tertiary focus:border-schedule-brand-blue focus:ring-schedule-brand-blue/20 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-none"></textarea>
                </FieldWrapper>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.contactAndDetails || 'Contact & Details' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.dean_name"
                        :label="$lang.dean || 'Dean'"
                        :placeholder="$lang.enterDeanName || 'Head of the college'"
                        :invalid="!!errors.dean_name"
                        :message="errors.dean_name"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.established_year"
                        :label="$lang.establishedYear || 'Established Year'"
                        :placeholder="'e.g. 1998'"
                        :invalid="!!errors.established_year"
                        :message="errors.established_year"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.email"
                        :label="$lang.email || 'Email'"
                        :placeholder="$lang.enterEmail || 'college@university.edu'"
                        :invalid="!!errors.email"
                        :message="errors.email"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.phone"
                        :label="$lang.phone || 'Phone'"
                        :placeholder="$lang.enterPhone || 'Phone number'"
                        :invalid="!!errors.phone"
                        :message="errors.phone"
                        message-type="error"
                        size="normal" />
                </div>
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
