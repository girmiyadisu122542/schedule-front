import { toast } from 'vue-sonner';
import { reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';

import axiosInstance from '@/api/axiosInstance';
import type { ConfirmState } from '@/types/CommonTypes';
import { useLanguageStore } from '@/stores/languageStore';
import { type AddedValues } from '@/modules/user/types/CutsomeFields/customeFields';

const isSubmitting = ref(false);
const fields = ref<AddedValues[]>([]);
const confirmState = ref<ConfirmState>({
    show: false,
    title: '',
    message: '',
    type: 'info',
    confirmLabel: '',
    loading: false,
    onConfirm: () => {}
});
export function useAddedValue() {
    const languageStore = useLanguageStore();
    const { translations } = storeToRefs(languageStore);

    const isPickRule = ref(false);
    const isPreviewVisible = ref(true);

    const models = ref<{
        data: AddedValues[];
        pagination: any;
    }>({
        data: [],
        pagination: null
    });

    const form = reactive({
        method: ''
    });

    const tableColumns = [
        { key: 'name', label: translations.value.name },
        { key: 'id', label: translations.value.id }
    ];
    const addField = () => {
        fields.value.push({
            id: crypto.randomUUID(),
            name: 'Rejected',
            color: '#FFFFFF',
            order: 1,
            is_default: true,
            icon: null as File | null,
            isExpanded: true,
            lookup_type_id: ''
        });
    };

    const initiateDelete = (field: any) => {
        if (typeof field.id !== 'number') {
            fields.value = fields.value.filter((f) => f.id !== field.id);
            return;
        }

        confirmState.value.show = true;
        confirmState.value.title = translations.value.deleteConfirmTitle || 'Delete Value';
        confirmState.value.message = translations.value.deleteConfirmMessage;
        confirmState.value.confirmLabel = translations.value.delete || 'delete';
        confirmState.value.type = 'danger';
        confirmState.value.onConfirm = async () => {
            confirmState.value.loading = true;
            try {
                const response = await axiosInstance.delete(`/lookup/values/${field.id}`);

                fields.value = fields.value.filter((f) => f.id !== field.id);

                toast.success(response.data.message || translations.value.deletedSuccessfully);
                confirmState.value.show = false;
            } catch (error: any) {
                toast.error(error.response?.data?.message || translations.value.deleteFailed);
            } finally {
                confirmState.value.loading = false;
            }
        };
    };
    const initiateUpdate = async (field: any) => {
        if (typeof field.id !== 'number') {
            toast.info('Change saved locally. Use main Save to commit.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('lookup_type_id', String(field.lookup_type_id));
            formData.append('name', field.name);
            formData.append('display_name', field.name);
            formData.append('color', field.color);
            formData.append('is_default', field.is_default ? '1' : '0');
            formData.append('order', String(field.order));

            if (field.icon instanceof File) {
                formData.append('icon', field.icon);
            }

            const response = await axiosInstance.post(`/lookup/values/${field.id}`, formData);
            toast.success(response.data.message || 'Value updated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update');
        } finally {
        }
    };
    const removeField = (id: string) => {};

    const toggleRulePicker = () => {
        isPickRule.value = !isPickRule.value;
    };

    const resetFields = () => {
        fields.value = [];
    };

    const handleValuesSubmit = async (typeId: string | number) => {
        if (!typeId) {
            toast.error('Lookup Type ID is missing');
            return;
        }

        if (fields.value.length === 0) {
            toast.error(translations.value.addAtLeastOneValue || 'Add at least one value');
            return;
        }

        isSubmitting.value = true;

        try {
            const formData = new FormData();

            formData.append('lookup_type_id', String(typeId));

            fields.value.forEach((field, index) => {
                if (typeof field.id === 'number') {
                    formData.append(`values[${index}][id]`, String(field.id));
                }
                formData.append(`values[${index}][name]`, field.name);
                formData.append(`values[${index}][color]`, field.color || '#FFFFFF');
                formData.append(`values[${index}][order]`, String(field.order || index + 1));
                formData.append(`values[${index}][is_default]`, field.is_default ? '1' : '0');

                if (field.icon instanceof File) {
                    formData.append(`values[${index}][icon]`, field.icon);
                }
            });

            const response = await axiosInstance.post(`/lookup/values/bulk`, formData);
            toast.success(response.data.message || translations.value.savedSuccessfully || 'Value added Successfully');
            fields.value = [];
            return true;
        } catch (error: any) {
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const errorArray = Object.values(validationErrors)[0] as string[] | undefined;
                const firstErrorMessage = errorArray?.[0] ?? translations.value.somethingWentWrong;

                toast.error(firstErrorMessage);
            } else {
                toast.error(error.response?.data?.message ?? translations.value.somethingWentWrong);
            }
            return false;
        } finally {
            isSubmitting.value = false;
        }
    };

    const fetchExistingValues = async (lookupTypeId: number | string) => {
        isSubmitting.value = true;
        try {
            const response = await axiosInstance.get(`/lookup/get-type-values/${lookupTypeId}`);
            const data = response.data.data || response.data;

            fields.value = data.map((val: any) => ({
                id: val.id,
                name: val.display_name || val.name,
                color: val.color || '#FFFFFF',
                order: val.order,
                is_default: !!val.is_default,
                icon: val.icon,
                isExpanded: false,
                lookup_type_id: lookupTypeId
            }));
        } catch (error) {
            toast.error('Failed to load existing values');
        } finally {
            isSubmitting.value = false;
        }
    };
    return {
        fields,
        isPreviewVisible,
        isPickRule,
        tableColumns,
        confirmState,
        models,
        form,
        toggleRulePicker,
        addField,
        initiateUpdate,
        removeField,
        handleValuesSubmit,
        fetchExistingValues,
        initiateDelete
    };
}
