// Shared types for the dynamic Custom Field engine.
// Field definitions and values are model-agnostic so any module can render them.

export interface CustomFieldOptionItem {
    key: string;
    label: string | Record<string, string>;
    color?: string | null;
    is_default?: boolean;
}

export interface CustomFieldValidationRule {
    min?: number;
    max?: number;
    between?: [number, number];
    regex?: string;
    regx?: string;
    unique?: boolean;
}

export interface CustomFieldDefinition {
    id: number;
    uuid: string;
    name_key: string;
    label: string;
    display_label?: string;
    data_type: string;
    ui_component?: string | null;
    default_value?: string | null;
    option_source_type?: string | null;
    option_source_config?: Record<string, unknown> | null;
    validation_rule?: CustomFieldValidationRule | null;
    format?: { template?: string } | null;
    order?: number;
    is_required?: boolean;
    has_values?: boolean;
    values_count?: number;
    language_supported?: boolean;
    options?: { key: string; label: string }[];
    state?: number;
}

export type CustomFieldValuesMap = Record<string, unknown>;

export const CUSTOM_FIELD_DATA_TYPE = {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    DATE: 'date',
    SELECT: 'select',
    MULTISELECT: 'multiselect',
    JSON: 'json',
    FILE: 'file'
} as const;

export const CUSTOM_FIELD_UI_COMPONENT = {
    INPUT: 'input',
    TEXTAREA: 'textarea',
    SELECT: 'select',
    MULTISELECT: 'multiselect',
    TOGGLE: 'toggle',
    CHECKBOX: 'checkbox',
    RADIO: 'radio',
    DATE: 'date',
    FILE: 'file'
} as const;

export const OPTION_SOURCE_TYPE = {
    STATIC: 'static',
    MODEL: 'model',
    API: 'api'
} as const;

export interface CustomFieldFileValue {
    path: string;
    url?: string | null;
    name?: string | null;
}
