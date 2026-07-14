import type { Role } from '@/modules/user/types/AccessManagement/role';

export interface AssignRolePayload {
    role_id: number;
    starts_at: string | null;
    ends_at: string | null;
}

export interface SelectedUser {
    id: number;
    email: string;
}

export interface FetchedUserRoleBindingResponse {
    form: AssignRolePayload;
    roles: Role[];
}

export interface FetchedRolesResponse {
    data: Role[];
}
