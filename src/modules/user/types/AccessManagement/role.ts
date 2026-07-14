import type { IdAndName, Pagination } from '@/types/CommonTypes';

export interface Role {
    id: number;
    name: string;
    description?: string | null;
    state: number;
    is_system: boolean;
    unique_per_user: boolean;
    permissions_count: number;
    created_at?: string;
    permissions: IdAndName[];
    [key: string]: any;
}

export interface RoleForm {
    name: string;
    is_system: boolean;
    unique_per_user: boolean;
    state: number;
    description: string;
}

export interface PaginatedRoles {
    data: Role[];
    pagination: Pagination | null;
}
