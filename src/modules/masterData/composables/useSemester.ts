import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useStatusFlow } from '@/composables/useStatusFlow';
import type { LookupValueRef } from '@/composables/useLookupValues';
import { semesterSchema } from '@/modules/masterData/schemas/semesterSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';
import type { Semester, SemesterForm } from '@/modules/masterData/types/semester';
import {
    fetchSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
    changeSemesterStatus,
    type SemesterListParams,
    type SemesterPayload
} from '@/modules/masterData/services/semesterService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';

import RefreshIcon from '@/assets/icons/RefreshIcon.vue';

const emptyForm = (): SemesterForm => ({
    academic_year_id: null,
    term: null,
    name: '',
    start_date: '',
    end_date: '',
    is_current: false
});

function semesterManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** Statuses + legal edges, both straight from the backend lookup catalogue. */
    const statusFlow = useStatusFlow(LOOKUP_TYPE.SEMESTER_STATUS);

    const columns = computed(() => [
        { key: 'name', label: customizeLanguageData('semester', 'Semester') },
        { key: 'academic_year', label: customizeLanguageData('academicYear', 'Academic Year') },
        { key: 'term', label: customizeLanguageData('term', 'Term') },
        { key: 'start_date', label: customizeLanguageData('startDate', 'Start Date') },
        { key: 'end_date', label: customizeLanguageData('endDate', 'End Date') },
        { key: 'is_current', label: customizeLanguageData('current', 'Current') },
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

    const resource = useCrudResource<Semester, SemesterForm, SemesterPayload>({
        entity: 'Semester',
        labelKey: 'semester',
        labelFallback: 'Semester',
        // No `is_active`/`state` column — the lifecycle is the guarded status move.
        hasState: false,
        service: {
            fetchList: (params) => fetchSemesters(params as SemesterListParams),
            create: createSemester,
            update: updateSemester,
            remove: deleteSemester
        },
        emptyForm,
        toForm: (semester) => ({
            academic_year_id: semester.academic_year_id,
            term: semester.term,
            name: semester.name,
            start_date: semester.start_date,
            end_date: semester.end_date,
            is_current: semester.is_current
        }),
        detailPath: (semester) => `/semesters/${semester.uuid}`,
        schema: semesterSchema,
        columns,
        filters
    });

    // ---- guarded status move -------------------------------------------------
    const statusModalVisible = ref(false);
    const statusModalAnchor = ref<DOMRect | null>(null);
    const statusTarget = ref<Semester | null>(null);

    /**
     * The popover lists the whole catalogue and greys out what the transition
     * machine forbids, so pass every status — `ChangeStatusModal` gates them
     * against `current` + `typeCode` itself.
     */
    const statusOptions = computed(() =>
        statusFlow.statuses.value.map((status: LookupValueRef) => ({
            value: status.code,
            label: status.name,
            icon: status.icon ?? undefined,
            color: status.color ?? undefined
        }))
    );

    const openStatusModal = (semester: Semester, anchor: DOMRect | null = null) => {
        statusTarget.value = semester;
        statusModalAnchor.value = anchor;
        statusModalVisible.value = true;
    };

    /**
     * The modal emits the target status CODE; the endpoint takes the lookup
     * value id, so resolve it through the same catalogue.
     */
    const applyStatusChange = async (targetCode: string | number) => {
        const semester = statusTarget.value;
        if (!semester) return;

        const target = statusFlow.resolve(String(targetCode));
        if (!target) {
            toast.error(customizeLanguageData('somethingWentWrong', 'Something went wrong'));
            return;
        }

        try {
            const changed = await changeSemesterStatus(semester.id, target.id);
            toast.success(changed.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();
        } catch (error: unknown) {
            // A rejected edge comes back as a translated `invalid_status_transition`.
            toast.error(
                readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'))
            );
        } finally {
            statusModalVisible.value = false;
        }
    };

    /**
     * The factory's Edit/Delete actions plus the guarded status move. It is
     * offered only when the current status still has an outgoing edge — a
     * `closed` semester is terminal, so the option disappears rather than
     * opening a popover with nothing selectable.
     */
    const getActionOptions = (semester: Semester): ActionOption[] => {
        const options = resource.getActionOptions(semester);

        if (allowedRoutesStore.can('changeSemesterStatus') && statusFlow.hasOutgoing(semester.status_code)) {
            options.unshift({
                label: customizeLanguageData('changeStatus', 'Change status'),
                icon: RefreshIcon,
                onClick: () => openStatusModal(semester)
            });
        }

        return options;
    };

    return {
        ...resource,
        semesters: resource.items,
        fetchSemesters: resource.fetchItems,
        saveSemesterForm: resource.saveForm,
        getActionOptions,

        statusFlow,
        statusOptions,
        statusModalVisible,
        statusModalAnchor,
        statusTarget,
        openStatusModal,
        applyStatusChange
    };
}

export const useSemester = createSharedComposable(semesterManager);
