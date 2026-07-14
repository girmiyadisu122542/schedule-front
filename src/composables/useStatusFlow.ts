import { computed } from 'vue';

import { useLookupValues, type LookupValueRef } from '@/composables/useLookupValues';
import { useLookupTransitions, type LookupTransitionRef } from '@/composables/useLookupTransitions';

export type { LookupTransitionRef };

/**
 * Backend-driven status flow for ONE lookup type: the ordered status catalogue
 * (id / code / localized name / color / icon / order via `GET /lookup/values`)
 * PLUS the allowed transition edges (via [[useLookupTransitions]], which backs
 * the ChangeStatusModal state machine). Both feeds are app-wide singletons per
 * type code, so every screen asking for the same type reuses one fetch each.
 *
 * This replaces hand-maintained FE *_STATUS_FLOW maps and hardcoded status step
 * lists -- values, order, labels, colors and legal transitions all come from
 * the backend lookup catalogue:
 *
 *   const flow = useStatusFlow(SALES_LOOKUP_TYPE.ORDER_STATUS);
 *   flow.statuses.value;                    // ordered LookupValueRef[]
 *   flow.allowedTargets(order.status.code); // statuses legally reachable now
 *   flow.hasOutgoing(code);                 // false => terminal status
 *
 * @param typeCode the backend lookup type code (e.g. 'ORDER_STATUS')
 */
export function useStatusFlow(typeCode: string) {
    const lookup = useLookupValues(typeCode);
    const transitionsApi = useLookupTransitions(typeCode);

    const statuses = lookup.options;
    const loading = computed(() => lookup.loading.value || transitionsApi.loading.value);

    /** Statuses legally reachable from `fromCode` (empty until the feeds load). */
    function allowedTargets(fromCode: string | null | undefined): LookupValueRef[] {
        if (!fromCode) return [];
        const codes = transitionsApi.allowedFrom(fromCode);
        return statuses.value.filter((status: LookupValueRef) => codes.includes(status.code));
    }

    /** True when the code has at least one outgoing transition (false = terminal). */
    function hasOutgoing(code: string | null | undefined): boolean {
        if (!code) return false;
        const codes = transitionsApi.allowedFrom(code);
        return codes.length > 0;
    }

    return {
        loading,
        statuses,
        transitions: transitionsApi.transitions,
        resolve: lookup.resolve,
        allowedTargets,
        hasOutgoing
    };
}
