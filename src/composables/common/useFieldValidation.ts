import { reactive } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { CUSTOM_FIELD_DATA_TYPE, type CustomFieldDefinition, type CustomFieldValuesMap } from '@/types/customField';

/**
 * Client-side mirror of the backend validation rules (required / min / max /
 * between / regex). Drives the live form preview; the backend remains the
 * source of truth on save.
 */
export function useFieldValidation() {
    const languageStore = useLanguageStore();
    const errors = reactive<Record<string, string>>({});

    function translate(key: string, fallback: string): string {
        return languageStore.translations?.[key] || fallback;
    }

    function numericLength(value: unknown): number {
        if (typeof value === 'number') return value;
        if (Array.isArray(value)) return value.length;
        return value === null || value === undefined ? 0 : String(value).length;
    }

    /** Validate one field, returning an error message or null. */
    function validateField(field: CustomFieldDefinition, value: unknown): string | null {
        const isEmpty =
            value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

        if (field.is_required && isEmpty) {
            return translate('requiredField', 'This field is required');
        }

        if (isEmpty) return null;

        const rule = field.validation_rule ?? {};
        const isNumber = field.data_type === CUSTOM_FIELD_DATA_TYPE.NUMBER;
        const measure = isNumber ? Number(value) : numericLength(value);

        if (rule.min !== undefined && measure < Number(rule.min)) {
            return translate('minValidationFailed', `Minimum is ${rule.min}`);
        }

        if (rule.max !== undefined && measure > Number(rule.max)) {
            return translate('maxValidationFailed', `Maximum is ${rule.max}`);
        }

        if (Array.isArray(rule.between) && rule.between.length === 2) {
            const [low, high] = rule.between;
            if (measure < Number(low) || measure > Number(high)) {
                return translate('betweenValidationFailed', `Value must be between ${low} and ${high}`);
            }
        }

        const pattern = rule.regex || rule.regx;
        if (pattern) {
            try {
                if (!new RegExp(pattern).test(String(value))) {
                    return translate('patternValidationFailed', 'Invalid format');
                }
            } catch {
                // Ignore malformed patterns on the client; the server re-validates.
            }
        }

        return null;
    }

    /** Validate every definition against the values map; populate `errors`. */
    function validateAll(definitions: CustomFieldDefinition[], values: CustomFieldValuesMap): boolean {
        let valid = true;
        definitions.forEach((field) => {
            const message = validateField(field, values[field.name_key]);
            if (message) {
                errors[field.name_key] = message;
                valid = false;
            } else {
                delete errors[field.name_key];
            }
        });
        return valid;
    }

    return { errors, validateField, validateAll };
}
