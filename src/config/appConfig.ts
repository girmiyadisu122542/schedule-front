export const DEFAULT_PAGE_LIMIT = 10;
export const PAGINATION_OPTIONS = [10, 20, 50];
/** First page index for any paginated fetch. */
export const FIRST_PAGE = 1;

export const ACTIVE_STATUS = 1;
export const INACTIVE_STATUS = 0;
export const CREATE_NEW_DISPLAY = 3;
// Subscription status codes
export const SUBSCRIPTION_STATUS_ACTIVE = 'active';
export const SUBSCRIPTION_STATUS_INACTIVE = 'inactive';
export const SUBSCRIPTION_STATUS_EXPIRED = 'expired';
export const SUBSCRIPTION_STATUS_UPCOMING = 'upcoming';

// Subscription tab / type keys
export const SUBSCRIPTION_TAB_MODULE = 'module' as const;
export const SUBSCRIPTION_TAB_FEATURE = 'feature' as const;
export type SubscriptionTab = typeof SUBSCRIPTION_TAB_MODULE | typeof SUBSCRIPTION_TAB_FEATURE;

export const TYPE_STATUS_PENDING = 1;
export const TYPE_STATUS_SUBMITTED = 2;
export const TYPE_STATUS_LOCKED = 3;
export const TYPE_STATUS_APPROVED = 4;
export const TYPE_STATUS_REJECTED = 5;
export const TYPE_STATUS_EXPIRED = 6;

export const STATUS_SUCCESS = 'success';
export const STATUS_ERROR = 'error';
export const STATUS_DANGER = 'danger';
export const STATUS_WARNING = 'warning';
export const STATUS_INFO = 'info';
export const STATUS_LIGHT = 'light';
export const STATUS_PRIMARY = 'primary';
export const STATUS_ACTIVATE = 'activate';
export const STATUS_DEACTIVATE = 'deactivate';

export const DATA_TYPE_NUMBER = 'Number';
export const DATA_TYPE_BOOLEAN = 'Boolean';
export const DATA_TYPE_TEXT = 'Text';
export const DATA_TYPE_DATE = 'Date';
export const DATA_TYPE_CHECKBOX = 'Checkbox';
export const DATA_TYPE_SELECT = 'Select';
export const DATA_TYPE_JSON = 'Json';
export const DATA_TYPE_OPTION = 'Option';
export const DATA_TYPE_TOGGLE = 'Toggle';
export const DATA_TYPE_INPUT = 'Input';
export const DATA_TYPE_TEXTAREA = 'Textarea';

export const DATA_TYPE_NUMBER_VALUE = 'number';
export const DATA_TYPE_BOOLEAN_VALUE = 'boolean';
export const DATA_TYPE_TEXT_VALUE = 'text';
export const DATA_TYPE_DATE_VALUE = 'date';
export const DATA_TYPE_SELECT_VALUE = 'select';
export const DATA_TYPE_JSON_VALUE = 'json';
export const DATA_TYPE_TEXTAREA_VALUE = 'textarea';
export const DATA_TYPE_CHECKBOX_VALUE = 'checkbox';
export const DATA_TYPE_TOGGLE_VALUE = 'toggle';
export const DATA_TYPE_OPTION_VALUE = 'option';
export const DATA_TYPE_EDITOR_VALUE = 'editor';
export const DATA_TYPE_CHECK_VALUE = 'check';

// Renderer kinds for an editable detail field (ChangeStatusModal detail grid).
export type DetailFieldType =
    | typeof DATA_TYPE_TEXT_VALUE
    | typeof DATA_TYPE_SELECT_VALUE
    | typeof DATA_TYPE_CHECKBOX_VALUE
    | typeof DATA_TYPE_EDITOR_VALUE
    | typeof DATA_TYPE_TOGGLE_VALUE;
export const DATA_TYPE_RADIO_VALUE = 'radio';
export const DATA_TYPE_INPUT_VALUE = 'input';

export const ACCESS_TOKEN_KEY = 'access_token';
export const LANGUAGE_KEY = 'lang';

export const COUNT_TIMER = 59;
export const OTP_CODE_LENGTH = 6;

export const OTP_TYPE_REGISTER = 1 as const;
export const OTP_TYPE_RESET = 2 as const;

export const ADDRESS_URL_PREFIX = 'address/';
export const MAX_VISIBLE_PAGES = 7;
export const PAGINATION_OFFSET = 2;
export const ASC_KEY_ORDER = 'asc';
export const DESC_KEY_ORDER = 'desc';
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 50;
export const MAX_CODE_LENGTH = 10;
export const MIN_CODE_LENGTH = 3;
export const MIN_LEVEL_VALUE = 0;
export const MAX_PHONE_CODE = 5;

/**
 * Scheduling master-data bounds. Fallback copies of the backend constants in
 * `helper/AppConfig.php` — Zod schemas evaluate at module load, so they cannot
 * wait on a hydrated store. Keep them in step with the backend.
 */
export const MAX_CAMPUS_CODE_LENGTH = 20;
export const MAX_ROOM_CODE_LENGTH = 30;
export const MAX_CITY_LENGTH = 100;
export const MAX_ADDRESS_LENGTH = 1000;
export const MIN_BUILDING_FLOORS = -10;
export const MAX_BUILDING_FLOORS = 200;
export const MIN_PROGRAM_DURATION_YEARS = 1;
export const MAX_PROGRAM_DURATION_YEARS = 10;
export const MIN_SECTION_YEAR_LEVEL = 1;
export const MAX_SECTION_YEAR_LEVEL = 10;
export const MIN_SEMESTER_TERM = 1;
export const MAX_SEMESTER_TERM = 3;
export const MAX_SECTION_LABEL_LENGTH = 10;
export const MAX_SECTION_EXPECTED_STUDENTS = 10000;
export const MAX_ROOM_CAPACITY = 10000;
export const MAX_LONG_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_PHONE_LENGTH = 20;
export const MAX_COURSE_HOURS = 99.99;
export const MAX_SESSIONS_PER_WEEK = 14;
/**
 * Bounds on a course's own exam length, mirroring the backend Form Request
 * and the `schedule_settings` CHECK constraints. Null there means "use the
 * study mode's default", so these only bound a value that IS given.
 */
export const MIN_EXAM_DURATION_MINUTES = 15;
export const MAX_EXAM_DURATION_MINUTES = 480;
// Mirrors MAX_EXAM_INVIGILATORS in helper/AppConfig.php.
export const MAX_EXAM_INVIGILATORS = 20;
export const MAX_INSTRUCTOR_EMAIL_LENGTH = 150;
export const MAX_ACADEMIC_RANK_LENGTH = 40;
export const MAX_INSTRUCTOR_WEEKLY_HOURS = 999.99;

export const DEFAULT_COUNTRY_CODE = 'ET';
export const ISO_COUNTRY_CODE_LENGTH = 2;
export const REGIONAL_INDICATOR_OFFSET = 127397;
export const PHONE_TRUNK_PREFIX = '0';
export const FALLBACK_COUNTRY_ICON = '🌍';

/**
 * User-form validation limits, mirroring the backend.
 *
 * These MUST match `Helper\Validation\Phone::ETHIOPIAN_PATTERN` and
 * `NATIONAL_ID_LENGTH` in `helper/AppConfig.php`. Where the two drifted, the
 * form rejected what the API accepts (a user with no national ID) and accepted
 * what the API rejects (any phone at all), so the Create button either did
 * nothing or failed on the server for a reason the field never showed.
 */
export const NATIONAL_ID_LENGTH = 16;
export const ETHIOPIAN_PHONE_PATTERN = /^(?:\+251|251|0)(9|7)\d{8}$/;
export const EXAMPLE_PHONE_NUMBER = '0912345678';

export const OTP_TYPES = {
    REGISTER: OTP_TYPE_REGISTER,
    RESET: OTP_TYPE_RESET
} as const;

export type OtpType = (typeof OTP_TYPES)[keyof typeof OTP_TYPES];

export const VERIFICATION_MODE_EMAIL = 'email' as const;
export const VERIFICATION_MODE_SMS = 'sms' as const;
export const VERIFICATION_MODE_AUTHENTICATOR = 'authenticator' as const;
export const VERIFICATION_MODE_BACKUP = 'backup' as const;
export const VERIFICATION_MODE_RESET_PASSWORD = 'resetPassword' as const;

export const VERIFICATION_MODES = {
    EMAIL: VERIFICATION_MODE_EMAIL,
    SMS: VERIFICATION_MODE_SMS,
    AUTHENTICATOR: VERIFICATION_MODE_AUTHENTICATOR,
    BACKUP: VERIFICATION_MODE_BACKUP,
    RESET_PASSWORD: VERIFICATION_MODE_RESET_PASSWORD
} as const;

export type VerificationMode = (typeof VERIFICATION_MODES)[keyof typeof VERIFICATION_MODES];

export const VERIFICATION_STEP_LIST = 'LIST' as const;
export const VERIFICATION_STEP_CODE = 'CODE' as const;
export const VERIFICATION_STEP_BACKUP = 'BACKUP' as const;

export const VERIFICATION_STEPS = {
    LIST: VERIFICATION_STEP_LIST,
    CODE: VERIFICATION_STEP_CODE,
    BACKUP: VERIFICATION_STEP_BACKUP
} as const;

export type VerificationStep = (typeof VERIFICATION_STEPS)[keyof typeof VERIFICATION_STEPS];

export const PROFILE_TAB_BASIC = 'basic' as const;
export const PROFILE_TAB_PREFERENCE = 'preference' as const;
export const PROFILE_TAB_SECURITY = 'security' as const;
export const PROFILE_TAB_VERIFICATION = 'verification' as const;
export const PROFILE_TAB_NOTIFICATIONS = 'notifications' as const;
export const PROFILE_TAB_DEVICES = 'devices' as const;

export const PROFILE_TABS = {
    BASIC: PROFILE_TAB_BASIC,
    PREFERENCE: PROFILE_TAB_PREFERENCE,
    SECURITY: PROFILE_TAB_SECURITY,
    VERIFICATION: PROFILE_TAB_VERIFICATION,
    NOTIFICATIONS: PROFILE_TAB_NOTIFICATIONS,
    DEVICES: PROFILE_TAB_DEVICES
} as const;

export type ProfileTab = (typeof PROFILE_TABS)[keyof typeof PROFILE_TABS];

export const MODULE_URL_PREFIX = '/module';
export const FEATURE_URL_PREFIX = '/feature';

export const backendApi = {
    module: {
        subscriptions: `${MODULE_URL_PREFIX}/module-subscriptions`
    },
    feature: {
        subscriptions: `${FEATURE_URL_PREFIX}/feature-subscriptions`
    }
} as const;

export const SCREEN_SM = 'sm';
export const SCREEN_MD = 'md';
export const SCREEN_LG = 'lg';
export const SCREEN_XL = 'xl';

/** Card / compact-component size scale (reuses the screen-size tokens). */
export const CARD_SIZE = {
    SM: SCREEN_SM,
    MD: SCREEN_MD
} as const;
export type CardSize = (typeof CARD_SIZE)[keyof typeof CARD_SIZE];

export const MAX_MEASUREMENT_BADGE = 2;

export const PERMISSION_PARAM_KEY = 'permissions';
export const DROPDOWN_PARAM_KEY = 'dropdown';
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const KB = 1024;

export function bytesToKb(bytes: number): number {
    return Math.round(bytes / KB);
}

export const MAX_DISPLAY = 3;
export const TRANCATED_TEXT_LENGTH = 50;
export const TRANCATED_TEXT_TYPE = '... and more';

export const DAYS_IN_WEEK = 7;
export const HOURS_IN_DAY = 24;
export const WEEKS_IN_MONTH = 4;
export const MONTHS_IN_YEAR = 12;
export const YEARS_IN_DECADE = 10;
export const MINUTES_IN_HOUR = 60;
export const SECONDS_IN_MINUTE = 60;
export const MILE_SECONDS_IN_SECOND = 1000;
export const RESPONSE_TYPE_BLOB = 'blob';
export const CURRENT_PAGE = 1;
export const TRUE = 1;
export const FALSE = 0;

// Date/time picker layout & ranges
export const DATE_PICKER_POPUP_HEIGHT = 350;
export const DATE_PICKER_POPUP_WIDTH = 320;
export const DATE_PICKER_POPUP_Z_INDEX = 99999;
export const DATE_PICKER_POPUP_OFFSET = 4;
export const DATE_PICKER_YEAR_RANGE = 100;
export const DATE_PICKER_MAX_HOUR = HOURS_IN_DAY - 1;
export const DATE_PICKER_MAX_MINUTE = MINUTES_IN_HOUR - 1;
export const DATE_PICKER_MAX_SECOND = SECONDS_IN_MINUTE - 1;

export const BULK_ACTION = {
    ACTIVATE: 'activate',
    DEACTIVATE: 'deactivate'
} as const;

export type BulkAction = (typeof BULK_ACTION)[keyof typeof BULK_ACTION];

export const ROLE_PERMISSION_TAB = {
    CREATE_ROLE: 'create_role',
    ASSIGN_PERMISSIONS: 'assign_permissions'
} as const;

export type RolePermissionTab = (typeof ROLE_PERMISSION_TAB)[keyof typeof ROLE_PERMISSION_TAB];

export const USER_FORM_TAB = {
    USER_DETAIL: 'userDetail',
    ASSIGN_ROLE: 'assignRole',
    ASSIGN_PERMISSION: 'assignPermission',
    ASSIGNED_PERMISSIONS: 'assignedPermissions'
} as const;

export const ALL_TAB_VALUE = 'all';

export const PERMISSION_OVERRIDE_STATUS = {
    ALLOWED: 'allowed',
    REVOKED: 'revoked'
} as const;

export const TYPEOF = {
    BOOLEAN: 'boolean',
    NUMBER: 'number'
} as const;

export const isNumber = (value: unknown): value is number => typeof value === TYPEOF.NUMBER;
export const isBoolean = (value: unknown): value is boolean => typeof value === TYPEOF.BOOLEAN;
export type PermissionOverrideStatus = (typeof PERMISSION_OVERRIDE_STATUS)[keyof typeof PERMISSION_OVERRIDE_STATUS];

export type UserFormTab = (typeof USER_FORM_TAB)[keyof typeof USER_FORM_TAB];

export const VISIBLE_ACTIONS = 7;
export const TABLE_VISIBLE_ACTIONS = 3;
export const ACTION_MENU_GAP = 8;
export const ACTION_VIEWPORT_PADDING = 8;
export const ACTION_MIN_SPACE_BELOW = 240;
export const CALENDAR_TYPE = {
    GREGORIAN: 'GC',
    ETHIOPIAN: 'EC'
} as const;

export type CalendarType = (typeof CALENDAR_TYPE)[keyof typeof CALENDAR_TYPE];

export const DATE_PICKER_VIEW = {
    DATE_TIME: 'dateTime',
    MONTH: 'month',
    YEAR: 'year'
} as const;
export type DatePickerView = (typeof DATE_PICKER_VIEW)[keyof typeof DATE_PICKER_VIEW];

export const BADGE_VARIANT = {
    PRIMARY: 'primary',
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
    LIGHT: 'light',
    DANGER: 'danger',
    NONE: 'none'
} as const;
export type BadgeVariant = (typeof BADGE_VARIANT)[keyof typeof BADGE_VARIANT];

export const BREADCRUMB_VARIANT = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
} as const;
export type BreadcrumbVariant = (typeof BREADCRUMB_VARIANT)[keyof typeof BREADCRUMB_VARIANT];

export const DEFAULT_EXPORT_FILE_EXTENSION = 'xlsx';
export const EXPORT_SUFFIX = '-export-';
export const EXPORT_DATE_SEPARATOR = '-to-';
export const EXPORT_TIMESTAMP_SEPARATOR = 'T';
export const EXPORT_STRING_SPLIT_LIMIT = 0;
export const EXPORT_PAD_START_MAX_LENGTH = 2;
export const EXPORT_PAD_START_FILL_STRING = '0';
export const EXPORT_MONTH_OFFSET = 1;
export const EXPORT_NOT_FOUND = 404;

/**
 * Master-data spreadsheet import / export.
 *
 * Mirrors `App\Constants\ImportConstant` on the backend. The backend stays the
 * authority — these are the values the UI needs before a round trip, and the
 * row/size ceilings are shown only as guidance; the server enforces them.
 */
export const EXPORT_FORMAT_XLSX = 'xlsx';
export const EXPORT_FORMAT_CSV = 'csv';
export const EXPORT_FORMATS = [EXPORT_FORMAT_XLSX, EXPORT_FORMAT_CSV] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/**
 * PDF is a SCHEDULE-only format, produced in the browser from what is on
 * screen. It is deliberately kept out of `EXPORT_FORMATS`: that list narrows
 * what the backend master-data export will accept, and the backend writes
 * spreadsheets only — offering PDF there would just 422.
 */
export const EXPORT_FORMAT_PDF = 'pdf';
export const SCHEDULE_EXPORT_FORMATS = [EXPORT_FORMAT_XLSX, EXPORT_FORMAT_PDF] as const;
export type ScheduleExportFormat = (typeof SCHEDULE_EXPORT_FORMATS)[number];

export const IMPORT_MODE_CREATE_ONLY = 'create_only';
export const IMPORT_MODE_UPSERT = 'upsert';
export const IMPORT_MODES = [IMPORT_MODE_CREATE_ONLY, IMPORT_MODE_UPSERT] as const;
export type ImportMode = (typeof IMPORT_MODES)[number];

/** Accept attribute for the file picker. */
export const IMPORT_ACCEPTED_FILE_TYPES = '.xlsx,.csv';
/** Rows shown in the dry-run error table before it scrolls. */
export const IMPORT_ERROR_PREVIEW_ROWS = 50;

export const CONTROL_SIZE = {
    SMALL: 'small',
    NORMAL: 'normal',
    LARGE: 'large'
} as const;
export type ControlSize = (typeof CONTROL_SIZE)[keyof typeof CONTROL_SIZE];

export const OPTION_VALUE_OBJECT = 'object';

export const TYPE_OBJECT = 'object';

export const ICON_POSITION = {
    BEFORE: 'before',
    AFTER: 'after'
} as const;
export type IconPosition = (typeof ICON_POSITION)[keyof typeof ICON_POSITION];

export const CURSOR_POINTER = 'cursor-pointer';
export const CHILDREN_KEY = 'children';
export const DESCENDANTS_KEY = 'descendants';

export const BADGE_SEVERITY = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SUCCESS: 'success',
    INFO: 'info',
    WARN: 'warn',
    DANGER: 'danger',
    CONTRAST: 'contrast',
    BAR: 'bar'
} as const;
export type BadgeSeverity = (typeof BADGE_SEVERITY)[keyof typeof BADGE_SEVERITY];

export const BADGE_SIZE = {
    SMALL: 'small',
    NORMAL: 'normal',
    LARGE: 'large',
    XLARGE: 'xlarge'
} as const;
export type BadgeSize = (typeof BADGE_SIZE)[keyof typeof BADGE_SIZE];

export const ICON_AVATAR_SHAPE = {
    CIRCLE: 'circle',
    ROUNDED: 'rounded',
    SQUARE: 'square'
} as const;
export type IconAvatarShape = (typeof ICON_AVATAR_SHAPE)[keyof typeof ICON_AVATAR_SHAPE];

export const ICON_AVATAR_TONE = {
    NEUTRAL: 'neutral',
    BRAND: 'brand',
    SUCCESS: 'success',
    WARNING: 'warning',
    DANGER: 'danger'
} as const;
export type IconAvatarTone = (typeof ICON_AVATAR_TONE)[keyof typeof ICON_AVATAR_TONE];

export const OPTION_FIELD = {
    LABEL: 'label',
    VALUE: 'value',
    ICON: 'icon'
} as const;

export const CSS_POSITION_FIXED = 'fixed';
export const TRANSFORM_ORIGIN = {
    TOP: 'top',
    BOTTOM: 'bottom'
} as const;
export type TransformOrigin = (typeof TRANSFORM_ORIGIN)[keyof typeof TRANSFORM_ORIGIN];

export const COLUMN_ALIGN = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right'
} as const;
export type ColumnAlign = (typeof COLUMN_ALIGN)[keyof typeof COLUMN_ALIGN];

export const LABEL_POSITION = {
    LEFT: COLUMN_ALIGN.LEFT,
    RIGHT: COLUMN_ALIGN.RIGHT
} as const;
export type LabelPosition = (typeof LABEL_POSITION)[keyof typeof LABEL_POSITION];

export const COMPONENT_SIZE = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg'
} as const;
export type ComponentSize = (typeof COMPONENT_SIZE)[keyof typeof COMPONENT_SIZE];

export const CONTROL_VARIANT_OUTLINED = 'outlined';
export const VARIANT_NONE = 'none';

export const BULK_ACTION_SCOPE = {
    MAIN: 'main',
    OVERFLOW: 'overflow'
} as const;
export type BulkActionScope = (typeof BULK_ACTION_SCOPE)[keyof typeof BULK_ACTION_SCOPE];

export const BULK_ACTION_VARIANT = {
    DANGER: 'danger',
    PRIMARY: 'primary',
    SECONDARY: 'secondary'
} as const;
export type BulkActionVariant = (typeof BULK_ACTION_VARIANT)[keyof typeof BULK_ACTION_VARIANT];
// pricing category types
export const PRICING_CATEGORY_TYPE_MODULE = 'MODULE';
export const PRICING_CATEGORY_TYPE_USAGE = 'USAGE';
export const PRICING_CATEGORY_TYPE_FEATURE = 'FEATURE';
export const PRICING_CATEGORY_TYPE_PLAN = 'PLAN';
export const PRICING_CATEGORY_TYPE_ADDON = 'ADDON';
export const PRICING_CATEGORY_TYPE_BUNDLE = 'BUNDLE';

// suscription discount type types
export const SUBSCRIPTION_DISCOUNT_TYPE_NEW_YEAR = 'NEW_YEAR';
export const SUBSCRIPTION_DISCOUNT_TYPE_HOLIDAY = 'HOLIDAY';
export const SUBSCRIPTION_DISCOUNT_TYPE_MODULE = 'MODULE';
export const SUBSCRIPTION_DISCOUNT_TYPE_FEATURE = 'FEATURE';
export const SUBSCRIPTION_DISCOUNT_TYPE_PROMO_CODE = 'PROMO_CODE';
export const SUBSCRIPTION_DISCOUNT_TYPE_LOYAL_CUSTOMER = 'LOYAL_CUSTOMER';
