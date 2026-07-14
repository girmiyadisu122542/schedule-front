export const BUSINESS_GROUP = 1;
export const ORGANIZATION = 2;
export const BRANCH = 3;
export const SHOP = 4;

export const STATE_ACTIVE = 1;
export const STATE_INACTIVE = 0;

export const DELETE = 'delete';
export const ACTIVATE = 'activate';
export const DEACTIVATE = 'deactivate';
export const STATUS_CHANGE = 'change_status';
export const DECIMAL_SUPPORT = 'decimal_support';
export const NO_DECIMAL_SUPPORT = 'no_decimal_support';

export const COUNTRY_URL = '/address/countries';
export const ENTITY_URL = '/entities/manage-entity';
export const LOCATION_URL = '/entities/location-tree';
export const ADMIN_STRUCTURE_URL = '/address/admin-structure';
export const ADMIN_UNIT_DETAIL_URL = '/address/admin-unit/detail';

export const PERMISSION_PARAM_KEY = 'permissions';
export const DOCUMENT_TYPE_URL = '/document/types';
export const MEASUREMENT_URL = '/measurements/measurement';

// types
export const TEXT = 'text';
export const TEXTAREA = 'textarea';
export const NUMBER = 'number';
export const TOGGLE = 'toggle';
export const SELECT = 'select';
export const DATE = 'date';
export const MULTISELECT = 'multi-select';
export const MAP = 'map';
export const FILE = 'file';
export const CHECKBOX = 'check';
export const CHECK = 'check';
export const LIST = 'list';
export const CREATE = 'create';
export const NUMERIC = 'numeric';
export const SHORT = 'short';
export const STRING = 'string';
export const OBJECT = 'object';
export const TWO_DIGIT = '2-digit';

export const MAX_VISIBLE_ACTIONS = 3;
export const NOT_FOUND_INDEX = -1;

export const PRICING_PLAN_URL = '/subscriptions-and-pricing/pricing-plan';
export const MODULE_CODE = 'MODULE';
export const FEATURE_CODE = 'FEATURE';
export const USAGE_CODE = 'USAGE';
export const PROMO_CODE = 'PROMO_CODE';
export const SUBSCRIPTION_DISCOUNT_TYPE_PERCENTAGE = 'SUBSCRIPTION_DISCOUNT_TYPE_PERCENTAGE';
export const SUBSCRIPTION_DISCOUNT_TYPE_FIXED = 'SUBSCRIPTION_DISCOUNT_TYPE_FIXED';
export const URL_PLACEHOLDER = 'http://';
export const PERCENTAGE_MULTIPLIER = 100;
export const ARRAY_LENGTH_ZERO = 0;
export const MILLION_NUMBER = 1000000;
export const THOUSAND_NUMBER = 1000;
export const ONE_DECIMAL_POINT = 1;
export const TWO_DECIMAL_POINT = 2;
export const ZERO_DECIMAL_POINT = 0;
export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export const TIME_OUT_300 = 300;
export const TIME_OUT_500 = 500;
export const TIME_OUT_1000 = 1000;
export const TAB_BASIC = 'basic';
export const TAB_APPROVAL = 'approval';

// customer types
export const CUSTOMER_TYPE_COMPANY = 'CUSTOMER_TYPE_COMPANY';
export const SUBSCRIPTION_URL = '/subscriptions-and-pricing/subscriptions';
export const USAGE_TRACKING_URL = '/subscriptions-and-pricing/track-usage';
export const TAX_POLICY_URL = '/tax/tax-policy';

export const WORKFLOW_ASSIGNMENT = {
    USER: 'user',
    ROLE: 'role'
} as const;

// Tax-policy editor field identifiers (used with updateField / row updates).
export const TAX_POLICY_FIELD = {
    NAME: 'name',
    REFERENCE: 'reference',
    EFFECTIVE_FROM: 'effective_from',
    EFFECTIVE_TO: 'effective_to'
} as const;

export const WITHHOLD_ROW_FIELD = {
    MINIMUM_HOLDABLE: 'minimum_holdable',
    START_DATE: 'start_date',
    END_DATE: 'end_date'
} as const;

export type TaxPolicyField = (typeof TAX_POLICY_FIELD)[keyof typeof TAX_POLICY_FIELD];
export type WithholdRowField = (typeof WITHHOLD_ROW_FIELD)[keyof typeof WITHHOLD_ROW_FIELD];
export type WithholdRowDateField = typeof WITHHOLD_ROW_FIELD.START_DATE | typeof WITHHOLD_ROW_FIELD.END_DATE;

export const RECTANGLE = 'rectangle';
export const ETHIOPIA = 'ethiopia';
export const IDENTITY = 'identity';

// entity localStorage keys
export const SELECTED_ENTITY_KEY = 'selectedEntity';
export const ENTITY_FORM_DATA_KEY = 'entityFormData';
export const IS_EDITING_ENTITY_KEY = 'isEditingEntity';
export const ENTITY_ACTIVE_TAB_KEY = 'entityActiveTab';
export const SELECTED_ENTITY_ID_KEY = 'selectedEntityId';
export const SELECTED_COUNTRY_ID_KEY = 'selectedCountryId';
export const SELECTED_ENTITY_TYPE_KEY = 'selectedEntityType';
export const SELECTED_UPPER_ENTITY_TYPE_ID_KEY = 'selectedUpperEntityTypeId';

export const VERTICAL = 'vertical';
export const HORIZONTAL = 'horizontal';
export const COMPLETED = 'completed';
export const PENDING = 'pending';
export const CURRENT = 'current';
export const SUCCESS = 'success';
export const WARNING = 'warning';
export const DANGER = 'danger' as const;
export const BAR = 'bar' as const;

export const PRIMARY = 'primary' as const;
export const SECONDARY = 'secondary' as const;
export const INFO = 'info' as const;
export const LIGHT = 'light' as const;

export const CONFIRM_TYPES = {
    DANGER: DANGER,
    SUCCESS: SUCCESS,
    INFO: INFO,
    ACTIVATE: ACTIVATE,
    DEACTIVATE: DEACTIVATE,
    LIGHT: LIGHT,
    WARNING: WARNING,
    PRIMARY: PRIMARY
} as const;

export type ConfirmType = (typeof CONFIRM_TYPES)[keyof typeof CONFIRM_TYPES];

// Document form tabs (CreateDocument `activeTab`)
export const DOCUMENT_TAB_BASIC = 'basic';
export const DOCUMENT_TAB_SEQUENCE = 'sequence';
export const DOCUMENT_TAB_ATTACHMENTS = 'attachments';
export const DOCUMENT_TAB_WORKFLOW = 'workflow';

// Document detail-modal tab (ManageDocument `detailTab` — adds `info`, reuses the tabs above)
export const DOCUMENT_TAB_INFO = 'info';

// Document items-modal list types (ManageDocument `listType`)
export const DOCUMENT_LIST_ATTACHMENTS = 'attachments';
export const DOCUMENT_LIST_WORKFLOW_STEPS = 'workflow_steps';
export const DOCUMENT_LIST_SEQUENCES = 'sequences';

// Document pending-delete item types (`pendingDeleteItem.type`)
export const DOCUMENT_ITEM_ATTACHMENT = 'attachment';
export const DOCUMENT_ITEM_WORKFLOW = 'workflow';
export const DOCUMENT_ITEM_SEQUENCE = 'sequence';

export const CONFIGURATION = 'configuration';
export const UNIT = 'unit';

export const COLSPAN = {
    1: 'md:col-span-2',
    2: 'md:col-span-2'
};
export const COLSPAN_TWO = 2;
export const EDITOR = 'editor';
export const DEFAULT = 'default';

// User menu (UserMenu.vue / useUserMenu) ---------------------------------

// DOM selectors used for click-outside detection + floating-panel positioning
export const USER_MENU_ITEM_SELECTOR = '.user-menu-item';
export const USER_MENU_DROPDOWN_SELECTOR = '.user-menu-dropdown';
export const USER_MENU_CONTAINER_SELECTOR = '.user-menu-container';

// Sentinel returned by the user composable when there is no email
export const NO_EMAIL = 'No email';

// Routes the menu links point at
export const HELP_ROUTE = '/help';
export const MODULES_ROUTE = '/modules';
export const SETTINGS_ROUTE = '/settings';
export const DASHBOARD_ROUTE = '/dashboard';
export const USER_PROFILE_ROUTE = '/users/user-profile';

// Translation keys (mirror the backend sidebar/front translation keys)
export const USER_MENU_KEY_HELP = 'help';
export const USER_MENU_KEY_COPIED = 'copied';
export const USER_MENU_KEY_LOGOUT = 'logout';
export const USER_MENU_KEY_MODULES = 'modules';
export const USER_MENU_KEY_SIGN_OUT = 'signOut';
export const USER_MENU_KEY_SETTINGS = 'settings';
export const USER_MENU_KEY_DASHBOARD = 'dashboard';
export const USER_MENU_KEY_COPY_EMAIL = 'copyEmail';
export const USER_MENU_KEY_USER_PROFILE = 'userProfile';
export const USER_MENU_KEY_UPGRADE = 'upgradeSubscription';
export const USER_MENU_KEY_CLIPBOARD_UNAVAILABLE = 'clipboardUnavailable';

// English fallback labels for the keys above
export const USER_MENU_LABEL_HELP = 'Help';
export const USER_MENU_LABEL_COPIED = 'Copied';
export const USER_MENU_LABEL_LOGOUT = 'Logout';
export const USER_MENU_LABEL_MODULES = 'Modules';
export const USER_MENU_LABEL_SETTINGS = 'Settings';
export const USER_MENU_LABEL_DASHBOARD = 'Dashboard';
export const USER_MENU_LABEL_COPY_EMAIL = 'Copy email';
export const USER_MENU_LABEL_USER_PROFILE = 'User Profile';
export const USER_MENU_LABEL_UPGRADE = 'Upgrade Subscription';
export const USER_MENU_LABEL_CLIPBOARD_UNAVAILABLE = 'Clipboard unavailable';

export const ZERO = 0;
export const ONE = 1;
export const TWO = 2;

// Entitlement-override form field keys (useEntitlementOverride)
export const ENTITLEMENT_OVERRIDE_FIELD = {
    MODULE_ID: 'module_id',
    ENTITY_ID: 'entity_id',
    FEATURE_ID: 'feature_id',
    TARGET_TYPE: 'target_type'
} as const;
export const TRUE = 'true';
export const HEX_LENGTH = 16;
export const DEFAULT_RGB_COLOR_VALUE = {
    r: 59,
    g: 130,
    b: 246,
};
