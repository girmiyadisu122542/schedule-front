import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useStatusFlow } from '@/composables/useStatusFlow';
import { useCrudResource } from '@/composables/useCrudResource';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import type { LookupValueRef } from '@/composables/useLookupValues';
import { classScheduleSchema } from '@/modules/scheduling/schemas/classScheduleSchema';
import { CLASS_SCHEDULE_LOOKUP_TYPE, CLASS_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import type { ClassSchedule, ClassScheduleForm } from '@/modules/scheduling/types/classSchedule';
import {
    fetchClassSchedules,
    createClassSchedule,
    updateClassSchedule,
    deleteClassSchedule,
    publishClassSchedule,
    cancelClassSchedule,
    type ClassScheduleListParams,
    type ClassSchedulePayload
} from '@/modules/scheduling/services/classScheduleService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import { STATUS_DANGER } from '@/config/appConfig';

import SendPlaneIcon from '@/assets/icons/SendPlaneIcon.vue';
import BanIcon from '@/assets/icons/BanIcon.vue';

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

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const columns = computed(() => [
        { key: 'course_offering', label: customizeLanguageData('courseOffering', 'Offering') },
        { key: 'day_of_week', label: customizeLanguageData('dayOfWeek', 'Day') },
        { key: 'time_range', label: customizeLanguageData('time', 'Time') },
        { key: 'room', label: customizeLanguageData('room', 'Room') },
        { key: 'instructor', label: customizeLanguageData('instructor', 'Instructor') },
        { key: 'session_type_code', label: customizeLanguageData('sessionType', 'Session') },
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
        labelFallback: 'Class Meeting',
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
     * the backend Form Request validates the whole meeting, not a patch — see
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
            title: customizeLanguageData('cancelMeeting', 'Cancel this meeting?'),
            message: customizeLanguageData(
                'cancelMeetingHint',
                'The meeting stays on record as cancelled, and its room, instructor and section slot are freed.'
            ),
            confirmLabel: customizeLanguageData('cancelMeetingConfirm', 'Cancel meeting'),
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
     * cancelled meeting offers neither write action — the backend refuses them
     * there, so showing them would only mislead.
     */
    const getActionOptions = (schedule: ClassSchedule): ActionOption[] => {
        const options: ActionOption[] = [];

        // Reading a meeting is not an edit — every row gets the detail link,
        // whatever its status.
        const detail = resource.getDetailOption(schedule);
        if (detail) {
            options.push(detail);
        }

        if (isEditable(schedule)) {
            options.push(...resource.getActionOptions(schedule, false));

            if (allowedRoutesStore.can('publishClassSchedule')) {
                options.push({
                    label: customizeLanguageData('publishMeeting', 'Publish'),
                    icon: SendPlaneIcon,
                    onClick: () => publish(schedule)
                });
            }
        }

        if (allowedRoutesStore.can('cancelClassSchedule') && schedule.status_code === CLASS_SCHEDULE_STATUS.PUBLISHED) {
            options.push({
                label: customizeLanguageData('cancelMeetingConfirm', 'Cancel meeting'),
                icon: BanIcon,
                variant: STATUS_DANGER,
                onClick: () => confirmCancel(schedule)
            });
        }

        return options;
    };

    return {
        ...resource,
        schedules: resource.items,
        fetchSchedules: resource.fetchItems,
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
