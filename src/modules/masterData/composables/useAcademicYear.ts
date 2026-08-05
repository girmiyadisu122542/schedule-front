import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { academicYearSchema } from '@/modules/masterData/schemas/academicYearSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import type { AcademicYear, AcademicYearForm } from '@/modules/masterData/types/academicYear';
import {
    fetchAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    type AcademicYearListParams,
    type AcademicYearPayload
} from '@/modules/masterData/services/academicYearService';

const emptyForm = (): AcademicYearForm => ({
    code: '',
    start_date: '',
    end_date: '',
    is_current: false
});

function academicYearManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'code', label: customizeLanguageData('academicYear', 'Academic Year') },
        { key: 'start_date', label: customizeLanguageData('startDate', 'Start Date') },
        { key: 'end_date', label: customizeLanguageData('endDate', 'End Date') },
        { key: 'is_current', label: customizeLanguageData('current', 'Current') }
    ]);

    const filters = computed(() => [
        {
            label: customizeLanguageData('current', 'Current'),
            key: 'is_current',
            options: [
                { label: customizeLanguageData('yes', 'Yes'), value: true },
                { label: customizeLanguageData('no', 'No'), value: false }
            ]
        }
    ]);

    const resource = useCrudResource<AcademicYear, AcademicYearForm, AcademicYearPayload>({
        entity: 'AcademicYear',
        labelKey: 'academicYear',
        labelFallback: 'Academic Year',
        // No `is_active` column — no state toggle (Final Schema.md §6).
        hasState: false,
        service: {
            fetchList: (params) => fetchAcademicYears(params as AcademicYearListParams),
            create: createAcademicYear,
            update: updateAcademicYear,
            remove: deleteAcademicYear
        },
        emptyForm,
        toForm: (academicYear) => ({
            code: academicYear.code,
            start_date: academicYear.start_date,
            end_date: academicYear.end_date,
            is_current: academicYear.is_current
        }),
        detailPath: (year) => `/academic-years/${year.uuid}`,
        schema: academicYearSchema,
        columns,
        filters
    });

    return {
        ...resource,
        academicYears: resource.items,
        fetchAcademicYears: resource.fetchItems,
        saveAcademicYearForm: resource.saveForm
    };
}

export const useAcademicYear = createSharedComposable(academicYearManager);
