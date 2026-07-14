export interface RolePermissionItem {
    id: number;
    name: string;
    key: string;
    is_permitted: boolean;
}

export interface RolePermissionGroup {
    id: number;
    name: string;
    code: string;
    level: number;
    permission_group_id: number | null;
    permissions: RolePermissionItem[];
    children?: RolePermissionGroup[];
}

export interface RoleModule {
    id: number;
    name: string;
    code: string;
    module_group_id: number | null;
    permissions: RolePermissionItem[];
}

export interface RoleModuleGroup {
    id: number;
    name: string;
    modules: RoleModule[];
}

export interface RolePermissionStats {
    all: number;
    granted: number;
    revoked: number;
}
