import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';

const { translations } = storeToRefs(useLanguageStore()) as any;

export const STATUS_OPTIONS = computed(() => [
    { id: '1', name: translations.value.active },
    { id: '0', name: translations.value.inactive }
]);

export const STATE_ACTIVE = 1;
export const STATE_INACTIVE = 0;

export const STATUS_PENDING = 1;
export const STATUS_APPROVED = 2;
export const STATUS_REJECTED = 3;

export const LOOKUP_STATUS_PENDING = 'PENDING';
export const LOOKUP_STATUS_REJECTED = 'REJECT';
export const LOOKUP_STATUS_APPROV_FOR_ALL = 'ACCEPT_FOR_ALL';
export const LOOKUP_STATUS_APPROV_FOR_THIS = 'ACCEPT_FOR_THIS';
export const MAX_VISIBLE_POPOVER = 1;
export const INFO_TOOLTIP_TRIGGER_DELAY = 200;

// Per-row state machine of the ChangeStatusModal popover (presentation only).
export const CHANGE_STATUS_CELL_STATE = {
    CURRENT: 'current',
    ALLOWED: 'allowed',
    BLOCKED: 'blocked'
} as const;

export type ChangeStatusCellState = (typeof CHANGE_STATUS_CELL_STATE)[keyof typeof CHANGE_STATUS_CELL_STATE];
