<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, computed, watch } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';

import XCircleIcon from '@/assets/icons/XCircleIcon.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';
import CircleCheckIcon from '@/assets/icons/CircleCheckIcon.vue';
import LockRefresh from '@/assets/icons/LockRefresh.vue';

const languageStore = useLanguageStore();

const { translations } = storeToRefs(languageStore);

const props = defineProps<{ email: string }>();
const emit = defineEmits(['success', 'cancel']);

const isPending = ref(false);
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const localError = ref('');

const hasUppercase = computed(() => /[A-Z]/.test(password.value));
const hasNumber = computed(() => /[0-9]/.test(password.value));
const hasLength = computed(() => password.value.length >= 8);

const strengthScore = computed(() => {
    let score = 0;
    if (hasUppercase.value) score++;
    if (hasNumber.value) score++;
    if (hasLength.value) score++;
    return score;
});
const requirements = computed(() => [
    { label: translations.value.atLeastOneUppercaseLetter, met: hasUppercase.value },
    { label: translations.value.atLeastOneNumber, met: hasNumber.value },
    { label: translations.value.atLeast8Characters, met: hasLength.value }
]);

const handleApply = async () => {
    if (strengthScore.value < 3 || password.value !== confirmPassword.value) return;

    isPending.value = true;
    emit('success', password.value);
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};
const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};
watch([password, confirmPassword], () => {
    localError.value = '';
});
</script>

<template>
    <div class="bg-schedule-primary dark:bg-schedule-dark flex min-h-screen items-center justify-center py-24 md:py-0">
        <div
            class="border-schedule-tertiary bg-schedule-generic-white dark:bg-schedule-dark relative -mt-24 flex w-full max-w-xl flex-col rounded-3xl border p-10">
            <div class="mb-4 flex items-start gap-4">
                <div class="rounded-full">
                    <LockRefresh
                        :size="78"
                        stroke="#737373" />
                </div>
                <div>
                    <h1 class="text-schedule-text-primary dark:text-schedule-text-tertiary text-3xl font-bold">
                        {{ $lang.changePassword }}
                    </h1>
                    <p class="text-schedule-text-tertiary text-lg">{{ $lang.updatePasswordForAccountSecurity }}</p>
                </div>
            </div>

            <p class="text-schedule-text-tertiary mb-8">
                {{ $lang.changePasswordForAccount }}
                <span class="text-schedule-text-primary font-semibold">{{ email }}</span>
            </p>

            <div class="mb-4 space-y-5">
                <FieldWrapper
                    :required="false"
                    :label="$lang.newPassword">
                    <InputText
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        variant="outlined"
                        size="large"
                        class="w-full">
                        <template #suffix>
                            <button
                                @click="togglePasswordVisibility"
                                class="px-2 text-gray-400 transition-colors hover:text-gray-600">
                                <i :class="['fa-solid', showPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
                            </button>
                        </template>
                    </InputText>
                </FieldWrapper>

                <FieldWrapper
                    :required="false"
                    :label="$lang.confirmNewPassword">
                    <InputText
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        :invalid="!!localError"
                        :message="localError"
                        messageType="error"
                        variant="outlined"
                        size="large"
                        class="w-full">
                        <template #suffix>
                            <button
                                @click="toggleConfirmPasswordVisibility"
                                class="px-2 text-gray-400 transition-colors hover:text-gray-600">
                                <i :class="['fa-solid', showConfirmPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
                            </button>
                        </template>
                    </InputText>
                </FieldWrapper>
            </div>

            <div class="mb-6 flex gap-2">
                <div
                    :class="[
                        'h-1.5 flex-1 rounded-full transition-all duration-500',
                        strengthScore >= 1 ? 'bg-schedule-error-500' : 'bg-gray-100'
                    ]"></div>
                <div
                    :class="[
                        'h-1.5 flex-1 rounded-full transition-all duration-500',
                        strengthScore >= 2 ? 'bg-schedule-warning-600' : 'bg-gray-100'
                    ]"></div>
                <div
                    :class="[
                        'h-1.5 flex-1 rounded-full transition-all duration-500',
                        strengthScore >= 3 ? 'bg-schedule-success-500' : 'bg-gray-100'
                    ]"></div>
            </div>

            <div class="mb-8 space-y-2">
                <p class="text-schedule-text-secondary text-sm font-normal">{{ $lang.strongPassword }};</p>

                <div
                    v-for="req in requirements"
                    :key="req.label"
                    class="flex items-center gap-1 text-sm">
                    <div
                        :class="[
                            'flex items-center justify-center transition-all duration-300',
                            req.met
                                ? 'border-schedule-success-500 text-schedule-success-500'
                                : 'text-schedule-text-secondary border-gray-300'
                        ]">
                        <CircleCheckIcon v-if="req.met" />
                        <span
                            v-else
                            class="text-xs">
                            <XCircleIcon
                                strokeWidth="1"
                                width="22" />
                        </span>
                    </div>

                    <span
                        :class="[
                            'text-xs transition-colors duration-300',
                            req.met ? 'text-schedule-text-secondary font-medium' : 'text-schedule-text-secondary'
                        ]">
                        {{ req.label }}
                    </span>
                </div>
            </div>

            <div class="flex items-center justify-between border-t border-gray-50 pt-8">
                <button
                    @click="emit('cancel')"
                    class="rounded-xl border border-gray-200 px-8 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                    {{ $lang.cancel }}
                </button>
                <MainButton
                    label="Apply Changes"
                    @click="handleApply"
                    :loading="isPending"
                    :disabled="strengthScore < 3 || isPending" />
            </div>
        </div>
    </div>
</template>
