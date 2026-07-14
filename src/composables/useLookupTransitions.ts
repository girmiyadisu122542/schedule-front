import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';

/** One allowed status transition: from one lookup-value code to another. */
export interface LookupTransitionRef {
    id: number;
    from_code: string;
    to_code: string;
}

/**
 * Shared lookup-transition catalogue. Fetches the allowed status transitions of ONE
 * backend lookup TYPE (by its type code) from `GET /lookup/transitions-for-type`, and
 * caches them app-wide (the dropdown singleton is keyed by endpoint + params). Drives
 * the ChangeStatusModal state machine -- only the statuses reachable from the current
 * one stay selectable.
 *
 * @param typeCode the backend lookup type code (e.g. 'ORDER_STATUS')
 */
export function useLookupTransitions(typeCode: string) {
    const dropdown = useDropdownOptions<LookupTransitionRef>(
        '/lookup/transitions-for-type',
        { [DROPDOWN_PARAM_KEY]: true, type_code: typeCode },
        300,
        Boolean(typeCode)
    );

    /** Codes reachable from `fromCode` in one transition (empty when none / unknown). */
    function allowedFrom(fromCode: string | number | null | undefined): string[] {
        if (fromCode === null || fromCode === undefined || fromCode === '') return [];
        return dropdown.options.value
            .filter((transition: LookupTransitionRef) => String(transition.from_code) === String(fromCode))
            .map((transition: LookupTransitionRef) => transition.to_code);
    }

    return {
        transitions: dropdown.options,
        loading: dropdown.loading,
        error: dropdown.error,
        refetch: dropdown.fetchOptions,
        allowedFrom
    };
}
