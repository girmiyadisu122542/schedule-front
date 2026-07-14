// Backend route paths for the Custom Field engine.
// Centralized here so composables/components never hardcode URLs (see CLAUDE.md §7).

export const customFieldRoutes = {
    group: {
        list: '/custom-field/groups',
        related: '/custom-field/groups/related',
        records: '/custom-field/groups/records',
        columns: '/custom-field/groups/columns',
        externalColumns: '/custom-field/groups/external-columns',
        single: (key: number | string) => `/custom-field/groups/${key}`,
        changeState: (id: number | string) => `/custom-field/groups/${id}/change-state`
    },
    field: {
        list: '/custom-field/fields',
        single: (key: number | string) => `/custom-field/fields/${key}`,
        options: (key: number | string) => `/custom-field/fields/${key}/options`,
        reorder: '/custom-field/fields/reorder',
        resolveOptions: '/custom-field/fields/resolve-options',
        changeState: (id: number | string) => `/custom-field/fields/${id}/change-state`
    },
    value: {
        list: '/custom-field/values',
        store: '/custom-field/values',
        upload: '/custom-field/upload'
    }
} as const;
