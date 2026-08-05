/**
 * Narrow readers for the backend's error envelope, shared by every module
 * composable so the `catch` blocks stay free of `any`.
 *
 * The backend answers with either
 *   `{ errors: { field: ["message"] } }`  — Form Request / Validator failures
 * or
 *   `{ message: "translated text" }`      — business-rule 422s, 403s, 404s, 500s.
 */

/** Shape of a Laravel validation-error bag. */
export type ApiFieldErrors = Record<string, string[] | string>;

interface ApiErrorEnvelope {
    response?: {
        data?: {
            errors?: ApiFieldErrors;
            message?: string;
        };
    };
}

/**
 * Field-level validation errors, or null when the failure was not a
 * field-level one (so the caller can fall back to a toast).
 */
export function extractFieldErrors(error: unknown): ApiFieldErrors | null {
    return (error as ApiErrorEnvelope)?.response?.data?.errors ?? null;
}

/**
 * The backend's already-translated message. Never swallow this — scheduling
 * 422s (EXCLUDE-constraint clashes, illegal status moves) arrive here.
 *
 * @param fallback localized text to show when the response carried no message
 */
export function readApiErrorMessage(error: unknown, fallback: string): string {
    return (error as ApiErrorEnvelope)?.response?.data?.message || fallback;
}

/** Flatten a validation bag into the `Record<string, string>` forms expect. */
export function toFormErrors(errors: ApiFieldErrors): Record<string, string> {
    return Object.entries(errors).reduce<Record<string, string>>((accumulator, [field, messages]) => {
        accumulator[field] = Array.isArray(messages) ? (messages[0] ?? '') : String(messages);
        return accumulator;
    }, {});
}

/**
 * A mutation response: the written row plus the backend's already-translated
 * confirmation message. Surfacing that message beats a generic client-side
 * string — it names the record and is localized by the same source of truth.
 */
export interface MutationResult<TItem> {
    data: TItem;
    message?: string;
}
