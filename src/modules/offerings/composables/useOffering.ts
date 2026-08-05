import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';
import router from '@/router';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useStatusFlow } from '@/composables/useStatusFlow';
import { useCrudResource } from '@/composables/useCrudResource';
import type { LookupValueRef } from '@/composables/useLookupValues';
import { offeringSchema } from '@/modules/offerings/schemas/offeringSchema';
import { OFFERING_LOOKUP_TYPE, OFFERING_STATUS } from '@/modules/offerings/constants/offeringStatus';
import type { Offering, OfferingForm } from '@/modules/offerings/types/offering';
import {
    fetchOfferings,
    createOffering,
    updateOffering,
    deleteOffering,
    submitOffering,
    changeOfferingStatus,
    type OfferingListParams,
    type OfferingPayload
} from '@/modules/offerings/services/offeringService';
import { readApiErrorMessage } from '@/utils/apiError';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import { STATUS_DANGER } from '@/config/appConfig';

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
    remark: ''
});

function offeringManager() {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    /** Statuses + legal edges, both straight from the backend lookup catalogue. */
    const statusFlow = useStatusFlow(OFFERING_LOOKUP_TYPE);

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const columns = computed(() => [
        { key: 'course', label: customizeLanguageData('course', 'Course') },
        { key: 'section', label: customizeLanguageData('section', 'Cohort') },
        { key: 'instructor', label: customizeLanguageData('instructor', 'Instructor') },
        { key: 'semester', label: customizeLanguageData('semester', 'Semester') },
        { key: 'expected_students', label: customizeLanguageData('expectedStudents', 'Students') },
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

    const resource = useCrudResource<Offering, OfferingForm, OfferingPayload>({
        entity: 'CourseOffering',
        labelKey: 'courseOffering',
        labelFallback: 'Course Offering',
        // A workflow table: no is_active / state, so no state toggle.
        hasState: false,
        service: {
            fetchList: (params) => fetchOfferings(params as OfferingListParams),
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
            expected_students: String(offering.expected_students),
            remark: offering.remark ?? ''
        }),
        schema: offeringSchema,
        columns,
        filters
    });

    /** Only a draft or a rejected offering is still the author's to change. */
    const isEditable = (offering: Offering) =>
        offering.status_code === OFFERING_STATUS.DRAFT || offering.status_code === OFFERING_STATUS.REJECTED;

    // ---- guarded status move -------------------------------------------------
    const statusModalVisible = ref(false);
    const statusModalAnchor = ref<DOMRect | null>(null);
    const statusTarget = ref<Offering | null>(null);

    const statusOptions = computed(() =>
        statusFlow.statuses.value.map((status: LookupValueRef) => ({
            value: status.code,
            label: status.name,
            icon: status.icon ?? undefined,
            color: status.color ?? undefined
        }))
    );

    const openStatusModal = (offering: Offering, anchor: DOMRect | null = null) => {
        statusTarget.value = offering;
        statusModalAnchor.value = anchor;
        statusModalVisible.value = true;
    };

    /** The modal emits the target CODE; the endpoint takes the lookup value id. */
    const applyStatusChange = async (targetCode: string | number) => {
        const offering = statusTarget.value;
        if (!offering) return;

        const target = statusFlow.resolve(String(targetCode));
        if (!target) {
            toast.error(customizeLanguageData('somethingWentWrong', 'Something went wrong'));
            return;
        }

        try {
            const changed = await changeOfferingStatus(offering.id, target.id);
            toast.success(changed.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            statusModalVisible.value = false;
        }
    };

    const submit = async (offering: Offering) => {
        try {
            const submitted = await submitOffering(offering.id);
            toast.success(submitted.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            await resource.fetchItems();
        } catch (error: unknown) {
            toast.error(genericError(error));
        }
    };

    /**
     * Submit / change-status on top of the factory's Edit and Delete, with the
     * two write actions hidden once the offering is inside the approval chain —
     * the backend refuses them there, so offering them would only mislead.
     */
    const getActionOptions = (offering: Offering): ActionOption[] => {
        const options: ActionOption[] = [
            {
                label: customizeLanguageData('viewTrail', 'View approval trail'),
                icon: EyeIcon,
                onClick: () => router.push(`/offerings/${offering.uuid}`)
            }
        ];

        if (allowedRoutesStore.can('submitCourseOffering') && offering.status_code === OFFERING_STATUS.DRAFT) {
            options.push({
                label: customizeLanguageData('submitForApproval', 'Submit for approval'),
                icon: SendPlaneIcon,
                onClick: () => submit(offering)
            });
        }

        if (allowedRoutesStore.can('approveCourseOffering') && statusFlow.hasOutgoing(offering.status_code)) {
            options.push({
                label: customizeLanguageData('changeStatus', 'Change status'),
                icon: RefreshIcon,
                onClick: () => openStatusModal(offering)
            });
        }

        if (isEditable(offering)) {
            options.push(...resource.getActionOptions(offering));
        } else if (allowedRoutesStore.can('updateCourseOffering')) {
            // Nothing editable, but keep the row menu meaningful.
            options.push({
                label: customizeLanguageData('lockedInApproval', 'Locked — in approval'),
                icon: RefreshIcon,
                variant: STATUS_DANGER,
                onClick: () =>
                    toast.error(
                        customizeLanguageData(
                            'offeringLockedHint',
                            'An offering inside the approval chain cannot be edited — reject it first.'
                        )
                    )
            });
        }

        return options;
    };

    return {
        ...resource,
        offerings: resource.items,
        fetchOfferings: resource.fetchItems,
        saveOfferingForm: resource.saveForm,
        getActionOptions,
        isEditable,

        statusFlow,
        statusOptions,
        statusModalVisible,
        statusModalAnchor,
        statusTarget,
        openStatusModal,
        applyStatusChange,
        submit
    };
}

export const useOffering = createSharedComposable(offeringManager);
