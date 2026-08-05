import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { campusSchema } from '@/modules/masterData/schemas/campusSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Campus, CampusForm } from '@/modules/masterData/types/campus';
import {
    fetchCampuses,
    createCampus,
    updateCampus,
    deleteCampus,
    changeCampusState,
    type CampusListParams,
    type CampusPayload
} from '@/modules/masterData/services/campusService';

const emptyForm = (): CampusForm => ({
    name: '',
    code: '',
    address: '',
    city: '',
    is_main: false,
    is_active: true
});

function campusManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'name', label: customizeLanguageData('campusName', 'Campus Name') },
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'city', label: customizeLanguageData('city', 'City') },
        { key: 'buildings_count', label: customizeLanguageData('buildings', 'Buildings') },
        { key: 'is_main', label: customizeLanguageData('mainCampus', 'Main Campus') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<Campus, CampusForm, CampusPayload>({
        entity: 'Campus',
        labelKey: 'campus',
        labelFallback: 'Campus',
        service: {
            fetchList: (params) => fetchCampuses(params as CampusListParams),
            create: createCampus,
            update: updateCampus,
            remove: deleteCampus,
            changeState: changeCampusState
        },
        emptyForm,
        toForm: (campus) => ({
            name: campus.name,
            code: campus.code,
            address: campus.address ?? '',
            city: campus.city ?? '',
            is_main: campus.is_main,
            is_active: campus.is_active
        }),
        detailPath: (campus) => `/campuses/${campus.uuid}`,
        schema: campusSchema,
        columns
    });

    return {
        ...resource,
        /** Domain-named aliases so views read as campus screens, not generic ones. */
        campuses: resource.items,
        fetchCampuses: resource.fetchItems,
        saveCampusForm: resource.saveForm
    };
}

export const useCampus = createSharedComposable(campusManager);
