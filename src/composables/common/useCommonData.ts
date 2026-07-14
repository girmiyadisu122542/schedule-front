import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import axiosInstance from '@/api/axiosInstance';
import { createSharedComposable } from '@vueuse/core';
import { useLanguageStore } from '@/stores/languageStore';
import type { TreeNode } from '@/components/common/Collapsible.vue';
import {
    LOOKUP_STATUS_APPROV_FOR_ALL,
    LOOKUP_STATUS_APPROV_FOR_THIS,
    LOOKUP_STATUS_PENDING,
    LOOKUP_STATUS_REJECTED
} from '@/constants/statusOptions';
import { ISO_COUNTRY_CODE_LENGTH, REGIONAL_INDICATOR_OFFSET } from '@/config/appConfig';

interface CountryType {
    id: number;
    name: string;
    code: string;
    dial_code: string;
    flag: string;
}

function countryFlagEmoji(code?: string): string {
    if (!code || code.length !== ISO_COUNTRY_CODE_LENGTH) return '';
    return code.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(REGIONAL_INDICATOR_OFFSET + ch.charCodeAt(0)));
}

function getCommonData() {
    const { translations } = storeToRefs(useLanguageStore()) as any;

    const isLoading = ref<boolean>(false);
    const searchQuery = ref<string>('');
    const countries = ref<CountryType[]>([]);
    const showToast = ref(false);
    const toastMessage = ref('');
    const selectedValues = ref<any[]>([]);

    const resolveLookupValueStatusCss = (statusCode: string | null = null) => {
        switch (statusCode) {
            case LOOKUP_STATUS_PENDING:
                return 'bg-yellow-100 text-yellow-600';

            case LOOKUP_STATUS_APPROV_FOR_ALL:
                return 'bg-green-100 text-green-600';

            case LOOKUP_STATUS_APPROV_FOR_THIS:
                return 'bg-schedule-info-100 text-schedule-brand-blue';

            case LOOKUP_STATUS_REJECTED:
                return 'bg-red-100 text-red-600';

            default:
                return 'bg-blue-100 text-blue-600';
        }
    };

    // The address/country subsystem is not part of the Schedule starter kit.
    // Kept as a no-op so existing consumers (phone dial-code pickers, etc.)
    // still work without a country catalogue.
    async function fetchCountries() {
        countries.value = [];
    }

    const copy = async (value?: string) => {
        if (!value) return;

        await navigator.clipboard.writeText(value);

        toastMessage.value = translations.value?.copied || 'Copied!';
        showToast.value = true;

        setTimeout(() => {
            showToast.value = false;
        }, 2000);
    };

    watch(
        () => translations,
        () => {
            toastMessage.value = translations.value?.copied;
        }
    );

    function addToSelected(node: TreeNode, checkBoxKey: string, radioButtonKey: string, toggleValue: boolean) {
        const obj = { [checkBoxKey]: node.id, [radioButtonKey]: toggleValue };
        selectedValues.value.push(obj);
    }

    function removeFromSelected(node: TreeNode, checkBoxKey: string) {
        const idsToRemove = getAllIds(node);
        selectedValues.value = selectedValues.value.filter((item) => !idsToRemove.includes(item[checkBoxKey]));
    }

    function updateToggleValue(checkBoxKey: string, nodeId: any, radioButtonKey: string, toggleValue: boolean) {
        const item = selectedValues.value.find((item) => item[checkBoxKey] === nodeId);
        if (item) {
            item[radioButtonKey] = toggleValue;
        }
    }

    function getAllIds(node: TreeNode): any[] {
        let ids = [node.id];
        if (node.children) {
            node.children.forEach((child: TreeNode) => (ids = ids.concat(getAllIds(child))));
        }
        if ((node as any).descendents) {
            (node as any).descendents.forEach((child: TreeNode) => (ids = ids.concat(getAllIds(child))));
        }
        return ids;
    }

    onMounted(() => {
        fetchCountries();
    });

    return {
        selectedValues,
        translations,
        toastMessage,
        isLoading,
        countries,
        showToast,
        copy,
        addToSelected,
        fetchCountries,
        updateToggleValue,
        removeFromSelected,
        resolveLookupValueStatusCss
    };
}

export const useCommonData = createSharedComposable(getCommonData);
