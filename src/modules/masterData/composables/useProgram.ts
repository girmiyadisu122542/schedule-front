import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { programSchema } from '@/modules/masterData/schemas/programSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Program, ProgramForm } from '@/modules/masterData/types/program';
import {
    fetchPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
    changeProgramState,
    type ProgramListParams,
    type ProgramPayload
} from '@/modules/masterData/services/programService';

const emptyForm = (): ProgramForm => ({
    name: '',
    code: '',
    department_id: null,
    degree_level_lookup_value_id: null,
    duration_years: '',
    is_active: true
});

function programManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'name', label: customizeLanguageData('programName', 'Program Name') },
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'department', label: customizeLanguageData('department', 'Department') },
        { key: 'degree_level', label: customizeLanguageData('degreeLevel', 'Degree Level') },
        { key: 'duration_years', label: customizeLanguageData('durationYears', 'Duration') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<Program, ProgramForm, ProgramPayload>({
        entity: 'Program',
        labelKey: 'program',
        labelFallback: 'Program',
        service: {
            fetchList: (params) => fetchPrograms(params as ProgramListParams),
            create: createProgram,
            update: updateProgram,
            remove: deleteProgram,
            changeState: changeProgramState
        },
        emptyForm,
        toForm: (program) => ({
            name: program.name,
            code: program.code,
            department_id: program.department_id,
            degree_level_lookup_value_id: program.degree_level_lookup_value_id,
            duration_years: String(program.duration_years),
            is_active: program.is_active
        }),
        detailPath: (program) => `/programs/${program.uuid}`,
        schema: programSchema,
        columns
    });

    return {
        ...resource,
        programs: resource.items,
        fetchPrograms: resource.fetchItems,
        saveProgramForm: resource.saveForm
    };
}

export const useProgram = createSharedComposable(programManager);
