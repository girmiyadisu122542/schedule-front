import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { collegeSchema } from '@/modules/masterData/schemas/collegeSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import { useImportExport } from '@/composables/useImportExport';
import type { College, CollegeForm } from '@/modules/masterData/types/college';
import {
    fetchColleges,
    createCollege,
    updateCollege,
    deleteCollege,
    changeCollegeState,
    type CollegeListParams,
    type CollegePayload
} from '@/modules/masterData/services/collegeService';

const emptyForm = (): CollegeForm => ({
    name: '',
    code: '',
    dean_user_id: null,
    is_active: true
});

function collegeManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'name', label: customizeLanguageData('collegeName', 'College Name') },
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'dean', label: customizeLanguageData('dean', 'Dean') },
        { key: 'departments_count', label: customizeLanguageData('departments', 'Departments') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<College, CollegeForm, CollegePayload>({
        entity: 'College',
        labelKey: 'college',
        labelFallback: 'College',
        service: {
            fetchList: (params) => fetchColleges(params as CollegeListParams),
            create: createCollege,
            update: updateCollege,
            remove: deleteCollege,
            changeState: changeCollegeState
        },
        emptyForm,
        toForm: (college) => ({
            name: college.name,
            code: college.code,
            dean_user_id: college.dean_user_id,
            is_active: college.is_active
        }),
        detailPath: (college) => `/colleges/${college.uuid}`,
        schema: collegeSchema,
        columns
    });

    const importExport = useImportExport({
        baseUrl: '/colleges',
        entity: 'College',
        filePrefix: 'colleges',
        labelKey: 'college',
        labelFallback: 'College',
        importOrderKey: 'importOrderColleges',
        importOrderFallback: 'Colleges sit at the top of the academic hierarchy and have no prerequisites.',
        // Read at click time, so an export carries the filters the list
        // currently has applied rather than a snapshot from mount.
        currentParams: resource.currentQueryParams,
        onImported: () => resource.fetchItems()
    });

    return {
        ...resource,
        ...importExport,
        colleges: resource.items,
        fetchColleges: resource.fetchItems,
        saveCollegeForm: resource.saveForm
    };
}

export const useCollege = createSharedComposable(collegeManager);
