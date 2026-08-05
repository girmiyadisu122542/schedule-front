import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useLookupValues, type LookupValueRef } from '@/composables/useLookupValues';
import { INVIGILATION_LOOKUP_TYPE, INVIGILATION_STATUS } from '@/modules/invigilation/constants/invigilationStatus';
import type { Assignment, AutoAssignResult } from '@/modules/invigilation/types/assignment';
import {
    fetchAssignments,
    respondToAssignment,
    replaceInvigilator,
    autoAssignInvigilators,
    type AssignmentListParams
} from '@/modules/invigilation/services/examInvigilatorAssignmentService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import type { Pagination, FetchParams } from '@/types/CommonTypes';
import { DEFAULT_PAGE_LIMIT, FIRST_PAGE, STATUS_DANGER } from '@/config/appConfig';

import CheckCircle from '@/assets/icons/CheckCircle.vue';
import XCircleIcon from '@/assets/icons/XCircleIcon.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';

/**
 * The duty roster.
 *
 * Not built on `useCrudResource`: a duty has no create dialog, no edit and no
 * delete — it is assigned, answered, or swapped. Reusing the factory would mean
 * disabling most of it.
 */
function assignmentManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** The status catalogue: labels, colours and the ids `respond` posts. */
    const statuses = useLookupValues(INVIGILATION_LOOKUP_TYPE);

    const isLoading = ref(false);
    const isSavingAction = ref(false);
    const items = ref<{ data: Assignment[]; pagination: Pagination | null }>({ data: [], pagination: null });
    const searchQuery = ref('');
    const currentPage = ref(FIRST_PAGE);
    const limit = ref(DEFAULT_PAGE_LIMIT);
    const filters = ref<Record<string, unknown>>({});

    /** What the last auto-assign run produced; null until one is triggered. */
    const lastRun = ref<AutoAssignResult | null>(null);

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const tableColumns = computed(() => [
        { key: 'exam_schedule', label: customizeLanguageData('examSitting', 'Sitting') },
        { key: 'instructor', label: customizeLanguageData('instructor', 'Invigilator') },
        { key: 'role_code', label: customizeLanguageData('invigilatorRole', 'Role') },
        { key: 'exam_date', label: customizeLanguageData('examDate', 'Date') },
        { key: 'time_range', label: customizeLanguageData('availabilityWindow', 'Window') },
        { key: 'status_code', label: customizeLanguageData('status', 'Status') }
    ]);

    const filterFields = computed(() => [
        {
            label: customizeLanguageData('status', 'Status'),
            key: 'status_code',
            options: statuses.options.value.map((status: LookupValueRef) => ({
                label: status.name,
                value: status.code
            }))
        }
    ]);

    /** Label and colour both come from the lookup value — never hardcoded. */
    const statusChip = (assignment: Assignment) => statuses.resolve(assignment.status_code);

    const fetchItems = async (params: FetchParams = {}) => {
        isLoading.value = true;
        try {
            currentPage.value = params.page ?? currentPage.value;
            limit.value = params.perPage ?? limit.value;

            items.value = await fetchAssignments({
                page: currentPage.value,
                limit: limit.value,
                search: params.search ?? (searchQuery.value || undefined),
                ...filters.value
            } as AssignmentListParams);
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isLoading.value = false;
        }
    };

    const handleSearch = (value: string) => {
        searchQuery.value = value;
        fetchItems({ page: FIRST_PAGE });
    };

    const handleFilterChange = (filterValues: Record<string, unknown>) => {
        filters.value = filterValues;
        fetchItems({ page: FIRST_PAGE });
    };

    /**
     * Run one action and refresh the roster. Every one of them can come back as
     * a translated 422 — the double-booking EXCLUDE, an illegal move, an
     * instructor with no offered window — so none of them may be swallowed.
     *
     * @param action the service call
     * @returns true when it stuck
     */
    const runAction = async (action: () => Promise<{ message?: string }>): Promise<boolean> => {
        isSavingAction.value = true;
        try {
            const result = await action();
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await fetchItems();

            return true;
        } catch (error: unknown) {
            toast.error(genericError(error));

            return false;
        } finally {
            isSavingAction.value = false;
        }
    };

    /** The status catalogue is the source of the id `respond` posts. */
    const statusIdFor = (code: string) =>
        statuses.options.value.find((status: LookupValueRef) => status.code === code)?.id ?? null;

    const respond = async (assignment: Assignment, code: string) => {
        const statusId = statusIdFor(code);
        if (!statusId) {
            toast.error(customizeLanguageData('somethingWentWrong', 'Something went wrong'));
            return;
        }

        await runAction(() => respondToAssignment(assignment.id, statusId));
    };

    // ---- replacing an invigilator -------------------------------------------
    const replaceDialogVisible = ref(false);
    const replaceTarget = ref<Assignment | null>(null);
    const replaceInstructorId = ref<number | null>(null);
    const replaceRemark = ref('');

    const openReplaceDialog = (assignment: Assignment) => {
        replaceTarget.value = assignment;
        replaceInstructorId.value = null;
        replaceRemark.value = '';
        replaceDialogVisible.value = true;
    };

    const submitReplacement = async () => {
        const assignment = replaceTarget.value;
        if (!assignment || !replaceInstructorId.value) {
            toast.error(customizeLanguageData('instructorIsRequired', 'Please choose an instructor'));
            return;
        }

        const done = await runAction(() =>
            replaceInvigilator(assignment.id, replaceInstructorId.value as number, replaceRemark.value.trim() || null)
        );

        if (done) {
            replaceDialogVisible.value = false;
        }
    };

    const autoAssign = async (semesterId: number): Promise<boolean> => {
        isSavingAction.value = true;
        lastRun.value = null;
        try {
            const result = await autoAssignInvigilators(semesterId);
            lastRun.value = result.data;
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await fetchItems();

            return true;
        } catch (error: unknown) {
            toast.error(genericError(error));

            return false;
        } finally {
            isSavingAction.value = false;
        }
    };

    /**
     * A duty that is already `declined` or `replaced` is finished — the backend
     * refuses every move from there, so nothing is offered.
     */
    const isOpen = (assignment: Assignment) =>
        assignment.status_code === INVIGILATION_STATUS.ASSIGNED ||
        assignment.status_code === INVIGILATION_STATUS.ACCEPTED;

    const getActionOptions = (assignment: Assignment): ActionOption[] => {
        const options: ActionOption[] = [];

        if (!isOpen(assignment)) {
            return options;
        }

        if (allowedRoutesStore.can('respondToInvigilatorAssignment')) {
            if (assignment.status_code === INVIGILATION_STATUS.ASSIGNED) {
                options.push({
                    label: customizeLanguageData('acceptDuty', 'Accept'),
                    icon: CheckCircle,
                    onClick: () => respond(assignment, INVIGILATION_STATUS.ACCEPTED)
                });
            }

            options.push({
                label: customizeLanguageData('declineDuty', 'Decline'),
                icon: XCircleIcon,
                variant: STATUS_DANGER,
                onClick: () => respond(assignment, INVIGILATION_STATUS.DECLINED)
            });
        }

        if (allowedRoutesStore.can('replaceInvigilator')) {
            options.push({
                label: customizeLanguageData('replaceInvigilatorAction', 'Replace invigilator'),
                icon: RefreshIcon,
                onClick: () => openReplaceDialog(assignment)
            });
        }

        return options;
    };

    return {
        isLoading,
        isSavingAction,
        assignments: items,
        tableColumns,
        filterFields,
        searchQuery,
        currentPage,
        limit,
        statuses,
        lastRun,

        statusChip,
        fetchAssignments: fetchItems,
        handleSearch,
        handleFilterChange,
        getActionOptions,
        respond,
        autoAssign,
        isOpen,

        replaceDialogVisible,
        replaceTarget,
        replaceInstructorId,
        replaceRemark,
        openReplaceDialog,
        submitReplacement
    };
}

export const useAssignment = createSharedComposable(assignmentManager);
