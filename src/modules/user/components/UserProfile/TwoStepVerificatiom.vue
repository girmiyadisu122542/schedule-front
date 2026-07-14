<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';

import axiosInstance from '@/api/axiosInstance';
import { use2FA } from '@/modules/user/composables/login/use2FA';
import { useLanguageStore } from '@/stores/languageStore';

import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';
import CoverPhoto from '@/modules/user/components/UserProfile/CoverPhoto.vue';
import CopyIcon from '@/assets/icons/CopyIcon.vue';

import ShieldCheckIcon from '@/assets/icons/ShieldCheckAltIcon.vue';
import SmartphoneIcon from '@/assets/icons/DeviceIcon.vue';
import MailIcon from '@/assets/icons/MailIcon.vue';

type Step = 'overview' | 'password-challenge' | 'backup-codes';

interface BackupCode {
    value: string;
    used: boolean;
}

const { enable2FA, disable2FA, isSubmitting } = use2FA();
const { translations } = storeToRefs(useLanguageStore()) as any;

const step = ref<Step>('overview');
const is2FAEnabled = ref(false);
const isLoading = ref(true);
const isEnabling = ref(false);
const password = ref('');
const showPassword = ref(false);
const passwordError = ref('');
const backupCodes = ref<BackupCode[]>([]);

onMounted(async () => {
    try {
        const response = await axiosInstance.get('/account/2fa/status');
        is2FAEnabled.value = response.data?.mfa_enabled ?? false;
    } catch {
    } finally {
        isLoading.value = false;
    }
});

const handleEmailToggle = () => {
    isEnabling.value = !is2FAEnabled.value;
    password.value = '';
    passwordError.value = '';
    step.value = 'password-challenge';
};

const handleConfirm = async () => {
    passwordError.value = '';
    if (!password.value) {
        passwordError.value = translations.value?.passwordIsRequired || 'Password is required';
        return;
    }

    if (isEnabling.value) {
        const result = await enable2FA(password.value);
        if (result) {
            backupCodes.value = result.backup_codes;
            is2FAEnabled.value = true;
            password.value = '';
            step.value = 'backup-codes';
        }
    } else {
        const ok = await disable2FA(password.value);
        if (ok) {
            is2FAEnabled.value = false;
            password.value = '';
            step.value = 'overview';
        }
    }
};

const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
};

const copyAll = () =>
    copyToClipboard(
        backupCodes.value
            .filter((c) => !c.used)
            .map((c) => c.value)
            .join('\n')
    );
</script>

<template>
    <div
        class="border-schedule-border-subtle overflow-hidden rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
        <CoverPhoto />

        <div
            class="bg-schedule-generic-white border-schedule-border-subtle mx-6 -mt-12 mb-6 rounded-lg border p-6 dark:border-gray-800 dark:bg-gray-900">
            <div
                v-if="isLoading"
                class="text-schedule-text-tertiary py-4 text-sm">
                {{ $lang.loading || 'Loading...' }}
            </div>

            <div
                v-else-if="step === 'overview'"
                class="space-y-2">
                <div class="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                        <ShieldCheckIcon class="text-schedule-text-tertiary h-6 w-6" />
                        <span class="text-schedule-text-secondary text-sm font-normal dark:text-white">
                            {{ $lang.twoStepVerification }}
                        </span>
                    </div>
                    <span
                        :class="[
                            'rounded-full px-4 py-1 text-xs font-bold',
                            is2FAEnabled ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                        ]">
                        {{ is2FAEnabled ? $lang.activated || 'Activated' : $lang.off || 'Off' }}
                    </span>
                </div>

                <div class="space-y-6 py-2">
                    <div class="flex items-center justify-between">
                        <div class="flex gap-4">
                            <MailIcon class="text-schedule-text-tertiary mt-1 h-5 w-5" />
                            <div>
                                <p class="text-schedule-text-secondary text-sm font-normal dark:text-white">
                                    {{ $lang.email }}
                                </p>
                                <p class="text-schedule-text-tertiary text-xs">{{ $lang.useEmailFor }}</p>
                            </div>
                        </div>
                        <button
                            @click="handleEmailToggle"
                            :disabled="isSubmitting"
                            :class="[
                                'relative h-6 w-11 rounded-full transition-all',
                                is2FAEnabled ? 'bg-blue-900' : 'bg-gray-200'
                            ]">
                            <span
                                :class="[
                                    'absolute top-1 h-4 w-4 rounded-full bg-white transition-all',
                                    is2FAEnabled ? 'right-1' : 'left-1'
                                ]"></span>
                        </button>
                    </div>

                    <div class="flex items-center justify-between opacity-50">
                        <div class="flex gap-4">
                            <SmartphoneIcon class="text-schedule-text-tertiary mt-1 h-5 w-5" />
                            <div>
                                <p class="text-schedule-text-secondary text-sm font-normal dark:text-white">
                                    {{ $lang.phoneNumber }}
                                </p>
                                <p class="text-schedule-text-tertiary text-xs">{{ $lang.setupSms }}</p>
                            </div>
                        </div>
                        <span class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400 dark:bg-gray-800">
                            {{ $lang.comingSoon || 'Coming soon' }}
                        </span>
                    </div>

                    <div class="flex items-center justify-between opacity-50">
                        <div class="flex gap-4">
                            <ShieldCheckIcon class="text-schedule-text-tertiary mt-1 h-5 w-5" />
                            <div>
                                <p class="text-schedule-text-secondary text-sm font-normal dark:text-white">
                                    {{ $lang.authenticatorApp }}
                                </p>
                                <p class="text-schedule-text-tertiary text-xs">{{ $lang.useAnAuthenticatorApp }}</p>
                            </div>
                        </div>
                        <span class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400 dark:bg-gray-800">
                            {{ $lang.comingSoon || 'Coming soon' }}
                        </span>
                    </div>
                </div>
            </div>

            <div
                v-else-if="step === 'password-challenge'"
                class="text-center">
                <h2 class="text-schedule-text-primary text-2xl font-semibold dark:text-white">
                    {{ $lang.enterYourPassword }}
                </h2>
                <p class="text-schedule-text-tertiary mt-1 text-xs">
                    {{ $lang.enterYourPasswordTo }}
                    {{ isEnabling ? $lang.activate || 'activate' : $lang.deactivate || 'deactivate' }}
                    {{ $lang.twoStepVerification }}
                </p>

                <div class="mx-auto mt-8 max-w-md text-left">
                    <FieldWrapper
                        :required="false"
                        :label="$lang.password || 'Password'">
                        <InputText
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            :placeholder="$lang.enterPassword"
                            :invalid="!!passwordError"
                            :message="passwordError"
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
                    <div class="mt-4 flex gap-3">
                        <button
                            @click="step = 'overview'"
                            class="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50">
                            {{ $lang.cancel }}
                        </button>
                        <MainButton
                            :label="$lang.confirm || 'Confirm'"
                            @click="handleConfirm"
                            :loading="isSubmitting"
                            :disabled="isSubmitting"
                            class="flex-1" />
                    </div>
                </div>
            </div>

            <div
                v-else-if="step === 'backup-codes'"
                class="space-y-4">
                <div class="text-center">
                    <h2 class="text-schedule-text-primary text-2xl font-semibold dark:text-white">
                        {{ $lang.twoFaEnabledSuccessfully || '2FA Enabled' }}
                    </h2>
                    <p class="text-schedule-text-tertiary mt-1 text-sm">
                        {{ $lang.saveBackupCodesWarning || 'Save these backup codes. You will not see them again.' }}
                    </p>
                </div>

                <div class="flex justify-end">
                    <button
                        @click="copyAll"
                        class="text-schedule-text-tertiary hover:text-schedule-text-primary flex items-center gap-1 text-xs">
                        <span>{{ $lang.copyAll || 'Copy all' }}</span>
                        <CopyIcon class="h-4 w-4" />
                    </button>
                </div>

                <div class="bg-schedule-tertiary rounded-2xl p-6 dark:bg-gray-800">
                    <div class="grid grid-cols-2 gap-3">
                        <div
                            v-for="(code, i) in backupCodes"
                            :key="i"
                            class="flex items-center gap-2">
                            <span class="text-schedule-text-primary font-mono text-sm font-bold dark:text-white">
                                {{ code.value }}
                            </span>
                            <button
                                @click="copyToClipboard(code.value)"
                                class="hover:text-schedule-brand-blue text-schedule-text-tertiary ml-auto">
                                <CopyIcon class="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <MainButton
                    :label="$lang.done || 'Done'"
                    @click="step = 'overview'"
                    width="full" />
            </div>
        </div>
    </div>
</template>
