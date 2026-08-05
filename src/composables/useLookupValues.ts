import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';

/**
 * A resolved lookup value (status / type / reason / ...) as the backend lookup
 * resource emits it (`idAndNameFields`): id, code, localized name, plus optional
 * presentation hints (color / icon) and the catalogue sequence (order).
 */
export interface LookupValueRef {
    id: number;
    code: string;
    name: string;
    color?: string | null;
    icon?: string | null;
    order?: number | null;
}

/**
 * Shared, module-agnostic lookup catalogue composable. Fetches the active values
 * of ONE backend lookup TYPE (by its type code) from `GET /lookup/values`, and
 * caches them app-wide -- `useDropdownOptions` is a singleton keyed by endpoint +
 * params, so requesting the same type code anywhere reuses one fetch.
 *
 * Use this from any module instead of re-defining a per-module lookup composable:
 *
 *   const orderStatus = useLookupValues(SALES_LOOKUP_TYPE.ORDER_STATUS);
 *   orderStatus.options.value;            // LookupValueRef[] (reactive; fills after fetch)
 *   orderStatus.resolve(record.status);   // LookupValueRef | null (by code)
 *
 * The returned items are shaped exactly like a status/type chip needs
 * ({ id, code, name, color, icon }), so they can feed StatusPill, filters and
 * selects directly. Reads must stay reactive (computed / template) because the
 * fetch is async.
 *
 * @param typeCode the backend lookup type code (e.g. 'ORDER_STATUS')
 */
export function useLookupValues(typeCode: string) {
    const dropdown = useDropdownOptions<LookupValueRef>(
        '/lookup/values',
        { [DROPDOWN_PARAM_KEY]: true, type_code: typeCode },
        300,
        Boolean(typeCode)
    );

    /** Resolve a single value of this type by its code, or null when absent. */
    function resolve(code: string | null | undefined): LookupValueRef | null {
        if (!code) return null;
        return dropdown.options.value.find((item: LookupValueRef) => item.code === code) ?? null;
    }

    return {
        options: dropdown.options,
        loading: dropdown.loading,
        error: dropdown.error,
        refetch: dropdown.fetchOptions,
        resolve
    };
}
