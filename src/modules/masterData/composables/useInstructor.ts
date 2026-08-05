import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { instructorSchema } from '@/modules/masterData/schemas/instructorSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Instructor, InstructorForm } from '@/modules/masterData/types/instructor';
import {
    fetchInstructors,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    changeInstructorState,
    type InstructorListParams,
    type InstructorPayload
} from '@/modules/masterData/services/instructorService';

const emptyForm = (): InstructorForm => ({
    full_name: '',
    employee_no: '',
    email: '',
    phone: '',
    department_id: null,
    academic_rank: '',
    user_id: null,
    can_teach: true,
    can_invigilate: true,
    max_weekly_hours: '',
    is_active: true
});

function instructorManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'employee_no', label: customizeLanguageData('employeeNo', 'Employee No') },
        { key: 'full_name', label: customizeLanguageData('fullName', 'Name') },
        { key: 'department', label: customizeLanguageData('department', 'Department') },
        { key: 'academic_rank', label: customizeLanguageData('academicRank', 'Rank') },
        { key: 'can_teach', label: customizeLanguageData('canTeach', 'Teaches') },
        { key: 'can_invigilate', label: customizeLanguageData('canInvigilate', 'Invigilates') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const filters = computed(() => [
        {
            label: customizeLanguageData('state', 'State'),
            key: 'is_active',
            options: [
                { label: customizeLanguageData('active', 'Active'), value: true },
                { label: customizeLanguageData('inactive', 'Inactive'), value: false }
            ]
        },
        {
            label: customizeLanguageData('canInvigilate', 'Invigilates'),
            key: 'can_invigilate',
            options: [
                { label: customizeLanguageData('yes', 'Yes'), value: true },
                { label: customizeLanguageData('no', 'No'), value: false }
            ]
        }
    ]);

    const resource = useCrudResource<Instructor, InstructorForm, InstructorPayload>({
        entity: 'Instructor',
        labelKey: 'instructor',
        labelFallback: 'Instructor',
        service: {
            fetchList: (params) => fetchInstructors(params as InstructorListParams),
            create: createInstructor,
            update: updateInstructor,
            remove: deleteInstructor,
            changeState: changeInstructorState
        },
        emptyForm,
        toForm: (instructor) => ({
            full_name: instructor.full_name,
            employee_no: instructor.employee_no,
            email: instructor.email ?? '',
            phone: instructor.phone ?? '',
            department_id: instructor.department_id,
            academic_rank: instructor.academic_rank ?? '',
            user_id: instructor.user_id,
            can_teach: instructor.can_teach,
            can_invigilate: instructor.can_invigilate,
            max_weekly_hours: instructor.max_weekly_hours != null ? String(instructor.max_weekly_hours) : '',
            is_active: instructor.is_active
        }),
        detailPath: (instructor) => `/instructors/${instructor.uuid}`,
        schema: instructorSchema,
        columns,
        filters
    });

    return {
        ...resource,
        instructors: resource.items,
        fetchInstructors: resource.fetchItems,
        saveInstructorForm: resource.saveForm
    };
}

export const useInstructor = createSharedComposable(instructorManager);
