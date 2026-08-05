import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useStatusFlow } from '@/composables/useStatusFlow';
import { useCrudResource } from '@/composables/useCrudResource';
import type { LookupValueRef } from '@/composables/useLookupValues';
import { examScheduleSchema } from '@/modules/scheduling/schemas/examScheduleSchema';
import { EXAM_SCHEDULE_LOOKUP_TYPE, EXAM_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import type { ExamSchedule, ExamScheduleForm } from '@/modules/scheduling/types/examSchedule';
import {
    fetchExamSchedules,
    createExamSchedule,
    updateExamSchedule,
    deleteExamSchedule,
    confirmExamSchedule,
    publishExamSchedule,
    cancelExamSchedule,
    type ExamScheduleListParams,
    type ExamSchedulePayload
} from '@/modules/scheduling/services/examScheduleService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import { STATUS_DANGER } from '@/config/appConfig';

import SendPlaneIcon from '@/assets/icons/SendPlaneIcon.vue';
import BanIcon from '@/assets/icons/BanIcon.vue';
import CheckBadgeIcon from '@/assets/icons/CheckBadgeIcon.vue';

const emptyForm = (): ExamScheduleForm => ({
    course_offering_id: null,
    exam_type_lookup_value_id: null,
    room_id: null,
    exam_date: '',
    start_time: '',
    end_time: '',
    required_invigilators: '1'
});

function examScheduleManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** Statuses + legal edges, both straight from the backend lookup catalogue. */
    const statusFlow = useStatusFlow(EXAM_SCHEDULE_LOOKUP_TYPE);

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const columns = computed(() => [
        { key: 'course_offering', label: customizeLanguageData('courseOffering', 'Offering') },
        { key: 'exam_type_code', label: customizeLanguageData('examType', 'Type') },
        { key: 'exam_date', label: customizeLanguageData('examDate', 'Date') },
        { key: 'time_range', label: customizeLanguageData('time', 'Time') },
        { key: 'room', label: customizeLanguageData('room', 'Hall') },
        { key: 'required_invigilators', label: customizeLanguageData('invigilators', 'Invigilators') },
        { key: 'status_code', label: customizeLanguageData('status', 'Status') }
    ]);

    const filters = computed(() => [
        {
            label: customizeLanguageData('status', 'Status'),
            key: 'status_code',
            options: statusFlow.statuses.value.map((status: LookupValueRef) => ({
                label: status.name,
                value: status.code
            }))
        }
    ]);

    const resource = useCrudResource<ExamSchedule, ExamScheduleForm, ExamSchedulePayload>({
        entity: 'ExamSchedule',
        labelKey: 'examSchedule',
        labelFallback: 'Exam Sitting',
        // `state` is the conflict-liveness flag, not an is_active toggle.
        hasState: false,
        service: {
            fetchList: (params) => fetchExamSchedules(params as ExamScheduleListParams),
            create: createExamSchedule,
            update: updateExamSchedule,
            remove: deleteExamSchedule
        },
        emptyForm,
        toForm: (schedule) => ({
            course_offering_id: schedule.course_offering_id,
            exam_type_lookup_value_id: schedule.exam_type_lookup_value_id,
            room_id: schedule.room_id,
            exam_date: schedule.exam_date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            required_invigilators: String(schedule.required_invigilators)
        }),
        detailPath: (schedule) => `/scheduling/exams/${schedule.uuid}`,
        schema: examScheduleSchema,
        rowLabel: (schedule) => schedule.name,
        columns,
        filters
    });

    /** Only a draft is still the registrar's to move around. */
    const isEditable = (schedule: ExamSchedule) => schedule.status_code === EXAM_SCHEDULE_STATUS.DRAFT;

    const isSavingAction = ref(false);

    /**
     * Run one lifecycle action and refresh the list. Every one of them can come
     * back as a translated 422 (`invalid_status_transition`, "give the sitting a
     * hall") — never swallow it.
     *
     * @param action the service call
     * @returns true when the move stuck
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

    // ---- the department confirmation step ------------------------------------
    const confirmDialogVisible = ref(false);
    const confirmTarget = ref<ExamSchedule | null>(null);
    const confirmRemark = ref('');

    /**
     * A `draft` is being SENT for confirmation — nobody is agreeing to anything
     * yet, so that half needs no remark and no dialog.
     */
    const isAwaitingDepartment = (schedule: ExamSchedule) =>
        schedule.status_code === EXAM_SCHEDULE_STATUS.PENDING_CONFIRMATION;

    const openConfirmDialog = (schedule: ExamSchedule) => {
        confirmTarget.value = schedule;
        confirmRemark.value = '';
        confirmDialogVisible.value = true;
    };

    const submitConfirmation = async () => {
        const schedule = confirmTarget.value;
        if (!schedule) return;

        const done = await runAction(() => confirmExamSchedule(schedule.id, confirmRemark.value.trim() || null));
        if (done) {
            confirmDialogVisible.value = false;
        }
    };

    const sendForConfirmation = (schedule: ExamSchedule) => runAction(() => confirmExamSchedule(schedule.id));

    const publish = (schedule: ExamSchedule) => runAction(() => publishExamSchedule(schedule.id));

    const confirmCancel = (schedule: ExamSchedule) => {
        resource.openConfirmDialog({
            title: customizeLanguageData('cancelSitting', 'Cancel this sitting?'),
            message: customizeLanguageData(
                'cancelSittingHint',
                'The sitting stays on record as cancelled, and its hall and the cohort’s window are freed.'
            ),
            confirmLabel: customizeLanguageData('cancelSittingConfirm', 'Cancel sitting'),
            type: STATUS_DANGER,
            itemName: schedule.name,
            run: async () => {
                await runAction(() => cancelExamSchedule(schedule.id));
            }
        });
    };

    /**
     * Edit / Delete on a draft, plus whichever lifecycle move the sitting's
     * current status actually allows. Anything the backend would refuse is not
     * offered — `lookup_transitions` is the authority, and these checks only
     * mirror it.
     */
    const getActionOptions = (schedule: ExamSchedule): ActionOption[] => {
        const options: ActionOption[] = [];

        // Reading a sitting is not an edit — every row gets the detail link,
        // whatever its status.
        const detail = resource.getDetailOption(schedule);
        if (detail) {
            options.push(detail);
        }

        if (isEditable(schedule)) {
            options.push(...resource.getActionOptions(schedule, false));

            if (allowedRoutesStore.can('confirmExamSchedule')) {
                options.push({
                    label: customizeLanguageData('sendForConfirmation', 'Send for confirmation'),
                    icon: SendPlaneIcon,
                    onClick: () => sendForConfirmation(schedule)
                });
            }
        }

        if (allowedRoutesStore.can('confirmExamSchedule') && isAwaitingDepartment(schedule)) {
            options.push({
                label: customizeLanguageData('confirmSitting', 'Confirm sitting'),
                icon: CheckBadgeIcon,
                onClick: () => openConfirmDialog(schedule)
            });
        }

        if (
            allowedRoutesStore.can('publishExamSchedule') &&
            statusFlow
                .allowedTargets(schedule.status_code)
                .some((status: LookupValueRef) => status.code === EXAM_SCHEDULE_STATUS.PUBLISHED)
        ) {
            options.push({
                label: customizeLanguageData('publishSitting', 'Publish'),
                icon: SendPlaneIcon,
                onClick: () => publish(schedule)
            });
        }

        if (
            allowedRoutesStore.can('cancelExamSchedule') &&
            statusFlow
                .allowedTargets(schedule.status_code)
                .some((status: LookupValueRef) => status.code === EXAM_SCHEDULE_STATUS.CANCELLED)
        ) {
            options.push({
                label: customizeLanguageData('cancelSittingConfirm', 'Cancel sitting'),
                icon: BanIcon,
                variant: STATUS_DANGER,
                onClick: () => confirmCancel(schedule)
            });
        }

        return options;
    };

    return {
        ...resource,
        exams: resource.items,
        fetchExams: resource.fetchItems,
        saveExamForm: resource.saveForm,
        getActionOptions,
        isEditable,

        statusFlow,
        isSavingAction,
        confirmDialogVisible,
        confirmTarget,
        confirmRemark,
        submitConfirmation,
        sendForConfirmation,
        publish,
        confirmCancel
    };
}

export const useExamSchedule = createSharedComposable(examScheduleManager);
