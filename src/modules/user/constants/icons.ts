/**
 * Shared icon-module constants for the frontend.
 *
 * Only UI-side concepts live here: source-type tokens, pagination
 * defaults, sort whitelists, view keys, recents storage keys, preview
 * size options.
 *
 * Size / count ceilings (svg bytes, image bytes, name length,
 * description length, url length, filename length, tag length, tags
 * count, import batch) are deliberately NOT mirrored on the frontend.
 * They live on the backend (helper/AppConfig.php), reach the FE via
 * `GET /constants/icon-limits` -> `iconLimitsStore`, and feed every
 * Zod schema via the `build*Schema(limits)` factories in
 * `modules/user/schemas/Icons/*`. Changing a cap is a php-side bump
 * with no frontend rebuild.
 */

// Frontend-facing source-type tokens.
export const ICON_SOURCE_TYPE_SVG = 'svg' as const;
export const ICON_SOURCE_TYPE_IMAGE = 'image' as const;
export const ICON_SOURCE_TYPE_URL = 'url' as const;
export const ICON_SOURCE_TYPES = [ICON_SOURCE_TYPE_SVG, ICON_SOURCE_TYPE_IMAGE, ICON_SOURCE_TYPE_URL] as const;
export type IconSourceType = (typeof ICON_SOURCE_TYPES)[number];

// Pagination defaults for the icon library + group list.
export const ICON_DEFAULT_PER_PAGE = 24;
export const ICON_GROUPS_DEFAULT_PER_PAGE = 50;
export const ICON_GROUP_DROPDOWN_PER_PAGE = 200;
export const ICON_GROUP_DETAIL_PREVIEW_PER_PAGE = 24;

export const ICON_LIBRARY_INITIAL_MIN_DISPLAY = 24;
export const ICON_LIBRARY_LOAD_MORE_PER_PAGE = 16;

// Sort whitelist matching backend ICON_SORTABLE_FIELDS.
export const ICON_SORT_NAME = 'name' as const;
export const ICON_SORT_CREATED_AT = 'created_at' as const;
export const ICON_SORTABLE_FIELDS = [ICON_SORT_NAME, ICON_SORT_CREATED_AT] as const;
export const ICON_SORT_DEFAULT_FIELD = ICON_SORT_NAME;
export const ICON_SORT_ASC = 'asc' as const;
export const ICON_SORT_DESC = 'desc' as const;
export const ICON_SORT_DIRECTIONS = [ICON_SORT_ASC, ICON_SORT_DESC] as const;
export const ICON_SORT_DEFAULT_DIRECTION = ICON_SORT_ASC;

export type IconSortField = (typeof ICON_SORTABLE_FIELDS)[number];
export type IconSortDirection = (typeof ICON_SORT_DIRECTIONS)[number];

// "All groups" sentinel for chip filter + group select.
export const ICON_ALL_GROUPS_ID = 0;

// Library grid: skeleton placeholders shown while fetching.
export const ICON_GRID_SKELETON_COUNT = 16;
export const ICON_BY_TYPE_SKELETON_COUNT = 12;

// Preview modal options.
export const ICON_PREVIEW_SIZES: readonly number[] = [16, 24, 48];
export const ICON_PREVIEW_DEFAULT_SIZE = 48;
export const ICON_PREVIEW_BACKGROUNDS = ['light', 'dark', 'accent'] as const;
export type IconPreviewBackground = (typeof ICON_PREVIEW_BACKGROUNDS)[number];
export const ICON_PREVIEW_DEFAULT_BACKGROUND: IconPreviewBackground = 'light';

export const ICON_PREVIEW_RENDER_SCALE = 2;
export const ICON_PREVIEW_DOWNLOAD_SCALE = 4;
export const ICON_PREVIEW_MIN_RENDER_SIZE = 80;
export const ICON_SEARCH_DEBOUNCE_MS = 300;
export const ICON_URL_PREFIX = '/icons';
export const ICON_GROUP_URL_PREFIX = '/icon-groups';

export const iconBackendRoutes = {
    icon: {
        list: ICON_URL_PREFIX,
        single: (key: number | string) => `${ICON_URL_PREFIX}/${key}`,
        state: (id: number | string) => `${ICON_URL_PREFIX}/${id}/state`,
        usages: (key: number | string) => `${ICON_URL_PREFIX}/${key}/usages`,
        import: `${ICON_URL_PREFIX}/import`,
        bulkMove: `${ICON_URL_PREFIX}/bulk-move`
    },
    iconGroup: {
        list: ICON_GROUP_URL_PREFIX,
        single: (key: number | string) => `${ICON_GROUP_URL_PREFIX}/${key}`,
        state: (id: number | string) => `${ICON_GROUP_URL_PREFIX}/${id}/state`
    }
} as const;

// localStorage key for the "recently used" picker strip -- keeps the last
// N icon ids the user picked across forms.
export const ICON_RECENT_STORAGE_KEY = 'iconLibraryRecent';
export const ICON_RECENT_MAX = 12;

// Stable enums for the Icon Library page view selector.
// Used by ManageIcons.vue to switch between table / grid / by-type
// renders without leaking string literals into the template.
export const ICON_VIEW_GRID = 'grid' as const;
export const ICON_VIEW_TABLE = 'table' as const;
export const ICON_VIEW_TYPE = 'type' as const;

export type IconViewKey = typeof ICON_VIEW_GRID | typeof ICON_VIEW_TABLE | typeof ICON_VIEW_TYPE;

export const ICON_VIEW_STORAGE_KEY = 'iconLibraryView';
export const DEFAULT_ICON_VIEW: IconViewKey = ICON_VIEW_TABLE;
