import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { sectionSchema } from '@/modules/masterData/schemas/sectionSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Section, SectionForm } from '@/modules/masterData/types/section';
import {
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    changeSectionState,
    type SectionListParams,
    type SectionPayload
} from '@/modules/masterData/services/sectionService';

const emptyForm = (): SectionForm => ({
    program_id: null,
    academic_year_id: null,
    year_level: '',
    label: '',
    expected_students: '',
    is_active: true
});

function sectionManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'program', label: customizeLanguageData('program', 'Program') },
        { key: 'year_level', label: customizeLanguageData('yearLevel', 'Year') },
        { key: 'label', label: customizeLanguageData('label', 'Section') },
        { key: 'academic_year', label: customizeLanguageData('academicYear', 'Academic Year') },
        { key: 'expected_students', label: customizeLanguageData('expectedStudents', 'Students') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<Section, SectionForm, SectionPayload>({
        entity: 'Section',
        labelKey: 'section',
        labelFallback: 'Section',
        service: {
            fetchList: (params) => fetchSections(params as SectionListParams),
            create: createSection,
            update: updateSection,
            remove: deleteSection,
            changeState: changeSectionState
        },
        emptyForm,
        toForm: (section) => ({
            program_id: section.program_id,
            academic_year_id: section.academic_year_id,
            year_level: String(section.year_level),
            label: section.label,
            expected_students: String(section.expected_students),
            is_active: section.is_active
        }),
        detailPath: (section) => `/sections/${section.uuid}`,
        schema: sectionSchema,
        columns
    });

    return {
        ...resource,
        sections: resource.items,
        fetchSections: resource.fetchItems,
        saveSectionForm: resource.saveForm
    };
}

export const useSection = createSharedComposable(sectionManager);
