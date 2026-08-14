import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useStatusFlow } from '@/composables/useStatusFlow';
import { useCrudResource } from '@/composables/useCrudResource';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import axiosInstance from '@/api/axiosInstance';
import type { LookupValueRef } from '@/composables/useLookupValues';
import { invigilationRequestSchema } from '@/modules/invigilation/schemas/invigilationRequestSchema';
import {
    INVIGILATION_REQUEST_LOOKUP_TYPE,
    INVIGILATION_REQUEST_STATUS
} from '@/modules/invigilation/constants/invigilationStatus';
import type {
    InvigilationRequest,
    InvigilationRequestDepartment,
    InvigilationRequestForm
} from '@/modules/invigilation/types/invigilationRequest';
import {
    fetchInvigilationRequests,
    createInvigilationRequest,
    updateInvigilationRequest,
    sendInvigilationRequest,
    closeInvigilationRequest,
    submitInvigilators,
    withdrawInvigilator,
    type InvigilationRequestListParams,
    type InvigilationRequestPayload
} from '@/modules/invigilation/services/invigilationRequestService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import { DROPDOWN_PARAM_KEY, STATUS_DANGER } from '@/config/appConfig';
import type { DropdownOption } from '@/types/CommonTypes';

import SendPlaneIcon from '@/assets/icons/SendPlaneIcon.vue';
import BanIcon from '@/assets/icons/BanIcon.vue';

/** A department has tens of staff, never pages of them. */
const ELIGIBLE_INSTRUCTOR_LIMIT = 200;

const emptyForm = (): InvigilationRequestForm => ({
    semester_id: null,
    exam_type_lookup_value_id: null,
    remark: '',
    // One blank row, because a request with no department asks nobody.
    departments: [{ department_id: null, required_count: '' }]
});

/**
 * Invigilator requests — the registrar asks, departments answer.
 *
 * One composable serves both sides. The registrar's list and the department's
 * inbox are the same rows read from different ends: the backend scopes what
 * comes back by the departments a user owns, so the difference is which
 * actions are offered, not which screen is open.
 */
function invigilationRequestManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** Statuses + legal edges, both straight from the backend lookup catalogue. */
    const statusFlow = useStatusFlow(INVIGILATION_REQUEST_LOOKUP_TYPE);

    const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });
    const departmentDropdown = useDropdownOptions<DropdownOption>('/departments', { [DROPDOWN_PARAM_KEY]: true });

    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    /**
     * True when the signed-in user answers FOR a department rather than
     * running the exchange. A head reads the same rows as the registrar, but
     * institution-wide totals are not their business — their own department's
     * three figures are.
     */
    const isDepartmentView = computed(
        () => allowedRoutesStore.isScopeRestricted && allowedRoutesStore.managedDepartments.length > 0
    );

    /** This user's own share of a request, when they head one of its departments. */
    const ownShare = (request: InvigilationRequest): InvigilationRequestDepartment | null =>
        (request.departments ?? []).find((share) => allowedRoutesStore.managesDepartment(share.department_id)) ?? null;

    const columns = computed(() =>
        isDepartmentView.value
            ? [
                  { key: 'name', label: customizeLanguageData('examinationScope', 'Examination') },
                  { key: 'own_department', label: customizeLanguageData('department', 'Department') },
                  { key: 'own_required', label: customizeLanguageData('requiredTotal', 'Required') },
                  { key: 'own_submitted', label: customizeLanguageData('submittedTotal', 'Submitted') },
                  { key: 'own_remaining', label: customizeLanguageData('remainingTotal', 'Remaining') },
                  { key: 'own_status', label: customizeLanguageData('status', 'Status') }
              ]
            : [
                  { key: 'name', label: customizeLanguageData('examinationScope', 'Examination') },
                  { key: 'department_count', label: customizeLanguageData('departments', 'Departments') },
                  { key: 'required_total', label: customizeLanguageData('requiredTotal', 'Required') },
                  { key: 'submitted_total', label: customizeLanguageData('submittedTotal', 'Submitted') },
                  { key: 'remaining_total', label: customizeLanguageData('remainingTotal', 'Remaining') },
                  { key: 'status_code', label: customizeLanguageData('status', 'Status') }
              ]
    );

    const filters = computed(() => [
        {
            label: customizeLanguageData('semester', 'Semester'),
            key: 'semester_id',
            options: semesterDropdown.options.value.map((semester: DropdownOption) => ({
                label: semester.name,
                value: semester.id
            }))
        },
        {
            label: customizeLanguageData('status', 'Status'),
            key: 'status_code',
            options: statusFlow.statuses.value.map((status: LookupValueRef) => ({
                label: status.name,
                value: status.code
            }))
        }
    ]);

    const resource = useCrudResource<InvigilationRequest, InvigilationRequestForm, InvigilationRequestPayload>({
        entity: 'InvigilationRequest',
        labelKey: 'invigilationRequest',
        labelFallback: 'Invigilation request',
        // No is_active: a request is a workflow record, closed rather than retired.
        hasState: false,
        service: {
            fetchList: (params) => fetchInvigilationRequests(params as InvigilationRequestListParams),
            create: createInvigilationRequest,
            update: updateInvigilationRequest,
            remove: () =>
                Promise.reject(
                    new Error('An invigilation request is closed, not deleted — departments have answered it')
                )
        },
        emptyForm,
        toForm: (request) => ({
            semester_id: request.semester_id,
            exam_type_lookup_value_id: request.exam_type_lookup_value_id,
            remark: request.remark ?? '',
            departments: (request.departments ?? []).map((share) => ({
                department_id: share.department_id,
                required_count: String(share.required_count)
            }))
        }),
        schema: invigilationRequestSchema,
        rowLabel: (request) => request.name,
        columns,
        filters
    });

    /** Only a draft is still the registrar's to revise — departments cannot see it yet. */
    const isDraft = (request: InvigilationRequest) => request.status_code === INVIGILATION_REQUEST_STATUS.DRAFT;
    const isOpen = (request: InvigilationRequest) => request.status_code === INVIGILATION_REQUEST_STATUS.SENT;

    // ---- the form's department rows ------------------------------------------
    const addDepartmentRow = () => {
        resource.editForm.departments.push({ department_id: null, required_count: '' });
    };

    const removeDepartmentRow = (index: number) => {
        // Never down to nothing: a request with no department asks nobody.
        if (resource.editForm.departments.length <= 1) return;

        resource.editForm.departments.splice(index, 1);
    };

    const isSavingAction = ref(false);

    /**
     * Run one lifecycle move and refresh. Every one of them can come back as a
     * translated 422 (`invalid_status_transition`, "add at least one
     * department") — never swallow it.
     */
    const runAction = async (action: () => Promise<{ message?: string }>): Promise<boolean> => {
        isSavingAction.value = true;
        try {
            const result = await action();
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();

            return true;
        } catch (error: unknown) {
            toast.error(genericError(error));

            return false;
        } finally {
            isSavingAction.value = false;
        }
    };

    const send = (request: InvigilationRequest) => runAction(() => sendInvigilationRequest(request.id));

    const confirmClose = (request: InvigilationRequest) => {
        resource.openConfirmDialog({
            title: customizeLanguageData('closeRequest', 'Close this request?'),
            message: customizeLanguageData(
                'closeRequestHint',
                'Departments can no longer send people. Whoever they have already sent stays available for exam staffing.'
            ),
            confirmLabel: customizeLanguageData('closeRequestConfirm', 'Close request'),
            type: STATUS_DANGER,
            itemName: request.name,
            run: async () => {
                await runAction(() => closeInvigilationRequest(request.id));
            }
        });
    };

    // ---- the department's answer ---------------------------------------------
    const submitDialogVisible = ref(false);
    const submitTarget = ref<InvigilationRequestDepartment | null>(null);
    const selectedInstructorIds = ref<number[]>([]);
    const submitRemark = ref('');

    /**
     * The people this department may offer: its own, able to invigilate, minus
     * anyone already sent against this same share.
     */
    /**
     * The picker's own instructor list, fetched directly rather than through
     * `useDropdownOptions`.
     *
     * That helper caches one instance per endpoint+params across the whole app
     * and disposes it when the last consumer unmounts. The duty roster and the
     * availability dialog both hold an `/instructors` instance, so this
     * dialog's department-filtered fetch was liable to be overwritten by
     * whichever screen refetched last. A local list is owned by this dialog
     * and nothing else can move it.
     */
    const instructorOptions = ref<DropdownOption[]>([]);
    const isLoadingInstructors = ref(false);
    const instructorError = ref<string | null>(null);

    const loadEligibleInstructors = async (departmentId: number) => {
        isLoadingInstructors.value = true;
        instructorError.value = null;

        try {
            const response = await axiosInstance.get('/instructors', {
                params: {
                    [DROPDOWN_PARAM_KEY]: true,
                    can_invigilate: true,
                    is_active: true,
                    department_id: departmentId,
                    limit: ELIGIBLE_INSTRUCTOR_LIMIT
                }
            });

            instructorOptions.value = response.data.data ?? [];
        } catch (error: unknown) {
            // Surfaced in the dialog: "nobody to select" and "the list failed
            // to load" look identical to a user otherwise.
            instructorError.value = genericError(error);
            instructorOptions.value = [];
        } finally {
            isLoadingInstructors.value = false;
        }
    };

    const availableInstructors = computed(() => {
        const share = submitTarget.value;
        if (!share) return [];

        const alreadySent = new Set((share.submissions ?? []).map((submission) => submission.instructor_id));

        return instructorOptions.value.filter((instructor) => !alreadySent.has(instructor.id));
    });

    /**
     * The same people, shaped for the multi-select.
     *
     * The label carries the code as well as the name because the dropdown
     * searches on the label — a head who knows "EMP-1042" can type that
     * instead of spelling a name, which is what makes the control usable once
     * a department has more staff than fit on screen.
     */
    const invigilatorOptions = computed(() =>
        availableInstructors.value.map((instructor) => ({
            id: instructor.id,
            label: instructor.employee_no ? `${instructor.name} · ${instructor.employee_no}` : instructor.name
        }))
    );

    /** Who this department has already sent against the open share. */
    const sentInvigilators = computed(() => submitTarget.value?.submissions ?? []);

    const openSubmitDialog = (share: InvigilationRequestDepartment) => {
        submitTarget.value = share;
        selectedInstructorIds.value = [];
        submitRemark.value = '';
        submitDialogVisible.value = true;
        // Only this department's people — the server refuses anyone else's.
        loadEligibleInstructors(share.department_id);
    };

    /** True once the selection would exceed what the registrar asked for. */
    const exceedsRemaining = computed(
        () => !!submitTarget.value && selectedInstructorIds.value.length > submitTarget.value.remaining_count
    );

    /**
     * Send the selection, then re-point the dialog at the share the server
     * returned.
     *
     * Refreshing the LIST is not enough — `submitTarget` holds the share object
     * the dialog is rendering, so without this the counts and the "already
     * sent" list would still show what was true before the send.
     */
    const submitSelected = async () => {
        const share = submitTarget.value;
        if (!share || !selectedInstructorIds.value.length) return;

        isSavingAction.value = true;
        try {
            const result = await submitInvigilators(
                share.id,
                [...selectedInstructorIds.value],
                submitRemark.value.trim() || null
            );

            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));

            if (result.data) submitTarget.value = result.data;
            selectedInstructorIds.value = [];
            submitRemark.value = '';

            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isSavingAction.value = false;
        }
    };

    /** Take one person back, keeping the open dialog in step with the result. */
    const withdraw = async (submissionId: number) => {
        isSavingAction.value = true;
        try {
            const result = await withdrawInvigilator(submissionId);
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));

            if (result.data && submitTarget.value?.id === result.data.id) {
                submitTarget.value = result.data;
            }

            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isSavingAction.value = false;
        }
    };

    /**
     * Send / close on top of the factory's Edit. A sent request offers no edit
     * — departments have already answered what it asked.
     */
    const getActionOptions = (request: InvigilationRequest): ActionOption[] => {
        const options: ActionOption[] = [];

        // A head does not raise, send or close requests — they answer one.
        if (isDepartmentView.value) {
            const share = ownShare(request);

            if (
                share &&
                isOpen(request) &&
                share.remaining_count > 0 &&
                allowedRoutesStore.can('respondToInvigilationRequest')
            ) {
                options.push({
                    label: customizeLanguageData('sendInvigilators', 'Send Invigilators'),
                    icon: SendPlaneIcon,
                    onClick: () => openSubmitDialog(share)
                });
            }

            return options;
        }

        if (isDraft(request)) {
            if (allowedRoutesStore.can('updateInvigilationRequest')) {
                options.push(
                    ...resource.getActionOptions(request, false).filter((option) => option.variant !== STATUS_DANGER)
                );
            }

            if (allowedRoutesStore.can('sendInvigilationRequest')) {
                options.push({
                    label: customizeLanguageData('sendRequest', 'Send to departments'),
                    icon: SendPlaneIcon,
                    onClick: () => send(request)
                });
            }
        }

        if (isOpen(request) && allowedRoutesStore.can('sendInvigilationRequest')) {
            options.push({
                label: customizeLanguageData('closeRequestConfirm', 'Close request'),
                icon: BanIcon,
                variant: STATUS_DANGER,
                onClick: () => confirmClose(request)
            });
        }

        return options;
    };

    return {
        ...resource,
        requests: resource.items,
        fetchRequests: resource.fetchItems,
        saveRequestForm: resource.saveForm,
        getActionOptions,

        statusFlow,
        semesterDropdown,
        departmentDropdown,
        isDraft,
        isOpen,
        isDepartmentView,
        ownShare,
        addDepartmentRow,
        removeDepartmentRow,

        isSavingAction,
        submitDialogVisible,
        submitTarget,
        selectedInstructorIds,
        submitRemark,
        availableInstructors,
        invigilatorOptions,
        sentInvigilators,
        isLoadingInstructors,
        instructorError,
        exceedsRemaining,
        openSubmitDialog,
        submitSelected,
        withdraw
    };
}

export const useInvigilationRequest = createSharedComposable(invigilationRequestManager);
