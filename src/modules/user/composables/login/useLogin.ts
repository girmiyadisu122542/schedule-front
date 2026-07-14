import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';

import { useLoginSchema } from '@/modules/user/schemas/Auth/loginSchema';
import { useAuthStore } from '@/modules/user/store/authStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useLanguageStore } from '@/stores/languageStore';

export function useLogin() {
    const router = useRouter();
    const authStore = useAuthStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    const { translations } = storeToRefs(useLanguageStore()) as any;

    const formData = reactive({
        username: '',
        password: '',
        rememberMe: false
    });

    const errors = reactive<{ username?: string; password?: string }>({});
    const generalError = ref('');
    const isSubmitting = ref<boolean>(false);
    const showPassword = ref<boolean>(false);

    const clearError = (field: keyof typeof errors) => {
        errors[field] = '';
    };

    const handleSubmit = async () => {
        generalError.value = '';
        errors.username = '';
        errors.password = '';

        const schemaRef = useLoginSchema();
        const result = schemaRef.value.safeParse(formData);

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof typeof errors;
                errors[field] = issue.message;
            });
            return;
        }

        isSubmitting.value = true;

        try {
            const result = await authStore.login(formData.username, formData.password);

            if (result.mfa_required) {
                router.push({ name: 'OTPVerification', query: { email: result.email } });
                return;
            }

            toast.success(translations.value.loginSuccessful || 'Login successful!');
            await allowedRoutesStore.fetchAllowedRoutes();
            router.push(allowedRoutesStore.authRedirect || '/dashboard');
        } catch (error: any) {
            const message = error || translations.value.somethingWentWrong || 'Something went wrong!';
            toast.error(message);
            generalError.value = message;
        } finally {
            isSubmitting.value = false;
        }
    };
    const checkRememberMe = () => {
        formData.rememberMe = !formData.rememberMe;
        authStore.rememberMe = formData.rememberMe;
    };

    const togglePasswordVisibility = () => {
        showPassword.value = !showPassword.value;
    };

    return {
        formData,
        errors,
        generalError,
        isSubmitting,
        showPassword,
        handleSubmit,
        checkRememberMe,
        togglePasswordVisibility,
        clearError
    };
}
