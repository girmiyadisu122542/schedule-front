<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, computed, onMounted, onUnmounted, onBeforeUpdate, watch } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';

import { COUNT_TIMER, OTP_CODE_LENGTH, VERIFICATION_MODES, type VerificationMode } from '@/config/appConfig';

import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import RightArrowIcon from '@/assets/icons/RightArrowIcon.vue';
import SecurityNoticeIcon from '@/assets/icons/SecurityNoticeIcon.vue';

import MainButton from '@/components/common/MainButton.vue';

interface Props {
    mode: VerificationMode;
    target?: string;
}

const languageStore = useLanguageStore();
const { translations } = storeToRefs(languageStore);

const props = withDefaults(defineProps<Props>(), {
    mode: 'email',
    target: ''
});

const emit = defineEmits<{
    (e: 'verify', code: string): void;
    (e: 'resend'): void;
    (e: 'use-backup'): void;
    (e: 'unavailable'): void;
    (e: 'close'): void;
}>();

const code = ref<string[]>(['', '', '', '', '', '']);
const timer = ref(59);
const isVerifying = ref(false);
let intervalId: number | null = null;

const inputRefs: HTMLInputElement[] = [];
const setInputRef = (el: any) => {
    if (el) inputRefs.push(el as HTMLInputElement);
};

onBeforeUpdate(() => {
    inputRefs.length = 0;
});

const maskedTarget = computed(() => {
    const t = props.target || '';
    if (!t.includes('@')) return t;
    const [local = '', domain = ''] = t.split('@');
    const visible = local.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
});

const content = computed(() => {
    const base = {
        showResend: true,
        showNotice: false,
        showVerifyBtn: true,
        showUnavailable: false,
        showBackToSelection: false,
        showBackupLink: false
    };

    const configs: Record<VerificationMode, typeof base & { title: string; subtitle: string }> = {
        [VERIFICATION_MODES.EMAIL]: {
            ...base,
            title: translations.value.securityVerification || 'Security Verification',
            subtitle: translations.value.weHaveSent || 'We sent a 6-digit code to',
            showNotice: true,
            showBackupLink: true
        },
        [VERIFICATION_MODES.SMS]: {
            ...base,
            title: translations.value.securityVerification || 'Security Verification',
            subtitle: translations.value.weHaveSent || 'We sent a 6-digit code to',
            showBackupLink: true
        },
        [VERIFICATION_MODES.AUTHENTICATOR]: {
            ...base,
            title: translations.value.securityVerification || 'Security Verification',
            subtitle: translations.value.codeFromAuthenticatorApp || 'Enter the code from your authenticator app',
            showResend: false,
            showVerifyBtn: false,
            showUnavailable: true
        },
        [VERIFICATION_MODES.BACKUP]: {
            ...base,
            title: translations.value.backUpCode || 'Backup Code',
            subtitle: translations.value.continueWithBackupCode || 'Enter one of your backup codes to continue',
            showResend: false
        },
        [VERIFICATION_MODES.RESET_PASSWORD]: {
            ...base,
            title: translations.value.otpVerification || 'OTP Verification',
            subtitle: translations.value.weHaveSentResetCode || 'We sent a password reset code to',
            showResend: true,
            showBackToSelection: true,
            showNotice: true
        }
    };

    return configs[props.mode]!;
});

const isCodeComplete = computed(() => code.value.every((c) => c !== ''));

const startTimer = () => {
    timer.value = COUNT_TIMER;
    if (intervalId) clearInterval(intervalId);
    intervalId = window.setInterval(() => {
        if (timer.value > 0) timer.value--;
        else if (intervalId) clearInterval(intervalId);
    }, 1000);
};

const handleInput = (index: number, event: Event) => {
    const target = event.target as HTMLInputElement;
    const val = target.value.replace(/\D/g, '').slice(0, 1);
    code.value[index] = val;
    target.value = val;

    if (val && index < OTP_CODE_LENGTH - 1) {
        inputRefs[index + 1]?.focus();
    }
};

const handleKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === 'Backspace') {
        if (!code.value[index] && index > 0) {
            code.value[index - 1] = '';
            inputRefs[index - 1]?.focus();
        } else {
            code.value[index] = '';
        }
    }
};

const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
    pasted.split('').forEach((char, i) => {
        if (i < OTP_CODE_LENGTH) code.value[i] = char;
    });
    const nextEmpty = code.value.findIndex((c) => c === '');
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs[focusIndex]?.focus();
};

const handleResendClick = () => {
    if (timer.value === 0) {
        emit('resend');
        startTimer();
    }
};

const handleVerify = async () => {
    if (!isCodeComplete.value || isVerifying.value) return;
    isVerifying.value = true;
    emit('verify', code.value.join(''));
    setTimeout(() => {
        isVerifying.value = false;
    }, 1500);
};

watch(
    code,
    (newCode) => {
        if (newCode.every((c) => c !== '')) {
            handleVerify();
        }
    },
    { deep: true }
);

onMounted(() => {
    if (props.mode !== VERIFICATION_MODES.AUTHENTICATOR) startTimer();
    setTimeout(() => inputRefs[0]?.focus(), 50);
});

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});
</script>

<template>
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div
            class="bg-schedule-generic-white dark:bg-schedule-dark border-schedule-border-subtle relative w-full max-w-md rounded-3xl border p-8 md:p-10">
            <button
                @click="emit('close')"
                class="text-schedule-text-tertiary hover:bg-schedule-tertiary absolute top-5 right-5 rounded-full p-1.5 transition-colors">
                <XmarkIcon />
            </button>

            <div class="mb-8 text-center">
                <h1
                    class="text-schedule-text-primary dark:text-schedule-text-tertiary mb-3 text-2xl font-semibold md:text-3xl">
                    {{ content.title }}
                </h1>
                <div class="flex items-center space-x-2">
                    <p class="text-schedule-text-tertiary text-base">
                        {{ content.subtitle }}
                    </p>

                    <div
                        v-if="
                            props.target &&
                            props.mode !== VERIFICATION_MODES.BACKUP &&
                            props.mode !== VERIFICATION_MODES.AUTHENTICATOR
                        "
                        class="inline-flex items-center gap-1.5 rounded-lg dark:bg-blue-900/20">
                        <span class="text-schedule-text-primary text-sm font-semibold tracking-wide">
                            {{ maskedTarget }}
                        </span>
                    </div>
                </div>
            </div>

            <div
                class="mb-8 flex justify-center gap-2 md:gap-3"
                @paste="handlePaste">
                <input
                    v-for="(_, i) in 6"
                    :key="i"
                    v-model="code[i]"
                    :ref="setInputRef"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    :class="[
                        'h-11 w-11 rounded-xl border text-center text-xl font-bold transition-all outline-none md:h-13 md:w-13',
                        code[i]
                            ? 'border-schedule-border-brand text-schedule-text-primary bg-blue-50 dark:bg-blue-900/20'
                            : 'text-schedule-text-primary border-gray-200 bg-white dark:border-gray-600 dark:bg-slate-800',
                        'focus:border-schedule-border-brand focus:ring-schedule-border-brand focus:ring-1'
                    ]"
                    @input="handleInput(i, $event)"
                    @keydown="handleKeyDown(i, $event)" />
            </div>

            <div
                v-if="content.showVerifyBtn"
                class="mb-4">
                <MainButton
                    @click="handleVerify"
                    :label="props.mode === VERIFICATION_MODES.BACKUP ? $lang.continue : $lang.verify || 'Verify'"
                    :disabled="!isCodeComplete || isVerifying"
                    :loading="isVerifying"
                    width="full" />
            </div>

            <div class="space-y-3 text-center">
                <div
                    v-if="content.showResend"
                    class="text-schedule-text-tertiary text-sm">
                    <span>{{ $lang.didntReceiveEmail || "Didn't receive the code?" }}</span>
                    <button
                        @click="handleResendClick"
                        :disabled="timer > 0"
                        :class="[
                            'ml-1 font-semibold transition-colors',
                            timer > 0
                                ? 'cursor-not-allowed text-gray-300'
                                : 'text-schedule-text-brand-primary hover:underline'
                        ]">
                        {{ $lang.resend || 'Resend' }}
                    </button>
                </div>

                <!-- Resend handled by showResend flag for all modes including resetPassword -->
                <p
                    v-if="timer > 0 && content.showResend"
                    class="text-xs text-gray-400">
                    {{ $lang.resendAvailableIn || 'Resend available in' }}
                    <span class="text-schedule-text-brand-primary font-semibold tabular-nums">{{ timer }}s</span>
                </p>

                <p
                    v-if="content.showNotice"
                    class="text-xs leading-relaxed text-gray-400">
                    {{ $lang.rememberToLookInYourSpamFolder || 'Remember to check your spam folder.' }}
                </p>

                <button
                    v-if="content.showUnavailable"
                    @click="emit('unavailable')"
                    class="text-schedule-text-brand-primary text-sm font-medium hover:underline">
                    {{ $lang.securityVerficationUnAvailable || 'Security verification unavailable?' }}
                </button>

                <button
                    v-if="content.showBackupLink"
                    @click="emit('use-backup')"
                    class="group text-schedule-text-brand-primary mx-auto flex items-center justify-center gap-1.5 text-sm font-medium">
                    <span>{{ $lang.loginWithBackupCode || 'Use backup code' }}</span>
                    <RightArrowIcon class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                    v-if="content.showBackToSelection"
                    @click="emit('close')"
                    class="text-schedule-text-brand-primary mx-auto flex items-center justify-center gap-1.5 text-sm font-medium hover:underline">
                    <span>←</span>
                    <span>{{ $lang.backToSelection || 'Back' }}</span>
                </button>
            </div>

            <div class="mt-8 flex items-center justify-center gap-2 text-gray-400 select-none">
                <SecurityNoticeIcon :size="18" />
                <span class="text-schedule-text-tertiary text-xs font-medium">
                    {{ $lang.protectedBySchedule || 'Protected by Schedule' }}
                </span>
            </div>
        </div>
    </div>
</template>
