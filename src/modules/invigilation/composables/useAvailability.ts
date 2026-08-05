import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useCrudResource } from '@/composables/useCrudResource';
import { availabilitySchema } from '@/modules/invigilation/schemas/availabilitySchema';
import type { Availability, AvailabilityForm } from '@/modules/invigilation/types/availability';
import {
    fetchAvailabilities,
    submitAvailability,
    deleteAvailability,
    type AvailabilityListParams,
    type AvailabilityPayload
} from '@/modules/invigilation/services/invigilatorAvailabilityService';
import type { ActionOption } from '@/components/common/ActionMenu.vue';

const emptyForm = (): AvailabilityForm => ({
    instructor_id: null,
    semester_id: null,
    available_date: '',
    start_time: '',
    end_time: '',
    remark: ''
});

function availabilityManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'instructor', label: customizeLanguageData('instructor', 'Instructor') },
        { key: 'available_date', label: customizeLanguageData('availableDate', 'Date') },
        { key: 'time_range', label: customizeLanguageData('availabilityWindow', 'Window') },
        { key: 'semester', label: customizeLanguageData('semester', 'Semester') },
        { key: 'submitted_by', label: customizeLanguageData('submittedBy', 'Submitted by') },
        { key: 'remark', label: customizeLanguageData('remark', 'Remark') }
    ]);

    /**
     * The factory's Edit path is unused here — there is no update endpoint, and
     * a window is withdrawn and re-submitted rather than revised. `update` is
     * still supplied because the CrudService contract requires it; it rejects
     * so a stray call fails loudly instead of silently doing nothing.
     */
    const resource = useCrudResource<Availability, AvailabilityForm, AvailabilityPayload>({
        entity: 'InvigilatorAvailability',
        labelKey: 'availability',
        labelFallback: 'Availability window',
        // No is_active, no state — a window either exists or it does not.
        hasState: false,
        service: {
            fetchList: (params) => fetchAvailabilities(params as AvailabilityListParams),
            create: submitAvailability,
            update: () => Promise.reject(new Error('An availability window is withdrawn and re-submitted, not edited')),
            remove: deleteAvailability
        },
        emptyForm,
        toForm: (availability) => ({
            instructor_id: availability.instructor_id,
            semester_id: availability.semester_id,
            available_date: availability.available_date,
            start_time: availability.start_time,
            end_time: availability.end_time,
            remark: availability.remark ?? ''
        }),
        schema: availabilitySchema,
        rowLabel: (availability) => availability.name,
        columns
    });

    /**
     * Withdraw only.
     *
     * The factory gates its Edit option on an `updateInvigilatorAvailability`
     * permission, and no such key exists in `PermissionList.php` — so the
     * option never renders. That is the intended enforcement: the missing
     * permission is what says "this resource has no update", not a filter here
     * that a renamed label could silently defeat.
     */
    const getActionOptions = (availability: Availability): ActionOption[] => resource.getActionOptions(availability);

    return {
        ...resource,
        availabilities: resource.items,
        fetchAvailabilities: resource.fetchItems,
        saveAvailabilityForm: resource.saveForm,
        getActionOptions
    };
}

export const useAvailability = createSharedComposable(availabilityManager);
