import { computed, ref, watch } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { DropdownOption } from '@/types/CommonTypes';

/**
 * Only live rows are worth filtering a timetable by.
 *
 * This also gives these dropdowns a singleton key of their own:
 * `useDropdownOptions` caches by endpoint + params, and the master-data forms
 * already hold `/departments` and `/programs` instances with plain
 * `{ dropdown: true }`. Sharing those would mean this cascade silently drove
 * — or was driven by — a form dialog's catalogue.
 */
const FILTER_PARAMS = { [DROPDOWN_PARAM_KEY]: true, is_active: true };

/**
 * The academic scope every scheduling screen reads through:
 * College → Department → Program → Section, each narrowing the next.
 *
 * One shared instance, so the filter panel and whichever composable is doing
 * the fetching are looking at the same selection. (It resets when the last
 * screen using it unmounts — `createSharedComposable` stops the scope — so
 * moving between scheduling screens starts from a clean scope.)
 *
 * A schedule reaches all of this through its course offering, which is where
 * ownership actually lives (Final Schema.md §12).
 */
function scheduleFiltersManager() {
    const allowedRoutesStore = useAllowedRoutesStore();

    const collegeId = ref<number | null>(null);
    const departmentId = ref<number | null>(null);
    const programId = ref<number | null>(null);
    const sectionId = ref<number | null>(null);

    /**
     * Which sitting is being looked at — midterm, final, makeup, quiz.
     *
     * Deliberately OUTSIDE the college → department → programme → section
     * cascade: it narrows a different axis entirely, so choosing "final" must
     * not clear the department, and choosing a department must not clear it.
     * Only the exam screens set it; the class screens leave it null and it
     * never reaches the wire.
     */
    const examTypeCode = ref<string | null>(null);

    const collegeDropdown = useDropdownOptions<DropdownOption>('/colleges', FILTER_PARAMS);
    const departmentDropdown = useDropdownOptions<DropdownOption>('/departments', FILTER_PARAMS);
    const programDropdown = useDropdownOptions<DropdownOption>('/programs', FILTER_PARAMS);
    const sectionDropdown = useDropdownOptions<DropdownOption>('/sections', FILTER_PARAMS);

    /**
     * What the signed-in user may narrow BY.
     *
     * A department head has no cross-college view, so offering them a college
     * picker is offering a control with one answer. When they own exactly one
     * department the department picker goes too, and the filter is simply
     * pinned — which is what makes the screen simple for them rather than
     * merely restricted.
     *
     * This only shapes the UI; the server applies the same bound to every read
     * and write regardless.
     */
    const isRestricted = computed(() => allowedRoutesStore.isScopeRestricted);
    const ownDepartments = computed(() => allowedRoutesStore.scopedDepartments);
    const showCollege = computed(() => !isRestricted.value);
    const showDepartment = computed(() => !isRestricted.value || ownDepartments.value.length > 1);

    /** The department options a restricted user may choose between. */
    const departmentOptions = computed<DropdownOption[]>(() =>
        isRestricted.value ? (ownDepartments.value as DropdownOption[]) : departmentDropdown.options.value
    );

    /**
     * Pin a single-department user to their own department, once the scope has
     * arrived. Watched rather than set on creation because the composable can
     * be built before `/user/allowed-routes` answers.
     */
    watch(
        ownDepartments,
        (departments) => {
            if (!isRestricted.value || departments.length !== 1) return;

            const only = departments[0]!.id;
            if (departmentId.value !== only) departmentId.value = only;
        },
        { immediate: true }
    );

    /**
     * Narrowing a level reloads the one below it and drops whatever was chosen
     * there — a section under one programme is not a section of the next.
     *
     * The narrowing is passed to `fetchOptions` rather than through
     * `useDropdownOptions`' reactive-params argument on purpose: that argument
     * is captured once, inside a per-endpoint singleton that outlives this
     * composable's scope, so after a remount the cascade would be driven by a
     * computed belonging to the scope that has already been stopped.
     */
    watch(collegeId, (id) => {
        departmentId.value = null;
        departmentDropdown.fetchOptions(true, id ? { college_id: id } : {});
    });

    watch(departmentId, (id) => {
        programId.value = null;
        programDropdown.fetchOptions(true, id ? { department_id: id } : {});
    });

    watch(programId, (id) => {
        sectionId.value = null;
        sectionDropdown.fetchOptions(true, id ? { program_id: id } : {});
    });

    /**
     * What goes on the wire — the DEEPEST level chosen, and only that.
     *
     * Sending every level would be equivalent but redundant: the cascade
     * guarantees a chosen department sits in the chosen college, so
     * `department_id` alone already says both, at one `whereHas` instead of two.
     */
    const params = computed<Record<string, number | string>>(() => {
        const applied: Record<string, number | string> = {};

        if (sectionId.value) applied.section_id = sectionId.value;
        else if (programId.value) applied.program_id = programId.value;
        else if (departmentId.value) applied.department_id = departmentId.value;
        else if (collegeId.value) applied.college_id = collegeId.value;

        // A separate axis, so it stacks with whatever the cascade produced
        // rather than replacing it.
        if (examTypeCode.value) applied.exam_type_code = examTypeCode.value;

        return applied;
    });

    const hasAny = computed(
        () => !!(collegeId.value || departmentId.value || programId.value || sectionId.value || examTypeCode.value)
    );

    /** A one-line summary of the scope, for a screen that wants to name it. */
    const label = computed(() => {
        const named = (options: DropdownOption[], id: number | null) =>
            id ? (options.find((option) => option.id === id)?.name ?? null) : null;

        return [
            named(collegeDropdown.options.value, collegeId.value),
            named(departmentDropdown.options.value, departmentId.value),
            named(programDropdown.options.value, programId.value),
            named(sectionDropdown.options.value, sectionId.value)
        ]
            .filter(Boolean)
            .join(' · ');
    });

    const clear = () => {
        // Top down, so each level's own watcher clears the one below it.
        collegeId.value = null;
        departmentId.value = null;
        programId.value = null;
        sectionId.value = null;
        // Its own axis, so it has to be cleared explicitly — no watcher above
        // it will do it.
        examTypeCode.value = null;
    };

    /**
     * Fill every catalogue, honouring whatever narrowing is already in force.
     *
     * All four load, rather than only the top one: a user who knows the
     * department should be able to pick it without walking down from the
     * college first.
     */
    const load = () => {
        collegeDropdown.fetchOptions(true);
        departmentDropdown.fetchOptions(true, collegeId.value ? { college_id: collegeId.value } : {});
        programDropdown.fetchOptions(true, departmentId.value ? { department_id: departmentId.value } : {});
        sectionDropdown.fetchOptions(true, programId.value ? { program_id: programId.value } : {});
    };

    return {
        collegeId,
        departmentId,
        programId,
        sectionId,
        examTypeCode,

        isRestricted,
        showCollege,
        showDepartment,
        departmentOptions,

        collegeDropdown,
        departmentDropdown,
        programDropdown,
        sectionDropdown,

        params,
        hasAny,
        label,
        clear,
        load
    };
}

export const useScheduleFilters = createSharedComposable(scheduleFiltersManager);
