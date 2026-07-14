import type { IdAndName, Pagination } from '@/types/CommonTypes';

export interface PermissionGroup {
    id: number;
    name: string;
    code: string;
    level: number;
    permission_group_id: number | null;
    parent?: { id: number; name: string; level: number } | null;
    permissions?: Permission[];
    permissionGroups?: PermissionGroup[];
    permissions_count?: number;
    status?: number;
    created_at?: string;
}

export interface Permission {
    id: number;
    name: string;
    key: string;
    module_id: number | null;
    permission_group_id: number | null;
    unique_per_user: boolean;
    is_system?: boolean;
    state: number;
    granted?: boolean;
    permissionGroup?: { id: number; name: string } | null;
    created_at?: string;
}

export interface PermissionGroupForm {
    name: string;
    code?: string;
    permission_group_id: number | null;
    is_group: boolean;
    status: number;
}

export interface PermissionForm {
    name: string;
    key: string;
    module_id: number | null;
    permission_group_id: number | null;
    unique_per_user: boolean;
    state: number;
}

export interface PaginatedPermissions {
    data: Permission[];
    pagination: Pagination | null;
}

export interface PaginatedPermissionGroups {
    data: PermissionGroup[];
    pagination: Pagination | null;
}
