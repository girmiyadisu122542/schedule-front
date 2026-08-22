import type { BulkResultFailure } from '@/components/common/BulkResultDialog.vue';
import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';
import router from '@/router';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useStatusFlow } from '@/composables/useStatusFlow';
import { useLookupValues, type LookupValueRef } from '@/composables/useLookupValues';
import { useCrudResource } from '@/composables/useCrudResource';
import { useImportExport } from '@/composables/useImportExport';
import { offeringSchema } from '@/modules/offerings/schemas/offeringSchema';
import { useOfferingFilters } from '@/modules/offerings/composables/useOfferingFilters';
import {
    OFFERING_LOOKUP_TYPE,
    OFFERING_STATUS,
    OFFERING_QUEUE,
    APPROVAL_DECISION,
    APPROVAL_LOOKUP_TYPE,
    APPROVAL_LEVEL_ORDER,
    EDITABLE_OFFERING_STATUSES,
    type OfferingQueue
} from '@/modules/offerings/constants/offeringStatus';
import type { Offering, OfferingForm, OfferingSummary } from '@/modules/offerings/types/offering';
import {
    fetchOfferings,
    createOffering,
    updateOffering,
    deleteOffering,
    submitOffering,
    reopenOffering,
    bulkOfferingAction,
    recordApproval,
    fetchOfferingSummary,
    type OfferingListParams,
    type OfferingPayload
} from '@/modules/offerings/services/offeringService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import type { AllowedAction } from '@/constants/allowedActions';
import { STATUS_DANGER, FIRST_PAGE, DEFAULT_PAGE_LIMIT } from '@/config/appConfig';
import { OFFERING_VIEW, BOARD_PAGE_LIMIT, type OfferingViewMode } from '@/modules/offerings/constants/offeringView';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';
import SendPlaneIcon from '@/assets/icons/SendPlaneIcon.vue';

const emptyForm = (): OfferingForm => ({
    semester_id: null,
    course_id: null,
    department_id: null,
    program_id: null,
    section_id: null,
    instructor_id: null,
    expected_students: '',
    remark: '',
    additional_section_ids: []
});

/**
 * The permission key each approval tier requires, mirroring
 * `PERMISSION_BY_APPROVAL_LEVEL` on the backend.
 *
 * This maps a tier to a KEY. It does not decide which tier is due — that is
 * `awaiting_level_code`, computed server-side and sent with every row, so the
 * state machine lives in exactly one place.
 */
const ACTION_BY_LEVEL: Record<string, AllowedAction> = {
    committee: 'approveCourseOfferingCommittee',
    department: 'approveCourseOfferingDepartment',
    college: 'approveCourseOfferingCollege',
    registrar: 'approveCourseOfferingRegistrar'
};

function offeringManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** Statuses + legal edges, both straight from the backend lookup catalogue. */
    const statusFlow = useStatusFlow(OFFERING_LOOKUP_TYPE);
    const decisions = useLookupValues(APPROVAL_LOOKUP_TYPE.DECISION);
    const filters = useOfferingFilters();

    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const columns = computed(() => [
        { key: 'course', label: customizeLanguageData('course', 'Course') },
        { key: 'section', label: customizeLanguageData('section', 'Section') },
        { key: 'instructor', label: customizeLanguageData('instructor', 'Instructor') },
        { key: 'status_code', label: customizeLanguageData('status', 'Status') }
    ]);

    // ---- queues -------------------------------------------------------------

    const activeQueue = ref<OfferingQueue>(OFFERING_QUEUE.AWAITING_ME);
    const summary = ref<OfferingSummary | null>(null);

    const viewMode = ref<OfferingViewMode>(OFFERING_VIEW.CARDS);

    /**
     * The board's columns ARE the workflow stages, so a queue filter on top of
     * it would empty most of them — the tabs are hidden in that view and the
     * queue is dropped from the request.
     */
    const isBoard = computed(() => viewMode.value === OFFERING_VIEW.BOARD);

    const queueTabs = computed(() => [
        {
            value: OFFERING_QUEUE.AWAITING_ME,
            label: customizeLanguageData('awaitingMe', 'Awaiting me'),
            count: summary.value?.awaiting_me ?? 0
        },
        {
            value: OFFERING_QUEUE.MY_DRAFTS,
            label: customizeLanguageData('myDrafts', 'My drafts'),
            count: summary.value?.my_drafts ?? 0
        },
        {
            value: OFFERING_QUEUE.IN_PROGRESS,
            label: customizeLanguageData('inProgress', 'In progress'),
            count: summary.value?.in_progress ?? 0
        },
        {
            value: OFFERING_QUEUE.RETURNED,
            label: customizeLanguageData('returned', 'Returned'),
            count: summary.value?.returned ?? 0
        },
        {
            value: OFFERING_QUEUE.APPROVED,
            label: customizeLanguageData('approved', 'Approved'),
            count: summary.value?.approved ?? 0
        },
        {
            value: OFFERING_QUEUE.REJECTED,
            label: customizeLanguageData('rejected', 'Rejected'),
            count: summary.value?.rejected ?? 0
        }
    ]);

    /** Everything narrowing the list: the queue plus the academic cascade. */
    const listParams = (): Record<string, unknown> => ({
        queue: isBoard.value ? undefined : activeQueue.value,
        ...filters.params.value
    });

    const resource = useCrudResource<Offering, OfferingForm, OfferingPayload>({
        entity: 'CourseOffering',
        labelKey: 'courseOffering',
        labelFallback: 'Course Offering',
        service: {
            fetchList: (params) => fetchOfferings({ ...params, ...listParams() } as OfferingListParams),
            create: createOffering,
            update: updateOffering,
            remove: deleteOffering
        },
        emptyForm,
        toForm: (offering) => ({
            semester_id: offering.semester_id,
            course_id: offering.course_id,
            department_id: offering.department_id,
            program_id: offering.program_id,
            section_id: offering.section_id,
            instructor_id: offering.instructor_id,
            expected_students: offering.expected_students != null ? String(offering.expected_students) : '',
            remark: offering.remark ?? '',
            additional_section_ids: (offering.additional_sections ?? []).map((extra) => extra.section_id)
        }),
        detailPath: (offering) => `/offerings/${offering.uuid}`,
        schema: offeringSchema,
        columns,
        // A workflow table: no `is_active`, so no activate/deactivate.
        hasState: false,
        rowLabel: (offering) => offering.name ?? ''
    });

    const importExport = useImportExport({
        baseUrl: '/offerings',
        entity: 'CourseOffering',
        filePrefix: 'course-offerings',
        labelKey: 'courseOffering',
        labelFallback: 'Course Offering',
        importOrderKey: 'importOrderOfferings',
        importOrderFallback:
            'Offerings depend on semesters, courses, departments, programs, sections and instructors — import those first.',
        currentParams: () => ({ ...resource.currentQueryParams(), ...listParams() }),
        onImported: () => refresh()
    });

    const loadSummary = async () => {
        try {
            summary.value = await fetchOfferingSummary(filters.params.value);
        } catch {
            // A failed badge count must not take the list down with it.
            summary.value = null;
        }
    };

    const refresh = async (params: { page?: number; perPage?: number } = {}) => {
        // A board cannot paginate: every column has to be present at once or the
        // shape it exists to show is a lie.
        const perPage = params.perPage ?? (isBoard.value ? BOARD_PAGE_LIMIT : DEFAULT_PAGE_LIMIT);

        await Promise.all([resource.fetchItems({ ...params, perPage }), loadSummary()]);
    };

    const setViewMode = async (mode: OfferingViewMode) => {
        if (mode === viewMode.value) return;

        viewMode.value = mode;
        await refresh({ page: FIRST_PAGE });
    };

    const selectQueue = async (queue: OfferingQueue) => {
        activeQueue.value = queue;
        await refresh({ page: FIRST_PAGE });
    };

    const applyFilters = async () => {
        await refresh({ page: FIRST_PAGE });
    };

    const clearFilters = async () => {
        filters.clear();
        await refresh({ page: FIRST_PAGE });
    };

    // ---- decisions ----------------------------------------------------------

    const decisionDialogVisible = ref(false);
    const decisionTarget = ref<Offering | null>(null);
    const decisionCode = ref<string>(APPROVAL_DECISION.APPROVED);
    const decisionRemark = ref('');
    const isDeciding = ref(false);

    /** Whether the signed-in user holds the key for the tier due on this row. */
    const canDecide = (offering: Offering): boolean => {
        const level = offering.awaiting_level_code;
        const action = level ? ACTION_BY_LEVEL[level] : null;

        return !!action && allowedRoutesStore.can(action);
    };

    const isEditable = (offering: Offering) => EDITABLE_OFFERING_STATUSES.includes(offering.status_code ?? '');

    /** Zero-based index of the tier due, for the progress stepper. */
    const tierIndex = (offering: Offering): number => {
        if (offering.status_code === OFFERING_STATUS.REGISTRAR_APPROVED) return APPROVAL_LEVEL_ORDER.length;

        const index = APPROVAL_LEVEL_ORDER.indexOf(offering.awaiting_level_code ?? '');

        return index < 0 ? 0 : index;
    };

    const openDecision = (offering: Offering, decision: string) => {
        decisionTarget.value = offering;
        decisionCode.value = decision;
        decisionRemark.value = '';
        decisionDialogVisible.value = true;
    };

    const closeDecision = () => {
        decisionDialogVisible.value = false;
        decisionTarget.value = null;
        decisionRemark.value = '';
    };

    const submitDecision = async () => {
        const offering = decisionTarget.value;
        if (!offering) return;

        const decision = decisions.options.value.find((option: LookupValueRef) => option.code === decisionCode.value);
        if (!decision) {
            toast.error(genericError(null));
            return;
        }

        isDeciding.value = true;
        try {
            const response = await recordApproval(offering.id, {
                decision_lookup_value_id: decision.id,
                remark: decisionRemark.value || null
            });

            toast.success(response.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            closeDecision();
            await refresh();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isDeciding.value = false;
        }
    };

    // ---- bulk decisions -----------------------------------------------------

    const isBulkRunning = ref(false);
    const bulkResultVisible = ref(false);
    const bulkResult = ref<{ succeeded: number; failed: BulkResultFailure[] }>({ succeeded: 0, failed: [] });

    /**
     * Apply one decision to every selected offering.
     *
     * The server judges each row at ITS OWN approval tier, so a mixed selection
     * is fine and expected: what it cannot decide it names back, and those are
     * surfaced here rather than swallowed. A run that partly succeeds is the
     * normal case, not an error — reporting "12 of 14" and why the two failed
     * is more use than a single red toast.
     */
    const runBulkAction = async (
        rows: Offering[],
        action: 'approve' | 'submit' | 'reopen',
        decisionCodeValue?: string
    ) => {
        if (!rows.length) return;

        let decisionId: number | null = null;
        if (action === 'approve') {
            const decision = decisions.options.value.find(
                (option: LookupValueRef) => option.code === decisionCodeValue
            );
            if (!decision) {
                toast.error(genericError(null));

                return;
            }
            decisionId = decision.id;
        }

        isBulkRunning.value = true;
        try {
            const response = await bulkOfferingAction({
                action,
                offering_ids: rows.map((offering) => offering.id),
                decision_lookup_value_id: decisionId,
                remark: null
            });

            const failed = response.data?.failed ?? [];

            // The toast carries the COUNT only. The detail — one long row label
            // plus a reason, per refusal — is unreadable crammed into a toast
            // that vanishes, so it goes to a dialog the reader can dwell on.
            if (failed.length) {
                bulkResult.value = { succeeded: response.data?.succeeded ?? 0, failed };
                bulkResultVisible.value = true;
                toast.warning(response.message);
            } else {
                toast.success(response.message);
            }

            await refresh();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isBulkRunning.value = false;
        }
    };

    // ---- author actions -----------------------------------------------------

    const runOfferingAction = async (offering: Offering, action: (id: number) => Promise<{ message?: string }>) => {
        try {
            const response = await action(offering.id);
            toast.success(response.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await refresh();
        } catch (error: unknown) {
            toast.error(genericError(error));
        }
    };

    const confirmSubmit = (offering: Offering) => {
        resource.openConfirmDialog({
            title: customizeLanguageData('submitForApproval', 'Submit for approval'),
            message: customizeLanguageData(
                'submitOfferingExplainer',
                'This records your committee decision and sends the offering to the department head.'
            ),
            confirmLabel: customizeLanguageData('submit', 'Submit'),
            type: 'info',
            itemName: offering.name ?? '',
            run: () => runOfferingAction(offering, submitOffering)
        });
    };

    const confirmReopen = (offering: Offering) => {
        resource.openConfirmDialog({
            title: customizeLanguageData('reopen', 'Reopen'),
            message: customizeLanguageData(
                'reopenOfferingExplainer',
                'This returns the offering to draft so it can be reworked.'
            ),
            confirmLabel: customizeLanguageData('reopen', 'Reopen'),
            type: 'info',
            itemName: offering.name ?? '',
            run: () => runOfferingAction(offering, reopenOffering)
        });
    };

    /**
     * The overflow menu. The three decisions live on the card itself, so this
     * only carries what is left: view, submit, reopen, edit and delete.
     */
    const getActionOptions = (offering: Offering): ActionOption[] => {
        const options: ActionOption[] = [];

        if (allowedRoutesStore.can('seeCourseOffering')) {
            options.push({
                label: customizeLanguageData('viewDetails', 'View details'),
                icon: EyeIcon,
                onClick: () => router.push(`/offerings/${offering.uuid}`)
            });
        }

        if (isEditable(offering) && allowedRoutesStore.can('submitCourseOffering')) {
            options.push({
                label: customizeLanguageData('submitForApproval', 'Submit for approval'),
                icon: SendPlaneIcon,
                onClick: () => confirmSubmit(offering)
            });
        }

        if (offering.status_code === OFFERING_STATUS.REJECTED && allowedRoutesStore.can('reopenCourseOffering')) {
            options.push({
                label: customizeLanguageData('reopen', 'Reopen'),
                icon: RefreshIcon,
                onClick: () => confirmReopen(offering)
            });
        }

        // Editing follows the STATUS, not just the permission: an offering the
        // tiers are voting on is not the author's to change underneath them.
        if (isEditable(offering)) {
            return [...options, ...resource.getActionOptions(offering, false)];
        }

        return options;
    };

    /**
     * Rows grouped by department, then section — the two axes a registrar
     * actually reads a plan by.
     */
    const groupedOfferings = computed(() => {
        const groups = new Map<string, { key: string; label: string; offerings: Offering[] }>();

        resource.items.value.data.forEach((offering) => {
            const label = offering.department?.name ?? customizeLanguageData('unassigned', 'Unassigned');
            const key = String(offering.department_id ?? 'none');

            if (!groups.has(key)) groups.set(key, { key, label, offerings: [] });
            groups.get(key)!.offerings.push(offering);
        });

        groups.forEach((group) => {
            group.offerings.sort((first, second) =>
                (first.section?.name ?? '').localeCompare(second.section?.name ?? '')
            );
        });

        return [...groups.values()];
    });

    return {
        ...resource,
        ...importExport,

        offerings: resource.items,
        fetchOfferings: refresh,
        saveOfferingForm: resource.saveForm,
        getActionOptions,

        statusFlow,
        filters,
        groupedOfferings,

        viewMode,
        isBoard,
        setViewMode,

        activeQueue,
        queueTabs,
        summary,
        selectQueue,
        applyFilters,
        clearFilters,
        loadSummary,

        canDecide,
        isEditable,
        tierIndex,
        decisionDialogVisible,
        decisionTarget,
        decisionCode,
        decisionRemark,
        isBulkRunning,
        bulkResultVisible,
        bulkResult,
        runBulkAction,
        isDeciding,
        openDecision,
        closeDecision,
        submitDecision,
        confirmSubmit,
        confirmReopen,

        APPROVAL_DECISION
    };
}

export const useOffering = createSharedComposable(offeringManager);
