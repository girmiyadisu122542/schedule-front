import type { Pagination } from '@/types/CommonTypes';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { CUSTOM_FIELD_DATA_TYPE, CUSTOM_FIELD_UI_COMPONENT, OPTION_SOURCE_TYPE } from '@/types/customField';

const languageStore = useLanguageStore();
const { translations } = storeToRefs(languageStore);

export const DATA_TYPES = [
    { label: translations.value.string, value: 'String' },
    { label: translations.value.number, value: 'Number' },
    { label: translations.value.boolean, value: 'Boolean' },
    { label: translations.value.date, value: 'Date' }
];

export const FIELD_TYPES = [
    { label: translations.value.textInput, value: 'Input' },
    { label: translations.value.textArea, value: 'Textarea' },
    { label: translations.value.select, value: 'Select' },
    { label: translations.value.checkbox, value: 'Checkbox' },
    { label: translations.value.file || 'File', value: 'File' }
];
export const AVAILABLE_RULES = [
    {
        label: translations.value.min || 'Min',
        description: translations.value.minLengthOrValue || 'Minimum length (text) or value (number)',
        value: 'min'
    },
    {
        label: translations.value.max || 'Max',
        description: translations.value.maxLengthOrValue || 'Maximum length (text) or value (number)',
        value: 'max'
    },
    {
        label: translations.value.between || 'Between',
        description: translations.value.valueBetween || 'Value/length within min and max (inclusive)',
        value: 'between'
    },
    {
        label: translations.value.unique || 'Unique',
        description: translations.value.uniqueDescription || 'Value must be unique across records',
        value: 'unique'
    },
    {
        label: translations.value.pattern || 'Pattern',
        description: translations.value.patternDescription || 'Must match a regular expression',
        value: 'regx'
    }
];

// ---- Builder UI value <-> backend wire mapping ----------------------------
// The accordion editor speaks PascalCase ("String", "Input"); the /custom-field
// API speaks the lowercase enums in CUSTOM_FIELD_DATA_TYPES / _UI_COMPONENTS.

export const DATA_TYPE_TO_BACKEND: Record<string, string> = {
    String: CUSTOM_FIELD_DATA_TYPE.STRING,
    Number: CUSTOM_FIELD_DATA_TYPE.NUMBER,
    Boolean: CUSTOM_FIELD_DATA_TYPE.BOOLEAN,
    Date: CUSTOM_FIELD_DATA_TYPE.DATE
};

export const DATA_TYPE_FROM_BACKEND: Record<string, string> = {
    [CUSTOM_FIELD_DATA_TYPE.STRING]: 'String',
    [CUSTOM_FIELD_DATA_TYPE.NUMBER]: 'Number',
    [CUSTOM_FIELD_DATA_TYPE.BOOLEAN]: 'Boolean',
    [CUSTOM_FIELD_DATA_TYPE.DATE]: 'Date',
    [CUSTOM_FIELD_DATA_TYPE.SELECT]: 'String',
    [CUSTOM_FIELD_DATA_TYPE.MULTISELECT]: 'String',
    [CUSTOM_FIELD_DATA_TYPE.JSON]: 'String',
    [CUSTOM_FIELD_DATA_TYPE.FILE]: 'String'
};

export const FIELD_TYPE_TO_UI: Record<string, string> = {
    Input: CUSTOM_FIELD_UI_COMPONENT.INPUT,
    Textarea: CUSTOM_FIELD_UI_COMPONENT.TEXTAREA,
    Select: CUSTOM_FIELD_UI_COMPONENT.SELECT,
    Checkbox: CUSTOM_FIELD_UI_COMPONENT.CHECKBOX,
    File: CUSTOM_FIELD_UI_COMPONENT.FILE
};

export const FIELD_TYPE_FROM_UI: Record<string, string> = {
    [CUSTOM_FIELD_UI_COMPONENT.INPUT]: 'Input',
    [CUSTOM_FIELD_UI_COMPONENT.TEXTAREA]: 'Textarea',
    [CUSTOM_FIELD_UI_COMPONENT.SELECT]: 'Select',
    [CUSTOM_FIELD_UI_COMPONENT.MULTISELECT]: 'Select',
    [CUSTOM_FIELD_UI_COMPONENT.CHECKBOX]: 'Checkbox',
    [CUSTOM_FIELD_UI_COMPONENT.TOGGLE]: 'Checkbox',
    [CUSTOM_FIELD_UI_COMPONENT.RADIO]: 'Select',
    [CUSTOM_FIELD_UI_COMPONENT.DATE]: 'Input',
    [CUSTOM_FIELD_UI_COMPONENT.FILE]: 'File'
};

export const OPTION_SOURCE_DEFAULT = OPTION_SOURCE_TYPE.STATIC;

export interface OptionRow {
    id: number;
    label: string;
    key: string;
    value: string;
    order: number;
    is_active: boolean;
}
export interface ValidationRule {
    type: string;
    value: any;
    max?: any;
    description?: string;
}

/** Free-form source config for the model / api option tabs. */
export interface ModelOptionSource {
    model: string;
    labelField: string;
    valueField: string;
}
export interface ApiOptionSource {
    url: string;
    labelField: string;
    valueField: string;
    method: string;
    headers: string;
}

export interface CustomField {
    id: string | number;
    uuid?: string;
    label: string;
    name?: string;
    key: string;
    dataType: string;
    fieldType: string;
    defaultValue: string;
    isRequired: boolean;
    isMultilanguage: boolean;
    multiSelect: boolean;
    isExpanded: boolean;
    isSaving: boolean;
    sections: {
        basic: boolean;
        validation: boolean;
        format: boolean;
        option: boolean;
    };
    validationRules: ValidationRule[];
    formatTemplate: string;
    optionSourceType: string;
    options: OptionRow[];
    modelSource: ModelOptionSource;
    apiSource: ApiOptionSource;
    state?: number;
    /** True once the field has stored values -- locks destructive edits. */
    hasValues?: boolean;
}

/** A registered custom-field-capable group (GET /custom-field/groups). */
export interface CustomFieldGroupOption {
    id: number;
    uuid?: string;
    code: string;
    model: string;
    model_class?: string | null;
    target_model?: string | null;
    target_model_class?: string | null;
    record_id?: number | null;
    record_label?: string | null;
    is_system?: boolean;
    state?: number;
    state_data?: { id?: number; name?: string } | null;
    status_lookup_value?: { id: number; name?: string } | null;
    custom_fields_count?: number;
}

/** A registered Eloquent model from the backend registry (GET /models). */
export interface RegistryModelOption {
    key: string;
    name: string;
}

/** A `@field` token offered in the Format & Display template menu. */
export interface FormatToken {
    label: string;
    token: string;
}

export interface AddedValues {
    id: string;
    name: string;
    order: number;
    color: string;
    isExpanded: boolean;
    is_default: boolean;
    lookup_type_id: string;
    icon: File | null;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination | null;
}
