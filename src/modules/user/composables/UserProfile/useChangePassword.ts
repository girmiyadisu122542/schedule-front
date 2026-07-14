import { reactive, ref } from 'vue';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';

export function useChangePassword() {
    const { translations } = storeToRefs(useLanguageStore()) as any;

    const isPending = ref(false);
    const errors = reactive<Record<string, string>>({});

    const form = reactive({
        old_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const clearErrors = () => Object.keys(errors).forEach((k) => (errors[k] = ''));

    const clearForm = () => {
        form.old_password = '';
        form.new_password = '';
        form.new_password_confirmation = '';
        clearErrors();
    };

    const submit = async (): Promise<boolean> => {
        clearErrors();

        if (form.new_password !== form.new_password_confirmation) {
            errors['new_password_confirmation'] = translations.value?.passwordsDoNotMatch || 'Passwords do not match';
            return false;
        }

        isPending.value = true;
        try {
            const response = await axiosInstance.post('/account/change-password', {
                old_password: form.old_password,
                new_password: form.new_password,
                new_password_confirmation: form.new_password_confirmation,
            });
            toast.success(response.data?.message || translations.value?.passwordChangedSuccessfully || 'Password changed successfully');
            clearForm();
            return true;
        } catch (error: any) {
            const data = error?.response?.data;
            if (data?.errors) {
                Object.entries(data.errors).forEach(([field, messages]) => {
                    errors[field] = Array.isArray(messages) ? messages[0] : (messages as string);
                });
            } else {
                toast.error(data?.message || translations.value?.somethingWentWrong || 'Something went wrong');
            }
            return false;
        } finally {
            isPending.value = false;
        }
    };

    return { form, errors, isPending, submit, clearForm };
}
