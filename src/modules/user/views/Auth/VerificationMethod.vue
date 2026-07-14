<script setup lang="ts">
import type { Component } from 'vue';
import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';
import { VERIFICATION_MODES, type VerificationMode } from '@/config/appConfig';
import MailIcon from '@/assets/icons/MailIcon.vue';
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import LockIcon from '@/components/common/LockIcon.vue';
import ChatBubbleIcon from '@/assets/icons/ChatBubbleIcon.vue';
import MailRoundedIcon from '@/assets/icons/MailRoundedIcon.vue';
import SecurityNoticeIcon from '@/assets/icons/SecurityNoticeIcon.vue';
import RightArrowIcon from '@/assets/icons/RightArrowIcon.vue';

interface VerificationMethodOption {
    id: VerificationMode;
    label: string;
    description: string;
    icon: Component;
    available: boolean;
}

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'select-method', methodId: string): void;
    (e: 'use-backup'): void;
}>();

const { translations } = storeToRefs(useLanguageStore());

const verificationMethods: VerificationMethodOption[] = [
    {
        id: VERIFICATION_MODES.EMAIL,
        label: translations.value.email || 'Email',
        description: translations.value.receiveCodeViaEmail || 'Receive code via email',
        icon: MailRoundedIcon,
        available: true
    },
    {
        id: VERIFICATION_MODES.SMS,
        label: translations.value.sms || 'SMS',
        description: translations.value.receiveCodeViaSms || 'Receive code via SMS',
        icon: ChatBubbleIcon,
        available: false
    },
    {
        id: VERIFICATION_MODES.AUTHENTICATOR,
        label: translations.value.authenticatorApp || 'Authenticator App',
        description: translations.value.useAuthenticatorApp || 'Use your authenticator app',
        icon: MailIcon,
        available: false
    }
];

const handleSelect = (method: VerificationMethodOption): void => {
    if (!method.available) return;
    emit('select-method', method.id);
};
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

            <div class="mb-8 flex flex-col items-center text-center">
                <div class="mb-4 rounded-2xl bg-blue-50 p-4 text-blue-500 dark:bg-blue-900/20">
                    <LockIcon />
                </div>
                <h1
                    class="text-schedule-text-primary dark:text-schedule-text-tertiary mb-2 text-2xl font-semibold md:text-3xl">
                    {{ $lang.securityVerification || 'Security Verification' }}
                </h1>
                <p class="text-schedule-text-tertiary text-base">
                    {{ $lang.chooseAlternativeVerificationMethod || 'Choose a verification method' }}
                </p>
            </div>

            <div class="mb-8 space-y-3">
                <button
                    v-for="method in verificationMethods"
                    :key="method.id"
                    @click="handleSelect(method)"
                    :disabled="!method.available"
                    :class="[
                        'group relative flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all',
                        method.available
                            ? 'hover:border-schedule-border-brand cursor-pointer border-gray-200 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20'
                            : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900/30'
                    ]">
                    <div
                        :class="[
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            method.available
                                ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                        ]">
                        <component
                            :is="method.icon"
                            class="h-5 w-5" />
                    </div>

                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <span
                                :class="[
                                    'text-sm font-semibold',
                                    method.available
                                        ? 'text-schedule-text-primary group-hover:text-schedule-text-brand-primary'
                                        : 'text-gray-400'
                                ]">
                                {{ method.label }}
                            </span>
                            <span
                                v-if="!method.available"
                                class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                {{ $lang.comingSoon || 'Coming soon' }}
                            </span>
                        </div>
                        <p class="text-schedule-text-tertiary mt-0.5 truncate text-xs">
                            {{ method.description }}
                        </p>
                    </div>

                    <RightArrowIcon
                        v-if="method.available"
                        class="group-hover:text-schedule-text-brand-primary h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>

            <div class="flex flex-col items-center gap-3">
                <button
                    @click="emit('use-backup')"
                    class="group text-schedule-text-brand-primary flex items-center gap-1.5 text-sm font-medium transition-all hover:underline">
                    <span>{{ $lang.loginWithBackupCode || 'Use backup code instead' }}</span>
                    <RightArrowIcon class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div class="mt-2 flex items-center gap-2 text-gray-400 select-none">
                    <SecurityNoticeIcon :size="16" />
                    <span class="text-schedule-text-tertiary text-xs font-medium">
                        {{ $lang.protectedBySchedule || 'Protected by Schedule' }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
