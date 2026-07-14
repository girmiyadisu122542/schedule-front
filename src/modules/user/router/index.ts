import type { RouteRecordRaw } from 'vue-router';

const userRoutes: Array<RouteRecordRaw> = [
    {
        path: 'admins',
        name: 'adminModule',
        children: [
            {
                path: 'dynamic-values',
                name: 'DynamicValues',
                component: () => import('@/modules/user/views/CustomFields/DynamicValues/ManageDynamicValues.vue')
            },
            {
                path: 'create-lookup-type',
                name: 'CreateLookupType',
                component: () => import('@/modules/user/views/CustomFields/DynamicValues/CreateLookupType.vue')
            }
        ]
    },
    {
        path: 'users',
        name: 'userModule',
        children: [
            {
                path: 'manage-roles',
                name: 'roles',
                component: () => import('@/modules/user/views/AccessManagement/Role/ManageRoles.vue')
            },
            {
                path: 'manage-roles/create',
                name: 'createRolePermission',
                component: () => import('@/modules/user/views/AccessManagement/Role/CreateRolePermission.vue')
            },
            {
                path: 'manage-roles/:id/permissions',
                name: 'rolePermissions',
                component: () => import('@/modules/user/views/AccessManagement/Role/CreateRolePermission.vue')
            },
            {
                path: 'manage-permissions',
                name: 'permissions',
                component: () => import('@/modules/user/views/AccessManagement/Permission/ManagePermissions.vue')
            },
            {
                path: 'manage-users',
                name: 'UserManagement',
                component: () => import('@/modules/user/views/AccessManagement/User/ManageUsers.vue')
            },
            {
                path: 'manage-users/add-user',
                name: 'AddUser',
                component: () => import('@/modules/user/components/AccessManagement/Users/UserForm.vue')
            },
            {
                path: 'user-profile',
                name: 'UserProfile',
                component: () => import('@/modules/user/views/UserProfile/ManageProfile.vue')
            }
        ]
    }
];

export default userRoutes;
