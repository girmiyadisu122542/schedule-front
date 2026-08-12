import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { buildingSchema } from '@/modules/masterData/schemas/buildingSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import { useImportExport } from '@/composables/useImportExport';
import type { Building, BuildingForm } from '@/modules/masterData/types/building';
import {
    fetchBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    changeBuildingState,
    type BuildingListParams,
    type BuildingPayload
} from '@/modules/masterData/services/buildingService';

const emptyForm = (): BuildingForm => ({
    name: '',
    code: '',
    campus_id: null,
    floors: '',
    is_active: true
});

function buildingManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'name', label: customizeLanguageData('buildingName', 'Building Name') },
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'campus', label: customizeLanguageData('campus', 'Campus') },
        { key: 'floors', label: customizeLanguageData('floors', 'Floors') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<Building, BuildingForm, BuildingPayload>({
        entity: 'Building',
        labelKey: 'building',
        labelFallback: 'Building',
        service: {
            fetchList: (params) => fetchBuildings(params as BuildingListParams),
            create: createBuilding,
            update: updateBuilding,
            remove: deleteBuilding,
            changeState: changeBuildingState
        },
        emptyForm,
        toForm: (building) => ({
            name: building.name,
            code: building.code,
            campus_id: building.campus_id,
            floors: building.floors != null ? String(building.floors) : '',
            is_active: building.is_active
        }),
        detailPath: (building) => `/buildings/${building.uuid}`,
        schema: buildingSchema,
        columns
    });

    const importExport = useImportExport({
        baseUrl: '/buildings',
        entity: 'Building',
        filePrefix: 'buildings',
        labelKey: 'building',
        labelFallback: 'Building',
        importOrderKey: 'importOrderBuildings',
        importOrderFallback: 'Campuses must exist first: campuses → buildings → rooms.',
        // Read at click time, so an export carries the filters the list
        // currently has applied rather than a snapshot from mount.
        currentParams: resource.currentQueryParams,
        onImported: () => resource.fetchItems()
    });

    return {
        ...resource,
        ...importExport,
        buildings: resource.items,
        fetchBuildings: resource.fetchItems,
        saveBuildingForm: resource.saveForm
    };
}

export const useBuilding = createSharedComposable(buildingManager);
