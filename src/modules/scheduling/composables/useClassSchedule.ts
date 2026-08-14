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
import type { LookupValueRef } from '@/composables/useLookupValues';
import { classScheduleSchema } from '@/modules/scheduling/schemas/classScheduleSchema';
import { CLASS_SCHEDULE_LOOKUP_TYPE, CLASS_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import { axisBoundsFromSlots, weekGridDays } from '@/modules/scheduling/composables/useCalendarLayout';
import type { ClassSchedule, ClassScheduleForm } from '@/modules/scheduling/types/classSchedule';
import type { ScheduleEvent } from '@/modules/scheduling/types/calendar';
import {
    fetchClassSchedules,
    createClassSchedule,
    updateClassSchedule,
    deleteClassSchedule,
    publishClassSchedule,
    cancelClassSchedule,
    pinClassSchedule,
    confirmClassSchedule,
    returnClassScheduleToDraft,
    type ClassScheduleListParams,
    type ClassSchedulePayload
} from '@/modules/scheduling/services/classScheduleService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import type { DropdownOption } from '@/types/CommonTypes';
import { DROPDOWN_PARAM_KEY, STATUS_DANGER } from '@/config/appConfig';

import SendPlaneIcon from '@/assets/icons/SendPlaneIcon.vue';
import PinnedIcon from '@/assets/icons/PinnedIcon.vue';
import BanIcon from '@/assets/icons/BanIcon.vue';
import CheckCircle from '@/assets/icons/CheckCircle.vue';

const emptyForm = (): ClassScheduleForm => ({
    course_offering_id: null,
    instructor_id: null,
    room_id: null,
    session_type_lookup_value_id: null,
    day_of_week: null,
    start_time: '',
    end_time: ''
});

function classScheduleManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** Statuses + legal edges, both straight from the backend lookup catalogue. */
    const statusFlow = useStatusFlow(CLASS_SCHEDULE_LOOKUP_TYPE);
    const schedulingConstants = useSchedulingConstants();
    const currentSemester = useCurrentSemester();
    /**
     * The semester filter's catalogue. A week grid draws one semester's worth of
     * sessions at a time — without this the grid would stack every semester on
     * the same Monday.
     */
    const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const columns = computed(() => [
        { key: 'course_offering', label: customizeLanguageData('courseCode', 'Course') },
        { key: 'day_of_week', label: customizeLanguageData('dayOfWeek', 'Day') },
        { key: 'time_range', label: customizeLanguageData('time', 'Time') },
        { key: 'room', label: customizeLanguageData('room', 'Room') },
        { key: 'instructor', label: customizeLanguageData('instructor', 'Instructor') },
        { key: 'session_type_code', label: customizeLanguageData('sessionType', 'Session') },
        { key: 'status_code', label: customizeLanguageData('status', 'Status') }
    ]);

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
        },
        {
            label: customizeLanguageData('dayOfWeek', 'Day'),
            key: 'day_of_week',
            options: schedulingConstants.dayOptions.value.map((day) => ({
                label: day.name,
                value: day.id
            }))
        }
    ]);

    const resource = useCrudResource<ClassSchedule, ClassScheduleForm, ClassSchedulePayload>({
        entity: 'ClassSchedule',
        labelKey: 'classSchedule',
        labelFallback: 'Class Schedule',
        // `state` is the conflict-liveness flag, not an is_active toggle — it
        // moves only with the status, so there is no state action.
        hasState: false,
        service: {
            fetchList: (params) => fetchClassSchedules(params as ClassScheduleListParams),
            create: createClassSchedule,
            update: updateClassSchedule,
            remove: deleteClassSchedule
        },
        emptyForm,
        toForm: (schedule) => ({
            course_offering_id: schedule.course_offering_id,
            instructor_id: schedule.instructor_id,
            room_id: schedule.room_id,
            session_type_lookup_value_id: schedule.session_type_lookup_value_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time
        }),
        detailPath: (schedule) => `/scheduling/classes/${schedule.uuid}`,
        schema: classScheduleSchema,
        rowLabel: (schedule) => schedule.name,
        columns,
        filters
    });

    /** Only a draft is still the registrar's to move around. */
    const isEditable = (schedule: ClassSchedule) => schedule.status_code === CLASS_SCHEDULE_STATUS.DRAFT;

    /** The row an inline edit is currently in flight for — its cells lock. */
    const savingRowId = ref<number | null>(null);

    /**
     * Save one inline-edited field. The row supplies every other value, because
     * the backend Form Request validates the whole session, not a patch — see
     * CLAUDE Sec. 10.9.
     *
     * The list is refetched either way: on success to pick up the new
     * `time_range` and label, and on failure so a cell the backend refused
     * snaps back to what is actually stored.
     *
     * @param schedule the row being edited
     * @param patch the field(s) the cell changed
     *
     * @returns true when the save stuck
     */
    const saveInlineEdit = async (schedule: ClassSchedule, patch: Partial<ClassSchedulePayload>): Promise<boolean> => {
        // Nothing to send when the cell re-emits the value it already had.
        const unchanged = Object.entries(patch).every(
            ([field, value]) => schedule[field as keyof ClassSchedule] === value
        );
        if (unchanged || savingRowId.value === schedule.id) return false;

        savingRowId.value = schedule.id;
        try {
            const saved = await updateClassSchedule(schedule.id, {
                course_offering_id: schedule.course_offering_id,
                instructor_id: schedule.instructor_id,
                room_id: schedule.room_id,
                session_type_lookup_value_id: schedule.session_type_lookup_value_id,
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                ...patch
            });

            toast.success(saved.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();

            return true;
        } catch (error: unknown) {
            // A clash comes back from an EXCLUDE constraint as a translated 422
            // ("That room is already taken at this time") — always show it.
            toast.error(genericError(error));
            await resource.fetchItems();

            return false;
        } finally {
            savingRowId.value = null;
        }
    };

    const isPublishing = ref(false);

    const publish = async (schedule: ClassSchedule) => {
        isPublishing.value = true;
        try {
            const published = await publishClassSchedule(schedule.id);
            toast.success(published.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isPublishing.value = false;
        }
    };

    const confirmCancel = (schedule: ClassSchedule) => {
        resource.openConfirmDialog({
            title: customizeLanguageData('cancelClassSession', 'Cancel this schedule?'),
            message: customizeLanguageData(
                'cancelClassSessionHint',
                'The schedule stays on record as cancelled, and its room, instructor and section slot are freed.'
            ),
            confirmLabel: customizeLanguageData('cancelClassSessionConfirm', 'Cancel schedule'),
            type: STATUS_DANGER,
            itemName: schedule.name,
            run: async () => {
                try {
                    const cancelled = await cancelClassSchedule(schedule.id);
                    toast.success(
                        cancelled.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully')
                    );
                    await resource.fetchItems();
                } catch (error: unknown) {
                    toast.error(genericError(error));
                }
            }
        });
    };

    /**
     * Publish / cancel on top of the factory's Edit and Delete. A published or
     * cancelled session offers neither write action — the backend refuses them
     * there, so showing them would only mislead.
     */
    /**
     * Pin or unpin a draft session.
     *
     * A pinned session survives the next generation run and, being still live,
     * keeps its room, instructor and section slot reserved — so the run
     * schedules around it rather than over it.
     */
    /**
     * Move a session through the department confirmation step.
     *
     * The backend decides whether this asks for confirmation or gives it, from
     * where the session already is — so one action serves both sides.
     */
    const confirm = async (schedule: ClassSchedule) => {
        isPublishing.value = true;
        try {
            const result = await confirmClassSchedule(schedule.id);
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isPublishing.value = false;
        }
    };

    /** Send a session back to draft, with the department's reason recorded. */
    const sendBack = async (schedule: ClassSchedule) => {
        isPublishing.value = true;
        try {
            const result = await returnClassScheduleToDraft(schedule.id);
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isPublishing.value = false;
        }
    };

    const togglePin = async (schedule: ClassSchedule) => {
        isPublishing.value = true;
        try {
            const result = await pinClassSchedule(schedule.id, !schedule.is_pinned);
            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isPublishing.value = false;
        }
    };

    const getActionOptions = (schedule: ClassSchedule): ActionOption[] => {
        const options: ActionOption[] = [];

        const editGroup = customizeLanguageData('editGroup', 'Edit');
        const workflow = customizeLanguageData('workflowGroup', 'Workflow');
        const careful = customizeLanguageData('dangerZone', 'Careful');

        // ---- ungrouped: reading a session is not an edit ----
        const detail = resource.getDetailOption(schedule);
        if (detail) {
            options.push(detail);
        }

        // ---- Edit ----
        if (isEditable(schedule)) {
            resource.getActionOptions(schedule, false).forEach((option: ActionOption) => {
                options.push({
                    ...option,
                    // Deleting belongs with the destructive moves, not beside
                    // Edit where the cursor already is.
                    group: option.variant === STATUS_DANGER ? careful : editGroup
                });
            });

            if (allowedRoutesStore.can('updateClassSchedule')) {
                options.push({
                    label: schedule.is_pinned
                        ? customizeLanguageData('unpinSchedule', 'Unpin')
                        : customizeLanguageData('pinSchedule', 'Pin — keep through regeneration'),
                    icon: PinnedIcon,
                    group: editGroup,
                    onClick: () => togglePin(schedule)
                });
            }

            // ---- Workflow ----
            if (allowedRoutesStore.can('confirmClassSchedule')) {
                options.push({
                    label: customizeLanguageData('sendForConfirmation', 'Send to department'),
                    icon: SendPlaneIcon,
                    group: workflow,
                    onClick: () => confirm(schedule)
                });
            }

            if (allowedRoutesStore.can('publishClassSchedule')) {
                options.push({
                    label: customizeLanguageData('publishClassSession', 'Publish'),
                    icon: SendPlaneIcon,
                    group: workflow,
                    onClick: () => publish(schedule)
                });
            }
        }

        // The department's own move, on a session waiting for it.
        if (
            schedule.status_code === CLASS_SCHEDULE_STATUS.PENDING_CONFIRMATION &&
            allowedRoutesStore.can('confirmClassSchedule')
        ) {
            options.push(
                {
                    label: customizeLanguageData('confirmClassSession', 'Confirm'),
                    icon: CheckCircle,
                    group: workflow,
                    onClick: () => confirm(schedule)
                },
                {
                    label: customizeLanguageData('returnToDraft', 'Send back for rework'),
                    icon: BanIcon,
                    group: workflow,
                    onClick: () => sendBack(schedule)
                }
            );
        }

        // Confirmed and waiting to go out.
        if (
            schedule.status_code === CLASS_SCHEDULE_STATUS.CONFIRMED &&
            allowedRoutesStore.can('publishClassSchedule')
        ) {
            options.push({
                label: customizeLanguageData('publishClassSession', 'Publish'),
                icon: SendPlaneIcon,
                group: workflow,
                onClick: () => publish(schedule)
            });
        }

        // ---- Careful ----
        if (allowedRoutesStore.can('cancelClassSchedule') && schedule.status_code === CLASS_SCHEDULE_STATUS.PUBLISHED) {
            options.push({
                label: customizeLanguageData('cancelClassSessionConfirm', 'Cancel schedule'),
                icon: BanIcon,
                variant: STATUS_DANGER,
                group: careful,
                onClick: () => confirmCancel(schedule)
            });
        }

        return options;
    };

    /**
     * The rows as the week grid reads them.
     *
     * Unlike the read-only timetable, this grid shows every status — a draft is
     * dashed, a cancelled session is struck through — because those are exactly
     * the states this screen exists to move.
     */
    const calendarEvents = computed<ScheduleEvent[]>(() =>
        resource.items.value.data.map((schedule) => ({
            id: schedule.id,
            title: schedule.course_offering?.course_code || schedule.course_offering?.name || '—',
            tooltip: schedule.course_offering?.name ?? undefined,
            courseCode: schedule.course_offering?.course_code ?? undefined,
            courseTitle: schedule.course_offering?.course_title ?? undefined,
            subtitle:
                [schedule.room?.name, schedule.instructor?.name].filter(Boolean).join(' · ') ||
                customizeLanguageData('noRoom', 'No room'),
            badge: schedule.session_type?.name ?? undefined,
            start: schedule.start_time,
            end: schedule.end_time,
            day: schedule.day_of_week,
            color: schedule.session_type?.color ?? null,
            dayLabel: schedulingConstants.dayName(schedule.day_of_week),
            statusLabel: schedule.status?.name ?? schedule.status_code ?? undefined,
            cohort: {
                sectionId: schedule.section?.id ?? null,
                sectionLabel: schedule.section?.name ?? null,
                programId: schedule.program?.id ?? null,
                programLabel: schedule.program?.name ?? null,
                departmentId: schedule.department?.id ?? null,
                departmentLabel: schedule.department?.name ?? null
            },
            isTentative: schedule.status_code === CLASS_SCHEDULE_STATUS.DRAFT,
            isMuted: schedule.status_code === CLASS_SCHEDULE_STATUS.CANCELLED,
            record: schedule
        }))
    );

    const gridDays = computed(() =>
        weekGridDays(
            schedulingConstants.dayOptions.value,
            schedulingConstants.teachingDays.value,
            resource.items.value.data.map((schedule) => schedule.day_of_week)
        )
    );

    const axisBounds = computed(() => axisBoundsFromSlots(schedulingConstants.timeSlots.value));

    /**
     * The semester the registrar is actually working in, as a filter.
     *
     * The screen used to lean on pagination to keep the list manageable; a grid
     * has no pages, so the scope has to be explicit or every semester's Monday
     * lands on top of every other one.
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
        schedules: resource.items,
        fetchSchedules: resource.fetchItems,
        calendarEvents,
        gridDays,
        axisBounds,
        currentSemesterFilter,
        semesterDropdown,
        currentSemester,
        saveScheduleForm: resource.saveForm,
        getActionOptions,
        isEditable,
        saveInlineEdit,
        savingRowId,

        statusFlow,
        schedulingConstants,
        isPublishing,
        publish,
        confirmCancel
    };
}

export const useClassSchedule = createSharedComposable(classScheduleManager);
