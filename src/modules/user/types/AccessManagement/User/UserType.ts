import type { Pagination, Status } from '@/types/CommonTypes';

export interface Role {
    id: number;
    name: string;
    scope: number;
    scope_name: string;
    descendants: Role[];
    scope_id: number | null;
    has_descendants: boolean;
    model_name?: string | null;
    include_descendants?: boolean;
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    scope?: number;
}

export interface User {
    id?: number;
    name?: string;
    email: string;
    phone: string;
    state?: number | null;
    roles?: Role[];
    gender?: number;
    full_name?: string;
    username?: string;
    created_at?: string;
    last_name?: string;
    updated_at?: string;
    first_name?: string;
    display_name?: string;
    middle_name?: string;
    photo?: any;
    user_id?: number | null;
    national_id?: string | null;
    email_verified_at?: string | null;
    status?: Status;
    detail?: UserDetail;
    is_logged_in?: boolean;
    has_permission_override?: boolean;
    permission_overrides_count?: number;
}

export interface UserResponse {
    data: User[];
    pagination: Pagination;
}

export interface UserDetail {
    id?: number;
    user_id: number;
    birth_date?: string | null;
    national_id?: string;
    phone?: string;
    bio?: string;
    email: string | null;
    gender: number;
    gender_: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    photo: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface UserRoleBinding {
    id?: number;
    user_id: number;
    role_id: number;
    include_descendants: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface UserPermissionOverride {
    id?: number;
    user_id: number;
    permission_id: number;
    override_type: 'allow' | 'deny';
    scope?: number;
    scope_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface AssignPayload {
    starts_at: string | null;
    ends_at: string | null;
}

export interface permissionOverridePayload extends AssignPayload {
    permission_ids: number[];
    allow: boolean;
}
