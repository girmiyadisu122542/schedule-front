<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useCourse } from '@/modules/masterData/composables/useCourse';
import { useLookupValues } from '@/composables/useLookupValues';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import CourseFormDialog from '@/modules/masterData/components/Course/CourseFormDialog.vue';

import BookIcon from '@/assets/icons/BookIcon.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Course } from '@/modules/masterData/types/course';

const { customizeLanguageData } = useLanguageStore();
const courseTypes = useLookupValues(LOOKUP_TYPE.COURSE_TYPE);
const {
    isLoading,
    courses,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchCourses,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveCourseForm
} = useCourse();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('courses', 'Courses') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const courseTypeChip = (course: Course) => courseTypes.resolve(course.course_type_code);

/** "3L + 3Lab + 1T ×2/wk" — what the generator will fan out into meetings. */
const weeklyLoadOf = (course: Course) => {
    const parts = [
        course.lecture_hours_per_week ? `${course.lecture_hours_per_week}L` : null,
        course.lab_hours_per_week ? `${course.lab_hours_per_week}Lab` : null,
        course.tutorial_hours_per_week ? `${course.tutorial_hours_per_week}T` : null
    ].filter(Boolean);

    if (!parts.length) return '—';

    const sessions = course.sessions_per_week ? ` ×${course.sessions_per_week}/wk` : '';
    return parts.join(' + ') + sessions;
};

onMounted(() => {
    fetchCourses();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="BookIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageCourses || 'Manage Courses' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageCoursesDesc ||
                        'The reusable catalogue. Courses are defined once and offered many times — no semester or instructor lives here.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="courses"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchCourses || 'Search courses...'"
                :show-add-button="$can('createCourse')"
                :show-refresh="true"
                @refresh="fetchCourses"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchCourses({ page })"
                @update:limit="(value: number) => fetchCourses({ perPage: value })">
                <template #cell-title="{ item }">
                    <span class="text-text-secondary">{{ (item as Course).title }}</span>
                </template>

                <template #cell-department="{ item }">
                    <span class="text-text-secondary">{{ (item as Course).department?.name || '—' }}</span>
                </template>

                <template #cell-course_type_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: courseTypeChip(item as Course)?.color ?? undefined,
                            borderColor: courseTypeChip(item as Course)?.color ?? undefined
                        }"
                        :label="courseTypeChip(item as Course)?.name || (item as Course).course_type?.name || '—'" />
                </template>

                <template #cell-credit_hours="{ item }">
                    <span class="text-text-secondary">{{ (item as Course).credit_hours }}</span>
                </template>

                <template #cell-weekly_load="{ item }">
                    <span class="text-text-tertiary text-xs">{{ weeklyLoadOf(item as Course) }}</span>
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Course).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="(item as Course).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Course)" />
                </template>
            </MainTable>
        </div>

        <CourseFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveCourseForm" />

        <ConfirmDialog
            v-model:show="confirmState.show"
            :title="confirmState.title"
            :message="confirmState.message"
            :item-label="confirmState.itemLabel"
            :item-name="confirmState.itemName"
            :item-names="confirmState.itemNames"
            :status-transition="confirmState.statusTransition"
            :confirm-label="confirmState.confirmLabel"
            :cancel-label="$lang.cancel"
            :type="confirmState.type"
            :loading="confirmState.loading"
            @confirm="confirmState.onConfirm" />
    </div>
</template>
