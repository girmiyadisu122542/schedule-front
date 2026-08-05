import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { courseSchema } from '@/modules/masterData/schemas/courseSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Course, CourseForm } from '@/modules/masterData/types/course';
import {
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    changeCourseState,
    type CourseListParams,
    type CoursePayload
} from '@/modules/masterData/services/courseService';

const emptyForm = (): CourseForm => ({
    title: '',
    code: '',
    description: '',
    department_id: null,
    course_type_lookup_value_id: null,
    credit_hours: '',
    contact_hours: '',
    lecture_hours_per_week: '',
    lab_hours_per_week: '',
    tutorial_hours_per_week: '',
    sessions_per_week: '',
    is_active: true
});

function courseManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'title', label: customizeLanguageData('title', 'Title') },
        { key: 'department', label: customizeLanguageData('department', 'Department') },
        { key: 'course_type_code', label: customizeLanguageData('courseType', 'Type') },
        { key: 'credit_hours', label: customizeLanguageData('creditHours', 'Credits') },
        { key: 'weekly_load', label: customizeLanguageData('weeklyLoad', 'Weekly load') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<Course, CourseForm, CoursePayload>({
        entity: 'Course',
        labelKey: 'course',
        labelFallback: 'Course',
        service: {
            fetchList: (params) => fetchCourses(params as CourseListParams),
            create: createCourse,
            update: updateCourse,
            remove: deleteCourse,
            changeState: changeCourseState
        },
        emptyForm,
        toForm: (course) => ({
            title: course.title,
            code: course.code,
            description: course.description ?? '',
            department_id: course.department_id,
            course_type_lookup_value_id: course.course_type_lookup_value_id,
            credit_hours: String(course.credit_hours),
            contact_hours: course.contact_hours != null ? String(course.contact_hours) : '',
            lecture_hours_per_week: course.lecture_hours_per_week != null ? String(course.lecture_hours_per_week) : '',
            lab_hours_per_week: course.lab_hours_per_week != null ? String(course.lab_hours_per_week) : '',
            tutorial_hours_per_week:
                course.tutorial_hours_per_week != null ? String(course.tutorial_hours_per_week) : '',
            sessions_per_week: course.sessions_per_week != null ? String(course.sessions_per_week) : '',
            is_active: course.is_active
        }),
        detailPath: (course) => `/courses/${course.uuid}`,
        schema: courseSchema,
        columns
    });

    return {
        ...resource,
        courses: resource.items,
        fetchCourses: resource.fetchItems,
        saveCourseForm: resource.saveForm
    };
}

export const useCourse = createSharedComposable(courseManager);
