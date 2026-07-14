import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import { OTP_TYPES, type OtpType } from '@/config/appConfig';

const ROUTES = {
    OTP_VERIFICATION: 'OTPVerification',
    RESET_PASSWORD: 'ResetPassword',
    LOGIN: 'Login',
} as const;

export function useForgotPassword() {
    const router = useRouter();
    const { translations } = storeToRefs(useLanguageStore()) as any;

    const isSubmitting = ref(false);
    const errors = reactive<Record<string, string>>({});

    const clearError = (field: string) => { errors[field] = ''; };

    const handleApiError = (error: any) => {
        const data = error?.response?.data;
        if (data?.errors) {
            Object.entries(data.errors).forEach(([field, messages]) => {
                errors[field] = Array.isArray(messages) ? messages[0] : (messages as string);
            });
        } else {
            toast.error(data?.message || translations.value?.somethingWentWrong || 'Something went wrong');
        }
    };

    const sendOtp = async (email: string) => {
        Object.keys(errors).forEach((k) => (errors[k] = ''));
        isSubmitting.value = true;
        try {
            await axiosInstance.post('/forget-password', { email });
            toast.success(translations.value?.otpSent || 'OTP sent to your email');
            router.push({ name: ROUTES.OTP_VERIFICATION, query: { contact: email, type: OTP_TYPES.RESET } });
        } catch (error: any) {
            handleApiError(error);
        } finally {
            isSubmitting.value = false;
        }
    };

    const verifyOtp = async (email: string, otpCode: string) => {
        Object.keys(errors).forEach((k) => (errors[k] = ''));
        isSubmitting.value = true;
        try {
            await axiosInstance.post('/verify-otp', {
                email,
                otp_code: otpCode,
                type: OTP_TYPES.RESET,
            });

            router.push({ name: ROUTES.RESET_PASSWORD, query: { contact: email } });

        } catch (error: any) {
            handleApiError(error);
        } finally {
            isSubmitting.value = false;
        }
    };

    const resetPassword = async (email: string, newPassword: string) => {
        Object.keys(errors).forEach((k) => (errors[k] = ''));
        isSubmitting.value = true;
        try {
            await axiosInstance.post('/reset-password', {
                email,
                new_password: newPassword,
                new_password_confirmation: newPassword,
            });

            toast.success(translations.value?.passwordResetSuccessfully || 'Password reset successfully');

            router.push({ name: ROUTES.LOGIN });
        } catch (error: any) {
            handleApiError(error);
        } finally {
            isSubmitting.value = false;
        }
    };

    const resendOtp = async (email: string, type: OtpType = OTP_TYPES.RESET) => {
        isSubmitting.value = true;
        try {
            await axiosInstance.post('/resend-otp', { email, type });
            toast.success(translations.value?.otpResent || 'OTP resent');
        } catch (error: any) {
            handleApiError(error);
        } finally {
            isSubmitting.value = false;
        }
    };

    return {
        isSubmitting,
        errors,

        clearError,
        sendOtp,
        verifyOtp,
        resetPassword,
        resendOtp
    };
}
