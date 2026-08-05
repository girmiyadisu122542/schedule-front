import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { departmentSchema } from '@/modules/masterData/schemas/departmentSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Department, DepartmentForm } from '@/modules/masterData/types/department';
import {
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    changeDepartmentState,
    type DepartmentListParams,
    type DepartmentPayload
} from '@/modules/masterData/services/departmentService';

const emptyForm = (): DepartmentForm => ({
    name: '',
    code: '',
    college_id: null,
    head_user_id: null,
    is_active: true
});

function departmentManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'name', label: customizeLanguageData('departmentName', 'Department Name') },
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'college', label: customizeLanguageData('college', 'College') },
        { key: 'head', label: customizeLanguageData('departmentHead', 'Head') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<Department, DepartmentForm, DepartmentPayload>({
        entity: 'Department',
        labelKey: 'department',
        labelFallback: 'Department',
        service: {
            fetchList: (params) => fetchDepartments(params as DepartmentListParams),
            create: createDepartment,
            update: updateDepartment,
            remove: deleteDepartment,
            changeState: changeDepartmentState
        },
        emptyForm,
        toForm: (department) => ({
            name: department.name,
            code: department.code,
            college_id: department.college_id,
            head_user_id: department.head_user_id,
            is_active: department.is_active
        }),
        detailPath: (department) => `/departments/${department.uuid}`,
        schema: departmentSchema,
        columns
    });

    return {
        ...resource,
        departments: resource.items,
        fetchDepartments: resource.fetchItems,
        saveDepartmentForm: resource.saveForm
    };
}

export const useDepartment = createSharedComposable(departmentManager);
