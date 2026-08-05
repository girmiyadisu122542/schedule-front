import { ref, reactive, computed } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { useLookupValues, type LookupValueRef } from '@/composables/useLookupValues';
import { APPROVAL_DECISION, APPROVAL_LOOKUP_TYPE } from '@/modules/offerings/constants/offeringStatus';
import type { Offering, OfferingApproval } from '@/modules/offerings/types/offering';
import { getOfferingDetail, recordApproval } from '@/modules/offerings/services/offeringService';
import { extractFieldErrors, readApiErrorMessage, toFormErrors } from '@/utils/apiError';
import { MAX_DESCRIPTION_LENGTH } from '@/config/appConfig';

/** What the approve / reject / request-revision form holds. */
interface DecisionForm {
    level_lookup_value_id: number | null;
    decision_lookup_value_id: number | null;
    remark: string;
}

/**
 * One offering's detail page: the record, its append-only approval trail, and
 * the action that appends to it.
 *
 * NOT a shared composable — each visit loads one offering, and leaving the page
 * should not leave a stale record behind for the next one.
 */
export function useOfferingDetail() {
    const { customizeLanguageData } = useLanguageStore();

    const levels = useLookupValues(APPROVAL_LOOKUP_TYPE.LEVEL);
    const decisions = useLookupValues(APPROVAL_LOOKUP_TYPE.DECISION);

    const isLoading = ref(false);
    const isSaving = ref(false);
    const offering = ref<Offering | null>(null);
    const approvals = ref<OfferingApproval[]>([]);
    const errors = ref<Record<string, string>>({});

    const form = reactive<DecisionForm>({
        level_lookup_value_id: null,
        decision_lookup_value_id: null,
        remark: ''
    });

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    /**
     * A rejection or a revision request must carry a remark — mirrored from the
     * backend Form Request so the field appears and validates before the round
     * trip. The backend still enforces it.
     */
    const decisionCode = computed(
        () => decisions.options.value.find((value: LookupValueRef) => value.id === form.decision_lookup_value_id)?.code
    );

    const remarkIsRequired = computed(
        () =>
            decisionCode.value === APPROVAL_DECISION.REJECTED ||
            decisionCode.value === APPROVAL_DECISION.REVISION_REQUESTED
    );

    const load = async (key: string) => {
        isLoading.value = true;
        try {
            const detail = await getOfferingDetail(key);
            offering.value = detail.offering;
            approvals.value = detail.approvals;
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isLoading.value = false;
        }

        // These live outside a component's own setup only when the caller is a
        // shared composable; here the view calls load() from onMounted, so an
        // explicit fetch keeps both catalogues populated either way.
        levels.refetch();
        decisions.refetch();
    };

    /** Preselect a decision so the tier buttons act as one-click shortcuts. */
    const chooseDecision = (code: string) => {
        const decision = decisions.options.value.find((value: LookupValueRef) => value.code === code);
        form.decision_lookup_value_id = decision?.id ?? null;
        errors.value = {};
    };

    const submitDecision = async () => {
        errors.value = {};

        if (!offering.value) return;

        if (!form.level_lookup_value_id) {
            errors.value.level_lookup_value_id = customizeLanguageData(
                'levelIsRequired',
                'Please choose which tier is acting'
            );
        }

        if (!form.decision_lookup_value_id) {
            errors.value.decision_lookup_value_id = customizeLanguageData(
                'decisionIsRequired',
                'Please choose a decision'
            );
        }

        if (remarkIsRequired.value && !form.remark.trim()) {
            errors.value.remark = customizeLanguageData(
                'remarkRequiredOnRejection',
                'A rejection or revision request must say why'
            );
        }

        if (form.remark.length > MAX_DESCRIPTION_LENGTH) {
            errors.value.remark = customizeLanguageData('remarkIsTooLong', 'The remark is too long');
        }

        if (Object.keys(errors.value).length) return;

        isSaving.value = true;
        try {
            const result = await recordApproval(offering.value.id, {
                level_lookup_value_id: form.level_lookup_value_id as number,
                decision_lookup_value_id: form.decision_lookup_value_id as number,
                remark: form.remark.trim() || null
            });

            toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            form.remark = '';
            form.decision_lookup_value_id = null;

            await load(String(offering.value.uuid));
        } catch (error: unknown) {
            const fieldErrors = extractFieldErrors(error);
            if (fieldErrors) {
                errors.value = { ...errors.value, ...toFormErrors(fieldErrors) };
            } else {
                // An illegal edge comes back as a translated
                // `invalid_status_transition` — never swallow it.
                toast.error(genericError(error));
            }
        } finally {
            isSaving.value = false;
        }
    };

    return {
        isLoading,
        isSaving,
        offering,
        approvals,
        form,
        errors,
        levels,
        decisions,
        decisionCode,
        remarkIsRequired,

        load,
        chooseDecision,
        submitDecision
    };
}
