export interface ApiResponse<T> {
    data: T[];
    pagination: Pagination | null;
}
export interface PaginationLink {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
}

export interface Pagination {
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface JsonbFieldGroup {
    key: any;
    value: any;
    key_display?: string;
    _unremovable?: boolean;
}
export interface AddressFieldsType {
    id: number;
    name: string;
    isRequired: boolean;
}
export interface TreeNode {
    id: string | number;
    key?: string;
    data?: Record<string, any>;
    children?: TreeNode[];
    leaf?: boolean;
    [key: string]: any;
}

export interface TreeTableExpandedKeys {
    [key: string]: boolean;
}

export interface TypeLookUpValue {
    id: number;
    name: string;
    code: string;
}
export interface TreeTableSelectionKeys {
    [key: string]: boolean;
}

export interface IdAndName {
    id: number;
    name: string;
    display_name: string;
}

export interface IdAndNameAndLabel {
    id: number;
    name: string;
    display_name: string;
    admin_level_label: string;
}

export interface IdAndNameAndCode {
    id: number;
    name: string;
    display_name: string;
    code: string;
    type_lookup_value: TypeLookUpValue;
}

export interface IdAndNameWithDisplayName {
    id: number;
    name: string;
    display_name: string;
}

export interface DropdownOption {
    id: number;
    name: string;
    [key: string]: any;
}

export interface FetchParams {
    id?: number;
    uuid?: string;
    page?: number;
    perPage?: number;
    search?: string;
}
export interface Status {
    id: number;
    name: string;
    color: string;
    icon?: string | null;
    code?: string | null;
    extension?: string | null;
    description?: string | null;
}

export interface ConfirmState {
    show: boolean;
    loading: boolean;

    title: string;
    message: string;
    itemName?: string;
    itemNames?: string[];
    itemLabel?: string;
    fromCssClass?: string;
    toCssClass?: string;
    confirmLabel: string;
    cancelLabel?: string;
    statusTransition?: { from: string; to: string };

    type: 'danger' | 'info' | 'success' | 'warning' | 'activate' | 'deactivate' | 'primary';
    onConfirm: () => Promise<void> | void;
}

export interface posType {
    id: number;
    name: string;
}

export interface User {
    id: number;
    email: string;
    full_name?: string;
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    name?: string;
}
