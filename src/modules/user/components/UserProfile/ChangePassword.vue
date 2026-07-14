<script setup lang="ts">
import { ref, watch } from 'vue';

import { useChangePassword } from '@/modules/user/composables/UserProfile/useChangePassword';

import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';

const { form, errors, isPending, submit, clearForm } = useChangePassword();

const showOldPassword = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

watch(
    () => form.new_password_confirmation,
    () => {
        errors['new_password_confirmation'] = '';
    }
);
</script>

<template>
    <div class="border-schedule-border-subtle rounded-2xl border p-4">
        <div class="p-2">
            <h4 class="text-schedule-text-secondary text-sm font-semibold dark:text-white">
                {{ $lang.chooseNewPassword }}
            </h4>
            <p class="text-schedule-text-tertiary text-xs font-normal">{{ $lang.enterAndConfirmNewPassword }}</p>
        </div>

        <div class="space-y-4 p-2">
            <FieldWrapper
                :required="false"
                :label="$lang.oldPassword">
                <InputText
                    v-model="form.old_password"
                    :type="showOldPassword ? 'text' : 'password'"
                    :placeholder="$lang.enterOldPassword"
                    :invalid="!!errors.old_password"
                    :message="errors.old_password || ''"
                    messageType="error"
                    variant="outlined"
                    size="large"
                    class="w-full">
                    <template #suffix>
                        <button
                            @click="showOldPassword = !showOldPassword"
                            class="px-2 text-gray-400 hover:text-gray-600">
                            <i :class="['fa-solid', showOldPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
                        </button>
                    </template>
                </InputText>
            </FieldWrapper>

            <FieldWrapper
                :required="false"
                :label="$lang.newPassword">
                <InputText
                    v-model="form.new_password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="$lang.enterNewPassword"
                    :invalid="!!errors.new_password"
                    :message="errors.new_password || ''"
                    messageType="error"
                    variant="outlined"
                    size="large"
                    class="w-full">
                    <template #suffix>
                        <button
                            @click="showPassword = !showPassword"
                            class="px-2 text-gray-400 hover:text-gray-600">
                            <i :class="['fa-solid', showPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
                        </button>
                    </template>
                </InputText>
            </FieldWrapper>

            <FieldWrapper
                :required="false"
                :label="$lang.confirmNewPassword">
                <InputText
                    v-model="form.new_password_confirmation"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    :placeholder="$lang.confirmNewPassword"
                    :invalid="!!errors.new_password_confirmation"
                    :message="errors.new_password_confirmation || ''"
                    messageType="error"
                    variant="outlined"
                    size="large"
                    class="w-full">
                    <template #suffix>
                        <button
                            @click="showConfirmPassword = !showConfirmPassword"
                            class="px-2 text-gray-400 hover:text-gray-600">
                            <i :class="['fa-solid', showConfirmPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
                        </button>
                    </template>
                </InputText>
            </FieldWrapper>
        </div>

        <div class="flex items-center justify-end space-x-2 border-t border-gray-50 pt-8">
            <button
                @click="clearForm"
                class="rounded-lg border border-gray-200 px-6 py-2 font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                {{ $lang.clear }}
            </button>
            <MainButton
                :label="$lang.save"
                @click="submit"
                :loading="isPending"
                :disabled="isPending" />
        </div>
    </div>
</template>
