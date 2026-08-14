<script setup lang="ts">
import { useScheduleFilters } from '@/modules/scheduling/composables/useScheduleFilters';

import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';

import FilterIcon from '@/assets/icons/FilterIcon.vue';

/**
 * The academic scope every scheduling screen filters by:
 * College → Department → Program → Section, each narrowing the next.
 *
 * The state lives in [[useScheduleFilters]], which is shared across the module
 * — this component is only its face. Screens watch that composable's `params`
 * and refetch; the panel emits nothing.
 */
defineProps<{
    /** Shown under the heading — what this particular screen filters. */
    hint?: string;
    /**
     * Midterm / final / makeup / quiz, for the exam screens.
     *
     * Empty on the class screens, where the picker is hidden entirely rather
     * than shown with nothing in it.
     */
    examTypes?: Array<{ label: string; value: string }>;
}>();

const {
    collegeId,
    departmentId,
    programId,
    sectionId,
    examTypeCode,
    collegeDropdown,
    departmentDropdown,
    programDropdown,
    sectionDropdown,
    isRestricted,
    showCollege,
    showDepartment,
    departmentOptions,
    hasAny,
    clear
} = useScheduleFilters();
</script>

<template>
    <section class="schedule-card border-border-default rounded-2xl border p-5">
        <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-center gap-2">
                <FilterIcon class="text-schedule-icon-brand h-4 w-4" />
                <div>
                    <h2 class="text-text-primary text-sm font-semibold">{{ $lang.filters || 'Filters' }}</h2>
                    <p
                        v-if="hint"
                        class="text-text-tertiary text-xs">
                        {{ hint }}
                    </p>
                </div>
            </div>

            <MainButton
                v-if="hasAny"
                outlined
                size="small"
                :label="$lang.clearFilter || 'Clear'"
                @click="clear" />
        </header>

        <!--
            A restricted user with no department sees an empty screen and no
            way to change it. Saying so beats letting them think the timetable
            is empty.
        -->
        <p
            v-if="isRestricted && !departmentOptions.length"
            class="border-border-subtle text-text-tertiary mb-4 rounded-xl border border-dashed px-3 py-2 text-xs">
            {{
                $lang.noDepartmentScope ||
                'You are not assigned to a department yet, so no schedules are shown. Ask an administrator to set you as a department head, a college dean, or an instructor.'
            }}
        </p>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MainSelect
                v-if="showCollege"
                v-model="collegeId"
                :label-text="$lang.college || 'College'"
                :options="collegeDropdown.options.value"
                option-label="name"
                option-value="id"
                :placeholder="$lang.allColleges || 'All colleges'"
                size="normal"
                search
                show-clear
                :loading="collegeDropdown.loading.value" />

            <MainSelect
                v-if="showDepartment"
                v-model="departmentId"
                :label-text="$lang.department || 'Department'"
                :options="departmentOptions"
                option-label="name"
                option-value="id"
                :placeholder="$lang.allDepartments || 'All departments'"
                size="normal"
                search
                show-clear
                :loading="departmentDropdown.loading.value" />

            <MainSelect
                v-model="programId"
                :label-text="$lang.program || 'Program'"
                :options="programDropdown.options.value"
                option-label="name"
                option-value="id"
                :placeholder="$lang.allPrograms || 'All programs'"
                size="normal"
                search
                show-clear
                :loading="programDropdown.loading.value" />

            <MainSelect
                v-model="sectionId"
                :label-text="$lang.section || 'Section'"
                :options="sectionDropdown.options.value"
                option-label="name"
                option-value="id"
                :placeholder="$lang.allSections || 'All sections'"
                size="normal"
                search
                show-clear
                :loading="sectionDropdown.loading.value" />

            <!--
                A different axis from the cascade above: choosing a sitting
                does not clear the department, and choosing a department does
                not clear the sitting.
            -->
            <MainSelect
                v-if="examTypes?.length"
                v-model="examTypeCode"
                :label-text="$lang.examType || 'Exam type'"
                :options="examTypes"
                option-label="label"
                option-value="value"
                :placeholder="$lang.allExamTypes || 'All exam types'"
                size="normal"
                show-clear />

            <!-- Screen-specific controls sit alongside the hierarchy. -->
            <slot />
        </div>
    </section>
</template>
