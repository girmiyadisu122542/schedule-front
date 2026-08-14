import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useStatusFlow } from '@/composables/useStatusFlow';
import { useCrudResource } from '@/composables/useCrudResource';
import { useCurrentSemester } from '@/composables/useCurrentSemester';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { useLookupValues, type LookupValueRef } from '@/composables/useLookupValues';
import { examScheduleSchema } from '@/modules/scheduling/schemas/examScheduleSchema';
import {
    EXAM_SCHEDULE_LOOKUP_TYPE,
    EXAM_SCHEDULE_STATUS,
    EXAM_TYPE_LOOKUP_TYPE
} from '@/modules/scheduling/constants/classScheduleStatus';
import type { ExamSchedule, ExamScheduleForm } from '@/modules/scheduling/types/examSchedule';
import type { ScheduleEvent } from '@/modules/scheduling/types/calendar';
import {
    fetchExamSchedules,
    createExamSchedule,
    updateExamSchedule,
    deleteExamSchedule,
    confirmExamSchedule,
    publishExamSchedule,
    cancelExamSchedule,
    pinExamSchedule,
    type ExamScheduleListParams,
    type ExamSchedulePayload
} from '@/modules/scheduling/services/examScheduleService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import type { DropdownOption } from '@/types/CommonTypes';
import { DROPDOWN_PARAM_KEY, STATUS_DANGER } from '@/config/appConfig';

import SendPlaneIcon from '@/assets/icons/SendPlaneIcon.vue';
import BanIcon from '@/assets/icons/BanIcon.vue';
import PinnedIcon from '@/assets/icons/PinnedIcon.vue';
import CheckBadgeIcon from '@/assets/icons/CheckBadgeIcon.vue';
import ShieldCheckAltIcon from '@/assets/icons/ShieldCheckAltIcon.vue';

const DAYS_PER_WEEK = 7;

const emptyForm = (): ExamScheduleForm => ({
    course_offering_id: null,
    exam_type_lookup_value_id: null,
    room_id: null,
    exam_date: '',
    start_time: '',
    end_time: '',
    required_invigilators: '1',
    accommodation_note: '',
    accommodation_extra_minutes: '',
    accommodation_room_id: null
});

function examScheduleManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** Statuses + legal edges, both straight from the backend lookup catalogue. */
    const statusFlow = useStatusFlow(EXAM_SCHEDULE_LOOKUP_TYPE);
    /** Only for its weekday names — the month grid's column headers. */
    const schedulingConstants = useSchedulingConstants();
    const currentSemester = useCurrentSemester();
    /**
     * The semester filter's catalogue. A month grid draws one exam period at a
     * time — without this every semester's sittings would share a calendar.
     */
    const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const columns = computed(() => [
        { key: 'course_offering', label: customizeLanguageData('courseCode', 'Course') },
        { key: 'exam_type_code', label: customizeLanguageData('examType', 'Type') },
        { key: 'exam_date', label: customizeLanguageData('examDate', 'Date') },
        { key: 'time_range', label: customizeLanguageData('time', 'Time') },
        { key: 'room', label: customizeLanguageData('room', 'Hall') },
        { key: 'required_invigilators', label: customizeLanguageData('invigilators', 'Invigilators') },
        { key: 'status_code', label: customizeLanguageData('status', 'Status') }
    ]);

    /** Midterm / final / makeup / quiz — the exam-type filter's options. */
    const examTypes = useLookupValues(EXAM_TYPE_LOOKUP_TYPE);

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
            // Midterm, final, makeup, quiz. A registrar looks at one sitting at
            // a time — mixing a midterm week into a finals list is noise, and
            // the backend has always accepted this filter.
            label: customizeLanguageData('examType', 'Exam type'),
            key: 'exam_type_code',
            options: examTypes.options.value.map((type: LookupValueRef) => ({
                label: type.name,
                value: type.code
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

    const resource = useCrudResource<ExamSchedule, ExamScheduleForm, ExamSchedulePayload>({
        entity: 'ExamSchedule',
        labelKey: 'examSchedule',
        labelFallback: 'Exam Schedule',
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
            required_invigilators: String(schedule.required_invigilators),
            accommodation_note: schedule.accommodation_note ?? '',
            accommodation_extra_minutes: schedule.accommodation_extra_minutes
                ? String(schedule.accommodation_extra_minutes)
                : '',
            accommodation_room_id: schedule.accommodation_room_id ?? null
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
            title: customizeLanguageData('cancelSitting', 'Cancel this schedule?'),
            message: customizeLanguageData(
                'cancelSittingHint',
                'The schedule stays on record as cancelled, and its hall and the section’s window are freed.'
            ),
            confirmLabel: customizeLanguageData('cancelSittingConfirm', 'Cancel schedule'),
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
    /**
     * Pin or unpin a draft sitting, so the next generation run schedules
     * around it rather than replacing it.
     */
    const togglePin = (schedule: ExamSchedule) => runAction(() => pinExamSchedule(schedule.id, !schedule.is_pinned));

    /** Which sitting's invigilators are open, if any. */
    const invigilatorsDialogVisible = ref(false);
    const invigilatorsTarget = ref<ExamSchedule | null>(null);

    const openInvigilators = (schedule: ExamSchedule) => {
        invigilatorsTarget.value = schedule;
        invigilatorsDialogVisible.value = true;
    };

    /**
     * The row menu, in three named sections.
     *
     * A flat list of eight actions is a wall — the reader has to check every
     * line to find the one they want, and the destructive ones sit next to the
     * routine ones with nothing between them. Grouped, it reads as three short
     * lists: look at it, staff it, move it along — with cancelling separated at
     * the bottom where a mis-click is least likely to land.
     *
     * The lifecycle section shows only the moves that are legal from where the
     * sitting actually is, which the transition catalogue already decides.
     */
    const getActionOptions = (schedule: ExamSchedule): ActionOption[] => {
        const options: ActionOption[] = [];

        const canReachStatus = (code: string) =>
            statusFlow.allowedTargets(schedule.status_code).some((status: LookupValueRef) => status.code === code);

        // ---- ungrouped: reading a sitting is not an edit ----
        const detail = resource.getDetailOption(schedule);
        if (detail) {
            options.push(detail);
        }

        // ---- Staffing ----
        // Available at every status: a published sitting still loses an
        // invigilator to illness, and that has to be fixable without
        // unpublishing the exam.
        if (allowedRoutesStore.can('assignInvigilator')) {
            options.push({
                label: customizeLanguageData('manageInvigilators', 'Invigilators'),
                icon: ShieldCheckAltIcon,
                group: customizeLanguageData('staffing', 'Staffing'),
                onClick: () => openInvigilators(schedule)
            });
        }

        // ---- Edit ----
        if (isEditable(schedule)) {
            resource.getActionOptions(schedule, false).forEach((option: ActionOption) => {
                options.push({
                    ...option,
                    // Deleting a draft belongs with the destructive moves, not
                    // beside Edit where the cursor already is.
                    group:
                        option.variant === STATUS_DANGER
                            ? customizeLanguageData('dangerZone', 'Careful')
                            : customizeLanguageData('editGroup', 'Edit')
                });
            });

            if (allowedRoutesStore.can('updateExamSchedule')) {
                options.push({
                    label: schedule.is_pinned
                        ? customizeLanguageData('unpinSchedule', 'Unpin')
                        : customizeLanguageData('pinSchedule', 'Pin — keep through regeneration'),
                    icon: PinnedIcon,
                    group: customizeLanguageData('editGroup', 'Edit'),
                    onClick: () => togglePin(schedule)
                });
            }
        }

        // ---- Workflow: only the next legal step ----
        const workflow = customizeLanguageData('workflowGroup', 'Workflow');

        if (isEditable(schedule) && allowedRoutesStore.can('confirmExamSchedule')) {
            options.push({
                label: customizeLanguageData('sendForConfirmation', 'Send for confirmation'),
                icon: SendPlaneIcon,
                group: workflow,
                onClick: () => sendForConfirmation(schedule)
            });
        }

        if (allowedRoutesStore.can('confirmExamSchedule') && isAwaitingDepartment(schedule)) {
            options.push({
                label: customizeLanguageData('confirmSitting', 'Confirm schedule'),
                icon: CheckBadgeIcon,
                group: workflow,
                onClick: () => openConfirmDialog(schedule)
            });
        }

        if (allowedRoutesStore.can('publishExamSchedule') && canReachStatus(EXAM_SCHEDULE_STATUS.PUBLISHED)) {
            options.push({
                label: customizeLanguageData('publishSitting', 'Publish'),
                icon: SendPlaneIcon,
                group: workflow,
                onClick: () => publish(schedule)
            });
        }

        // ---- Careful ----
        if (allowedRoutesStore.can('cancelExamSchedule') && canReachStatus(EXAM_SCHEDULE_STATUS.CANCELLED)) {
            options.push({
                label: customizeLanguageData('cancelSittingConfirm', 'Cancel schedule'),
                icon: BanIcon,
                variant: STATUS_DANGER,
                group: customizeLanguageData('dangerZone', 'Careful'),
                onClick: () => confirmCancel(schedule)
            });
        }

        return options;
    };

    /**
     * The rows as the month grid reads them.
     *
     * Every status shows: a sitting still short of publication is dashed, a
     * cancelled one is struck through. Colour comes from the exam type's own
     * lookup value, so a final and a makeup are told apart without a legend.
     */
    const calendarEvents = computed<ScheduleEvent[]>(() =>
        resource.items.value.data.map((exam) => ({
            id: exam.id,
            title: exam.course_offering?.course_code || exam.course_offering?.name || '—',
            tooltip: exam.course_offering?.name ?? undefined,
            courseCode: exam.course_offering?.course_code ?? undefined,
            courseTitle: exam.course_offering?.course_title ?? undefined,
            invigilators: exam.invigilators ?? undefined,
            subtitle: [
                exam.room?.name || customizeLanguageData('noRoom', 'No hall'),
                `${exam.required_invigilators} ${customizeLanguageData('invigilators', 'Invigilators')}`
            ].join(' · '),
            badge: exam.exam_type?.name || exam.exam_type_code || undefined,
            start: exam.start_time,
            end: exam.end_time,
            date: exam.exam_date,
            color: exam.exam_type?.color ?? null,
            statusLabel: exam.status?.name ?? exam.status_code ?? undefined,
            cohort: {
                sectionId: exam.section?.id ?? null,
                sectionLabel: exam.section?.name ?? null,
                programId: exam.program?.id ?? null,
                programLabel: exam.program?.name ?? null,
                departmentId: exam.department?.id ?? null,
                departmentLabel: exam.department?.name ?? null
            },
            isTentative: exam.status_code !== EXAM_SCHEDULE_STATUS.PUBLISHED,
            isMuted:
                exam.status_code === EXAM_SCHEDULE_STATUS.CANCELLED ||
                exam.status_code === EXAM_SCHEDULE_STATUS.REJECTED,
            record: exam
        }))
    );

    /** Monday-first weekday names; anything short of a full week is left to the grid's fallback. */
    const weekdayNames = computed(() => {
        const names = schedulingConstants.dayOptions.value.map((day) => day.name);

        return names.length === DAYS_PER_WEEK ? names : undefined;
    });

    /**
     * The semester the registrar is actually working in, as a filter.
     *
     * The screen used to lean on pagination to keep the list manageable; a
     * calendar has no pages, so the scope has to be explicit or every
     * semester's sittings share one month.
     *
     * It only RESOLVES the filter — the view applies it, because the view is
     * what knows to merge in the academic scope at the same time.
     *
     * @returns `{ semester_id }`, or empty when no semester is flagged current
     */
    const currentSemesterFilter = async (): Promise<Record<string, unknown>> => {
        await currentSemester.load();

        const semesterId = currentSemester.semesterId.value;

        return semesterId ? { semester_id: semesterId } : {};
    };

    return {
        ...resource,
        exams: resource.items,
        fetchExams: resource.fetchItems,
        calendarEvents,
        weekdayNames,
        schedulingConstants,
        currentSemesterFilter,
        semesterDropdown,
        currentSemester,
        saveExamForm: resource.saveForm,
        getActionOptions,
        isEditable,

        statusFlow,
        examTypes,
        invigilatorsDialogVisible,
        invigilatorsTarget,
        openInvigilators,
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
