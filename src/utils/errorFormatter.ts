import { ZodType, ZodError } from 'zod';

export type ZodFormattedError = {
    path: (string | number)[];
    message: string;
    code: string;
    [key: string]: any;
};

// Backend error structure (from API)
export type BackendError = Record<string, string[] | string>;

// Allow values to be string | array | object to support array-field errors like phone[0].key
export type NormalizedErrors<T extends string = string> = Partial<Record<T, any>>;

// helper to deeply assign a message by path
function setNestedPath(target: any, path: string[], message: string) {
    let current = target;
    for (let i = 0; i < path.length; i++) {
        const key = typeof path[i] === 'string' && /^\d+$/.test(String(path[i])) ? Number(path[i]) : path[i];
        if (key === undefined) continue;
        if (i === path.length - 1) current[key] = message;
        else {
            current[key] = current[key] || {};
            current = current[key];
        }
    }
}

export function normalizeErrors<T extends string>(error: unknown): NormalizedErrors<T> {
    const formatted: NormalizedErrors<T> = {};

    const handleIssues = (issues: any[]) => {
        for (const issue of issues) {
            const path = Array.isArray(issue.path) ? issue.path.map(String) : [];

            const message = issue.message as string;
            if (!message) continue;

            // handle top-level (e.g. ["name"])
            if (path.length === 1) {
                const key = path[0] as T;
                if (formatted[key] === undefined) formatted[key] = message;
                continue;
            }

            // handle nested (e.g. ["steps", "0", "name"])
            const [top, second, ...rest] = path;
            if (!isNaN(+second)) {
                const index = +second;
                if (!Array.isArray(formatted[top as T])) formatted[top as T] = [];
                const arr = formatted[top as T] as any[];
                arr[index] = arr[index] || {};
                rest.length ? setNestedPath(arr[index], rest, message) : (arr[index] = message);
            } else {
                // For nested objects, create nested structure
                setNestedPath(formatted, path, message);
            }
        }
    };

    // ZodError or Zod-like error
    if (error instanceof ZodError || (error && typeof error === 'object' && 'issues' in (error as any))) {
        handleIssues((error as any).issues || []);
        return formatted;
    }

    // Backend error normalization
    if (error && typeof error === 'object') {
        for (const key of Object.keys(error as Record<string, any>)) {
            const val = (error as any)[key];
            const message = Array.isArray(val) ? val[0] : String(val || '');
            if (!message) continue;

            const parts = key.split('.');
            if (parts.length > 1 && parts[1] !== undefined && /^\d+$/.test(parts[1])) {
                const [top, idx, ...rest] = parts;
                if (!Array.isArray(formatted[top as T])) formatted[top as T] = [];
                const arr = formatted[top as T] as any[];
                if (idx !== undefined) {
                    arr[+idx] = arr[+idx] || {};
                    rest.length ? setNestedPath(arr[+idx], rest, message) : (arr[+idx] = message);
                }
            } else {
                formatted[key as T] = message;
            }
        }
    }

    return formatted;
}

/**
 * Validate form data with Zod schema and return normalized errors
 */
export function validateFormWithZod<T extends string>(schema: ZodType<any>, form: unknown): NormalizedErrors<T> | null {
    const result = schema.safeParse(form);
    return result.success ? null : normalizeErrors<T>(result.error);
}

/**
 * Extract the FIRST human-readable message from a caught request error.
 * Prefers the first field error in a Laravel 422 `errors` bag, then the
 * top-level `message`, then the JS error message. Returns undefined when
 * nothing usable is found so callers can fall back to a generic string.
 */
export function firstServerError(error: any): string | undefined {
    const bag = error?.response?.data?.errors;
    if (bag && typeof bag === 'object') {
        const first = Object.values(bag)[0];
        if (Array.isArray(first)) return first[0] as string;
        if (typeof first === 'string') return first;
    }
    const serverMessage = error?.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
        return serverMessage;
    }
    // For an HTTP error response that carries no body message, do NOT surface
    // axios's raw "Request failed with status code N" -- return undefined so the
    // caller shows its own clear, localized fallback. Keep the JS message only for
    // non-HTTP failures (network / timeout), where it is meaningful.
    return error?.response ? undefined : error?.message || undefined;
}
