import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import Cookies from 'js-cookie';
import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/modules/user/store/authStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { ACCESS_TOKEN_KEY } from '@/config/appConfig';

export function use2FA() {
    const router = useRouter();
    const authStore = useAuthStore();
    const allowedRoutesStore = useAllowedRoutesStore();
    const { translations } = storeToRefs(useLanguageStore()) as any;

    const isSubmitting = ref(false);
    const errorMessage = ref('');

    const handleError = (error: any) => {
        const msg = error?.response?.data?.message || translations.value?.somethingWentWrong || 'Something went wrong';
        errorMessage.value = msg;
        toast.error(msg);
    };

    const finishLogin = async (token: string) => {
        Cookies.set(ACCESS_TOKEN_KEY, token);
        authStore.token = token;
        await authStore.initialize();
        toast.success(translations.value?.loginSuccessful || 'Login successful!');
        await allowedRoutesStore.fetchAllowedRoutes();
        router.push(allowedRoutesStore.authRedirect || '/dashboard');
    };

    const sendLoginOtp = async (email: string) => {
        isSubmitting.value = true;
        errorMessage.value = '';
        try {
            await axiosInstance.post('/2fa/send-otp', { email });
            toast.success(translations.value?.otpSent || 'OTP sent to your email');
        } catch (error: any) {
            handleError(error);
        } finally {
            isSubmitting.value = false;
        }
    };

    const verifyLoginOtp = async (email: string, otpCode: string) => {
        isSubmitting.value = true;
        errorMessage.value = '';
        try {
            const response = await axiosInstance.post('/2fa/verify-otp', { email, otp_code: otpCode });
            await finishLogin(response.data.token);
        } catch (error: any) {
            handleError(error);
        } finally {
            isSubmitting.value = false;
        }
    };

    const verifyBackupCode = async (email: string, backupCode: string) => {
        isSubmitting.value = true;
        errorMessage.value = '';
        try {
            const response = await axiosInstance.post('/2fa/verify-backup', { email, backup_code: backupCode });
            await finishLogin(response.data.token);
        } catch (error: any) {
            handleError(error);
        } finally {
            isSubmitting.value = false;
        }
    };

    const enable2FA = async (password: string): Promise<{ backup_codes: Array<{ value: string; used: boolean }> } | null> => {
        isSubmitting.value = true;
        errorMessage.value = '';
        try {
            const response = await axiosInstance.post('/account/2fa/enable-mfa', { password });
            toast.success(translations.value?.twoFaEnabledSuccessfully || '2FA enabled successfully');
            return response.data;
        } catch (error: any) {
            handleError(error);
            return null;
        } finally {
            isSubmitting.value = false;
        }
    };

    const disable2FA = async (password: string) => {
        isSubmitting.value = true;
        errorMessage.value = '';
        try {
            await axiosInstance.post('/account/2fa/disable', { password });
            toast.success(translations.value?.twoFaDisabledSuccessfully || '2FA disabled successfully');
            return true;
        } catch (error: any) {
            handleError(error);
            return false;
        } finally {
            isSubmitting.value = false;
        }
    };

    const regenerateBackupCodes = async (): Promise<string[] | null> => {
        isSubmitting.value = true;
        errorMessage.value = '';
        try {
            const response = await axiosInstance.post('/account/2fa/backup-code-regenerate');
            toast.success(translations.value?.backupCodesRegenerated || 'Backup codes regenerated');
            return response.data.backup_codes as string[];
        } catch (error: any) {
            handleError(error);
            return null;
        } finally {
            isSubmitting.value = false;
        }
    };

    return {
        isSubmitting,
        errorMessage,
        sendLoginOtp,
        verifyLoginOtp,
        verifyBackupCode,
        enable2FA,
        disable2FA,
        regenerateBackupCodes,
    };
}
