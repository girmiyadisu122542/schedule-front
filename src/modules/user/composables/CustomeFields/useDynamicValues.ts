import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { computed, reactive, ref } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import type { ConfirmState } from '@/types/CommonTypes';
import { useLanguageStore } from '@/stores/languageStore';
import { normalizeErrors } from '@/utils/errorFormatter';
import { ACTIVE_STATUS, INACTIVE_STATUS } from '@/config/appConfig';
import { type CustomField } from '@/modules/user/types/CutsomeFields/customeFields';
import { useAddedValue } from '@/modules/user/composables/CustomeFields/useAddedValue';

import type { FormField } from '@/components/common/Modal.vue';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import type { TableColumn } from '@/components/common/DynamicTable.vue';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import ListIcon from '@/assets/icons/ListIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import InvoiceIcon from '@/assets/icons/InvoiceIcon.vue';
import InfoAltIcon from '@/assets/icons/InfoAltIcon.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';
import InactiveToggleIcon from '@/assets/icons/InactiveToggleIcon.vue';
import ActiveToggleIcon from '@/assets/icons/ActiveToggleIcon.vue';
import ChangeStatusIcon from '@/assets/icons/ChangeStatusIcon.vue';

interface FetchParams {
    page?: number;
    perPage?: number;
    search?: string;
}
const formData = reactive({
    id: null as number | null,
    name: '',
    description: '',
    applies_to_model: [] as (string | number)[],
    look_type_id: '',
    from_value_id: '',
    to_value_id: ''
});

const savedTabs = reactive({
    basic: false,
    values: false,
    transitions: false
});
const activeCreateTab = ref('basic');
const tabsOrder = ['basic', 'values', 'transitions'];

const isSaved = ref(false);
const isLoading = ref(false);
const isEditing = ref(false);
const lastSavedId = ref<number | null>(null);
const transitionsRow = ref<any[]>([]);
const lookupValuesOptions = ref<any[]>([]);

export function useDynamicValues() {
    const { handleValuesSubmit } = useAddedValue();

    const router = useRouter();

    const languageStore = useLanguageStore();
    const { translations } = storeToRefs(languageStore);

    const fields = ref<CustomField[]>([]);
    const searchQuery = ref('');
    const isPickRule = ref(false);
    const isPreviewVisible = ref(true);
    const activeSub = ref('type');
    const currentPage = ref<number>(1);
    const limit = ref<number>(10);
    const isDetailOpened = ref(false);
    const dialogVisible = ref(false);
    const isModalVisible = ref(false);
    const selectedData = ref<any | null>(null);
    const formErrors = ref<Record<string, string>>({});
    const filters = ref<Record<string, any>>({});

    const models = ref<{
        data: any[];
        pagination: any;
    }>({
        data: [],
        pagination: null
    });
    const types = ref<{
        data: CustomField[];
        pagination: any;
    }>({
        data: [],
        pagination: null
    });
    const transitions = ref<{
        data: CustomField[];
        pagination: any;
    }>({
        data: [],
        pagination: null
    });

    const filteredModelOptions = computed(() =>
        models.value.data.map((model: any) => ({
            label: model.name,
            value: model.key
        }))
    );

    const filteredTypeOptions = computed(() =>
        types.value.data.map((type: any) => ({
            label: type.display_name,
            value: type.id
        }))
    );

    const fetchLookupValues = async (lookupTypeId: string | number) => {
        try {
            const response = await axiosInstance.get(`lookup/get-type-values/${lookupTypeId}`, {
                params: {
                    dropdown: true
                }
            });
            lookupValuesOptions.value = response.data.data.map((val: any) => ({
                label: val.display_name || val.name,
                value: val.id
            }));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error fetching lookup values');
        }
    };

    const addRow = () => {
        transitionsRow.value.push({
            from_value: null,
            to_value: null
        });
    };

    const columns: TableColumn[] = [
        {
            key: 'product_id_select',
            label: translations.value.ingredientProduct || 'Ingredient Product',
            visible: true
        },
        { key: 'unit_id_select', label: translations.value.measurementUnit || 'Measurement Unit', visible: true },
        { key: 'quantity_number', label: translations.value.requiredQuanitity || 'Required Quantity', visible: true },
        {
            key: 'waste_percentage_number',
            label: translations.value.wasteInPercent || 'Waste In Percentage (%)',
            visible: true
        },
        { key: 'is_optional_checkbox', label: translations.value.isOptional || 'Is Optional', visible: true },
        {
            key: 'alternatives',
            label: translations.value.ingredientAlternative || 'Ingredient Alternatives',
            visible: true
        }
    ];
    const tabOptions = computed(() => [
        {
            id: 1,
            label: translations.value.valueType,
            value: 'type',
            icon: ListIcon
        },
        {
            id: 2,
            label: translations.value.addDynamicValue,
            value: 'value',
            icon: InvoiceIcon
        }
    ]);
    const createTabOptions = computed(() => [
        {
            id: 1,
            label: translations.value.basicInfo,
            value: 'basic',
            icon: InfoAltIcon
        },
        {
            id: 2,
            label: translations.value.addedValues,
            value: 'values',
            icon: InvoiceIcon
        },
        {
            id: 3,
            label: translations.value.allowedTransitions,
            value: 'transitions',
            icon: RefreshIcon
        }
    ]);

    const tableColumns = [
        { key: 'display_name', label: translations.value.name },
        { key: 'applies_to_model', label: translations.value.appliesTo },
        { key: 'is_system', label: translations.value.definedBY },
        { key: 'status_lookup_value', label: translations.value.status },
        { key: 'state_data', label: translations.value.state }
    ];
    const lookupValuesTableColumn = [
        { key: 'from_value', label: translations.value.from },
        { key: 'to_value', label: translations.value.to },
        { key: 'state_data', label: translations.value.state },
        { key: 'action', label: translations.value.action }
    ];
    const valueFields = computed<FormField[]>(() => {
        const fields: FormField[] = [
            {
                key: 'name',
                label: translations.value.name,
                type: 'text',
                placeholder: translations.value.enterName,
                colSpan: 'md:col-span-2'
            },
            {
                key: 'applies_to_model',
                label: translations.value.selectModel,
                placeholder: translations.value.selectModel,
                type: 'multi-select',
                options: filteredModelOptions.value,
                colSpan: 'md:col-span-2'
            }
        ];

        return fields;
    });

    const openDetailModal = (item: CustomField) => {
        isDetailOpened.value = true;
        selectedData.value = item;
    };

    const openFullDetailFromModal = () => {
        if (!selectedData.value) return;

        const data = selectedData.value;

        formData.id = data.id;
        formData.name = data?.name;
        formData.description = data.description;
        formData.applies_to_model = data.applies_to_model || [];

        savedTabs.basic = true;
        savedTabs.values = data.values && data.values.length > 0;
        savedTabs.transitions = data.transitions && data.transitions.length > 0;

        const { fetchExistingValues } = useAddedValue();
        fetchExistingValues(data.id);

        isDetailOpened.value = false;
        activeCreateTab.value = 'basic';
        router.push({ name: 'CreateLookupType' });
    };
    const getActionOptions = (item: any) => {
        const options: ActionOption[] = [
            {
                label: translations.value.view || 'View',
                icon: EyeIcon,
                onClick: () => openDetailModal(item)
            }
        ];

        if (!item.is_system) {
            options.push({
                label: translations.value.edit || 'Edit',
                icon: EditIcon,
                onClick: () => openEditModal(item)
            });
        }

        options.push(
            {
                label: translations.value.addDynamicValue || 'Add Dynamic Values',
                icon: PlusIcon,
                onClick: () => toggleDynamicValueModal(item)
            },
            {
                label:
                    Number(item.state) === ACTIVE_STATUS
                        ? translations.value.deactivate || 'Deactivate'
                        : translations.value.activate || 'Activate',
                icon: Number(item.state) === ACTIVE_STATUS ? InactiveToggleIcon : ActiveToggleIcon,
                onClick: () => changeLookupTypeStateState(item)
            },
            {
                label: translations.value.changeStatus || 'Change Status',
                icon: ChangeStatusIcon,
                onClick: () => openChangeStatusModal(item)
            },
            {
                label: translations.value.delete || 'Delete',
                icon: TrashIcon,
                variant: 'danger' as const,
                onClick: () => initiateDelete(item)
            }
        );

        return options;
    };
    const openEditModal = (item: any) => {
        isEditing.value = true;
        formData.id = item.id;
        formData.name = item.name;
        formData.applies_to_model = item.applies_to_model || [];
        formData.description = item.description;
        const { fetchExistingValues } = useAddedValue();
        fetchExistingValues(item.id);
        isModalVisible.value = true;
        dialogVisible.value = true;
    };
    const fetchTypes = async (params: FetchParams = {}) => {
        isLoading.value = true;

        try {
            const response = await axiosInstance.get('/lookup/types', {
                params: {
                    page: params.page ?? currentPage.value,
                    limit: params.perPage ?? limit.value,
                    search: searchQuery.value || undefined
                }
            });

            types.value = {
                data: response.data.data ?? response.data,
                pagination: response.data.pagination ?? null
            };
        } finally {
            isLoading.value = false;
        }
    };
    const filterFields = computed(() => {
        const fields: any[] = [];

        fields.push({
            label: translations.value.models || 'Models',
            key: 'applies_to_model',
            options: models.value.data.map((et) => ({
                label: et.name || et.name,
                value: et.key
            }))
        });

        fields.push({
            label: translations.value.state || 'State',
            key: 'state',
            options: [
                { label: translations.value.active || 'Active', value: ACTIVE_STATUS },
                { label: translations.value.inactive || 'Inactive', value: INACTIVE_STATUS }
            ]
        });

        fields.push({
            label: translations.value.definedBy || 'Defined By',
            key: 'is_system',
            options: [
                { label: translations.value.system || 'System', value: true },
                { label: translations.value.custom || 'Custom', value: false }
            ]
        });

        return fields;
    });

    const handleFilterChange = (filterValues: Record<string, any>) => {
        filters.value = filterValues;
        fetchTypes({ page: 1 });
    };

    const openChangeStatusModal = (item: any) => {};

    const changeLookupTypeStateState = async (item: any) => {
        const newState = Number(item.state) === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
        try {
            await axiosInstance.get(`/lookup/types/${item.id}/change-state`, { params: { state: newState } });
            const message =
                newState === ACTIVE_STATUS
                    ? translations.value.lookupTypeSuccessfullyActivated || 'Lookup Type activated'
                    : translations.value.lookupTypeSuccessfullyDeactivated || 'Lookup Type deactivated';
            toast.success(message);
            fetchTypes();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || translations.value.somethingWentWrong);
        }
    };

    const fetchModels = async (params: FetchParams = {}) => {
        isLoading.value = true;

        try {
            const response = await axiosInstance.get('/models', {
                params: {
                    page: params.page ?? currentPage.value,
                    limit: params.perPage ?? limit.value,
                    search: searchQuery.value || undefined
                }
            });

            models.value = {
                data: response.data.data ?? response.data,
                pagination: response.data.pagination ?? null
            };
        } finally {
            isLoading.value = false;
        }
    };

    const fetchTransitions = async (params: FetchParams = {}) => {
        isLoading.value = true;

        try {
            const response = await axiosInstance.get('/lookup/transitions', {
                params: {
                    page: params.page ?? currentPage.value,
                    limit: params.perPage ?? limit.value,
                    search: searchQuery.value || undefined
                }
            });

            transitions.value = {
                data: response.data.data ?? response.data,
                pagination: response.data.pagination ?? null
            };
        } finally {
            isLoading.value = false;
        }
    };

    const clearError = (field: string) => {
        if (formErrors.value[field]) {
            delete formErrors.value[field];
        }
    };
    const confirmState = ref<ConfirmState>({
        show: false,
        title: '',
        message: '',
        type: 'info',
        confirmLabel: '',
        loading: false,
        onConfirm: () => {}
    });
    const initiateDelete = (item: CustomField) => {
        selectedData.value = item;
        confirmState.value = {
            show: true,
            title: `${translations.value.deleteConfirmTitle}`,
            message: `${translations.value.deleteConfirmMessage} ${item.name}?`,
            type: 'danger',
            confirmLabel: translations.value.delete || 'Delete',
            loading: false,
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    const response = await axiosInstance.delete(`/lookup/types/${item.id}`);
                    toast.success(response.data.message);
                    confirmState.value.show = false;
                    fetchTypes();
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || translations.value.somethingWentWrong;
                    toast.error(errorMessage);
                    confirmState.value.show = false;
                } finally {
                    confirmState.value.loading = false;
                }
            }
        };
    };
    const initiateTranstionDelete = (item: any) => {
        selectedData.value = item;
        confirmState.value = {
            show: true,
            title: `${translations.value.deleteConfirmTitle}`,
            message: `${translations.value.deleteConfirmMessage}?`,
            type: 'danger',
            confirmLabel: translations.value.delete || 'Delete',
            loading: false,
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    const response = await axiosInstance.delete(`/lookup/transitions/${item.id}`);
                    toast.success(response.data.message);
                    confirmState.value.show = false;
                    fetchTransitions();
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || translations.value.somethingWentWrong;
                    toast.error(errorMessage);
                    confirmState.value.show = false;
                } finally {
                    confirmState.value.loading = false;
                }
            }
        };
    };
    const toggleModal = () => {
        isModalVisible.value = !isModalVisible.value;

        if (isModalVisible.value === true) {
            isEditing.value = false;
            formErrors.value = {};

            Object.keys(formData).forEach((key) => {
                if (key === 'id') {
                    formData[key] = null;
                }
            });
        }
        dialogVisible.value = true;
    };
    const toggleDynamicValueModal = (data: any) => {
        activeCreateTab.value = 'values';
        formData.id = data?.id;
        console.log('Setting ID to:', data?.id);
        router.push({ name: 'CreateLookupType' });
    };
    const currentTabSavedStatus = computed(() => {
        return savedTabs[activeCreateTab.value as keyof typeof savedTabs];
    });
    const handleSubmit = async (submittedData: any) => {
        formErrors.value = {};
        isLoading.value = true;

        try {
            let success = false;
            let responseMessage = '';

            if (activeCreateTab.value === 'basic') {
                if (isEditing.value && formData.id) {
                    const response = await axiosInstance.put(`/lookup/types/${formData.id}`, submittedData);
                    responseMessage = response.data.message;
                    success = true;
                } else {
                    const response = await axiosInstance.post('/lookup/types', submittedData);
                    const newId = response.data.data?.id || response.data.id;
                    lastSavedId.value = newId;
                    formData.id = newId;
                    success = true;
                    responseMessage = response.data.message;
                    savedTabs.basic = true;
                }
                fetchTypes();
            } else if (activeCreateTab.value === 'values') {
                const targetId = formData.id || lastSavedId.value;
                if (!targetId) {
                    toast.error(translations.value.noLookupTypeSelected);
                    return;
                }
                const result = await handleValuesSubmit(targetId);
                success = result ?? false;
                savedTabs.values = true;
                if (success) await fetchLookupValues(targetId);
            } else if (activeCreateTab.value === 'transitions') {
                const response = await axiosInstance.post('/lookup/transitions', submittedData);
                responseMessage = response.data.message;
                success = true;
                savedTabs.transitions = true;
                fetchTransitions();
            }
            if (success) {
                if (responseMessage) {
                    toast.success(responseMessage || translations.value.success);
                    isModalVisible.value = false;
                }

                const currentIndex = tabsOrder.indexOf(activeCreateTab.value);
                if (currentIndex !== -1 && currentIndex < tabsOrder.length - 1) {
                    const nextTab = tabsOrder[currentIndex + 1];
                    if (nextTab) {
                        activeCreateTab.value = nextTab;
                    }
                    if (nextTab === 'values' && formData.id) {
                        const { fetchExistingValues } = useAddedValue();
                        await fetchExistingValues(formData.id);
                    }
                } else {
                    isModalVisible.value = false;
                    dialogVisible.value = false;
                    resetState();
                }
            }
        } catch (error: any) {
            if (error.response?.status === 422 && error.response.data.errors) {
                formErrors.value = normalizeErrors(error.response.data.errors);
                const errorMessage =
                    error.response.data.message || translations.value.validationError || 'Please check the fields';
                toast.error(errorMessage);
            } else {
                const message = error.response?.data?.message || translations.value.somethingWentWrong;
                toast.error(message);
            }
        } finally {
            isLoading.value = false;
        }
    };
    const resetState = () => {
        isEditing.value = false;
        formData.id = null;
        formData.name = '';
        formData.description = '';
        formData.applies_to_model = [];
        savedTabs.basic = false;
        savedTabs.values = false;
        savedTabs.transitions = false;
    };
    const handleSearch = (value: string): void => {
        searchQuery.value = value;
        fetchTypes({ page: 1 });
    };
    return {
        fields,
        isPreviewVisible,
        isPickRule,
        tabOptions,
        tableColumns,
        lookupValuesTableColumn,
        models,
        types,
        isSaved,
        formData,
        activeSub,
        isDetailOpened,
        isModalVisible,
        isEditing,
        isLoading,
        valueFields,
        activeCreateTab,
        formErrors,
        dialogVisible,
        filteredModelOptions,
        filteredTypeOptions,
        confirmState,
        selectedData,
        transitions,
        createTabOptions,
        savedTabs,
        lastSavedId,
        currentTabSavedStatus,
        lookupValuesOptions,
        filterFields,
        columns,
        transitionsRow,
        addRow,
        handleFilterChange,
        initiateTranstionDelete,
        openFullDetailFromModal,
        toggleModal,
        handleSubmit,
        clearError,
        getActionOptions,
        handleSearch,
        fetchModels,
        fetchTypes,
        fetchTransitions
    };
}
