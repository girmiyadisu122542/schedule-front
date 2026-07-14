<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Cookies from 'js-cookie';

import { use2FA } from '@/modules/user/composables/login/use2FA';
import { useForgotPassword } from '@/modules/user/composables/login/useForgotPassword';
import { useAuthStore } from '../../store/authStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import {
    VERIFICATION_MODES,
    VERIFICATION_STEPS,
    OTP_TYPES,
    type VerificationMode,
    type VerificationStep,
    type OtpType
} from '@/config/appConfig';

import ThemeToggle from '@/components/ThemeToggle.vue';
import NavBar from '@/modules/user/components/NavBar.vue';
import Footer from '@/modules/user/components/Footer.vue';
import VerificationMethod from '@/modules/user/views/Auth/VerificationMethod.vue';
import CodeVerification from '@/modules/user/components/Auth/CodeVerification.vue';

const route = useRoute();
const router = useRouter();

const mfaEmail = route.query.email as string | undefined;
const resetContact = route.query.contact as string | undefined;
const resetType = (Number(route.query.type) as OtpType) || OTP_TYPES.RESET;

const isMfaFlow = computed(() => !!mfaEmail && !resetContact);
const isResetFlow = computed(() => !!resetContact && !mfaEmail);

const { verifyLoginOtp, verifyBackupCode, sendLoginOtp } = use2FA();
const { verifyOtp: verifyResetOtp, resendOtp: resendResetOtp } = useForgotPassword();

const currentStep = ref<VerificationStep>(
    isMfaFlow.value || isResetFlow.value ? VERIFICATION_STEPS.CODE : VERIFICATION_STEPS.LIST
);
const selectedMethod = ref<VerificationMode>(VERIFICATION_MODES.EMAIL);
const targetValue = ref(mfaEmail || resetContact || '');

if (isMfaFlow.value && mfaEmail) {
    sendLoginOtp(mfaEmail);
}

const onMethodChosen = (methodId: string) => {
    selectedMethod.value = methodId as VerificationMode;
    targetValue.value =
        methodId === VERIFICATION_MODES.EMAIL
            ? 'k********@gmail.com'
            : methodId === VERIFICATION_MODES.SMS
              ? '+251 912 *** 78'
              : '';
    currentStep.value = VERIFICATION_STEPS.CODE;
};

const handleVerify = async (otp: string) => {
    if (isMfaFlow.value && mfaEmail) {
        if (currentStep.value === VERIFICATION_STEPS.BACKUP) {
            await verifyBackupCode(mfaEmail, otp);
        } else {
            await verifyLoginOtp(mfaEmail, otp);
        }
    } else if (isResetFlow.value && resetContact) {
        await verifyResetOtp(resetContact, otp);
    }
};

const handleResend = () => {
    if (isMfaFlow.value && mfaEmail) {
        sendLoginOtp(mfaEmail);
    } else if (isResetFlow.value && resetContact) {
        resendResetOtp(resetContact, resetType);
    }
};

const goToBackup = () => {
    selectedMethod.value = VERIFICATION_MODES.BACKUP;
    targetValue.value = '';
    currentStep.value = VERIFICATION_STEPS.BACKUP;
};

const goBack = () => {
    if (isMfaFlow.value || isResetFlow.value) {
        router.push(isResetFlow.value ? '/forgot-password' : '/login');
    } else {
        currentStep.value = VERIFICATION_STEPS.LIST;
    }
};

const handleExitFlow = async () => {
    const authStore = useAuthStore();
    const allowedRoutesStore = useAllowedRoutesStore();
    Cookies.remove('token');
    authStore.user = null;
    allowedRoutesStore.isInitialized = false;
    await router.push({ name: 'Login' });
};

const currentMode = computed((): VerificationMode => {
    if (currentStep.value === VERIFICATION_STEPS.BACKUP) return VERIFICATION_MODES.BACKUP;
    if (isMfaFlow.value || isResetFlow.value) return VERIFICATION_MODES.EMAIL;
    return selectedMethod.value;
});
</script>

<template>
    <div class="flex w-full items-center justify-between px-4 dark:bg-slate-900">
        <div class="flex items-center">
            <NavBar />
        </div>
        <div class="flex items-center">
            <ThemeToggle />
        </div>
    </div>

    <div class="dark:bg-slate-900">
        <transition
            name="fade"
            mode="out-in">
            <VerificationMethod
                v-if="currentStep === VERIFICATION_STEPS.LIST"
                @select-method="onMethodChosen"
                @use-backup="goToBackup"
                @close="handleExitFlow" />

            <CodeVerification
                v-else
                :mode="currentMode"
                :target="targetValue"
                @close="goBack"
                @verify="handleVerify"
                @resend="handleResend"
                @unavailable="goBack"
                @use-backup="goToBackup" />
        </transition>
    </div>
    <Footer />
</template>
