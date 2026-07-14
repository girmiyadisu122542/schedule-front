<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';

import { resolveStatusIconClass } from '@/utils/statusIcon';
import { useLookupValues } from '@/composables/useLookupValues';
import { useLookupTransitions } from '@/composables/useLookupTransitions';
import { CHANGE_STATUS_CELL_STATE, type ChangeStatusCellState } from '@/constants/statusOptions';

import CheckCircle from '@/assets/icons/CheckCircle.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

interface StatusOption {
    value: string | number;
    label: string;
    icon?: string;
    color?: string;
}

// A non-status shortcut rendered after the status list (e.g. a quotation's "Accept &
// convert"). Selecting it emits `extra` with its key and closes the popover; the parent
// runs the action (with its own confirmation).
interface ExtraAction {
    key: string;
    label: string;
    icon?: string;
    color?: string;
}

interface IconColor {
    icon?: string;
    color?: string;
}

const props = withDefaults(
    defineProps<{
        visible: boolean;
        statuses: StatusOption[];
        rect?: DOMRect | null;
        current?: string | number | null;
        typeCode?: string | null;
        itemLabel?: string | null;
        extraActions?: ExtraAction[];
    }>(),
    { rect: null, current: null, typeCode: null, itemLabel: null, extraActions: () => [] }
);

const emit = defineEmits(['update:visible', 'change', 'extra']);

// Presentational fallbacks for a status whose lookup carries no icon / colour.
const DEFAULT_STATUS_ICON = 'circle';
const DEFAULT_STATUS_COLOR = '#6B7280';

const selected = ref<string | number | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuStyles = ref<any>({ top: '0px', left: '0px', visibility: 'hidden' });

// Two-step flow: pick a status in the popover, then confirm the change in a dialog.
const confirmVisible = ref(false);
const pendingValue = ref<string | number | null>(null);

const internalVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});

// When a lookup type is supplied the popover acts as a state machine: only the
// statuses reachable from `current` (per the seeded lookup transitions) stay
// selectable, the current one shows checked, and the rest are disabled.
const transitionsApi = useLookupTransitions(props.typeCode ?? '');
const typeLookup = useLookupValues(props.typeCode ?? '');

const allowedNextCodes = computed<string[] | null>(() => {
    if (!props.typeCode || props.current === null || props.current === undefined) return null;
    return transitionsApi.allowedFrom(props.current);
});

const isFlowGated = computed(() => allowedNextCodes.value !== null);

function stateOf(value: string | number): ChangeStatusCellState {
    if (props.current !== null && props.current !== undefined && String(value) === String(props.current)) {
        return CHANGE_STATUS_CELL_STATE.CURRENT;
    }
    const allowed = allowedNextCodes.value;
    if (allowed === null) return CHANGE_STATUS_CELL_STATE.ALLOWED;
    return allowed.some((code) => String(code) === String(value))
        ? CHANGE_STATUS_CELL_STATE.ALLOWED
        : CHANGE_STATUS_CELL_STATE.BLOCKED;
}

const hasSelectableTarget = computed(() =>
    props.statuses.some((option) => stateOf(option.value) === CHANGE_STATUS_CELL_STATE.ALLOWED)
);

function optionByValue(value: string | number | null): StatusOption | null {
    if (value === null) return null;
    return props.statuses.find((option) => String(option.value) === String(value)) ?? null;
}

// The passed options may hold only the legal TARGETS; resolve the "from" label via
// the type's own lookup catalogue when the current status is not among them.
const fromLabel = computed(() => {
    const fromOption = optionByValue(props.current ?? null);
    if (fromOption) return fromOption.label;
    return typeLookup.resolve(String(props.current ?? ''))?.name ?? '';
});
const toLabel = computed(() => optionByValue(pendingValue.value)?.label ?? '');

const statusTransition = computed(() =>
    fromLabel.value && toLabel.value ? { from: fromLabel.value, to: toLabel.value } : undefined
);

function iconClassFor(option: IconColor): string {
    return resolveStatusIconClass(option.icon || DEFAULT_STATUS_ICON);
}

function colorOf(option: IconColor): string {
    return option.color || DEFAULT_STATUS_COLOR;
}

function chipStyle(option: IconColor): Record<string, string> {
    const color = colorOf(option);
    return { color, backgroundColor: `${color}1A` };
}

const MENU_WIDTH = 264;
const GAP = 8;

const updatePosition = () => {
    // Measure the actual rendered size (the list is height-capped + scrollable, so this
    // is the real, bounded height) -- fall back to an estimate before the first paint.
    const menuHeight = menuRef.value?.offsetHeight ?? Math.min(props.statuses.length * 56, 320) + 110;
    const menuWidth = menuRef.value?.offsetWidth ?? MENU_WIDTH;

    if (!props.rect) {
        // No anchor (opened from an action menu / programmatically): centre on screen.
        const top = Math.max(window.scrollY + 24, window.scrollY + (window.innerHeight - menuHeight) / 2);
        const left = window.scrollX + (window.innerWidth - menuWidth) / 2;
        menuStyles.value = {
            top: `${top}px`,
            left: `${left}px`,
            position: 'absolute',
            visibility: 'visible',
            minWidth: `${MENU_WIDTH}px`
        };
        return;
    }

    const spaceBelow = window.innerHeight - props.rect.bottom - GAP;
    const spaceAbove = props.rect.top - GAP;

    // Default below the row; flip above only when there is not enough room below and
    // there is more room above.
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    let top = openUp ? props.rect.top + window.scrollY - menuHeight - GAP : props.rect.bottom + window.scrollY + GAP;
    let left = props.rect.right + window.scrollX - menuWidth;

    // Clamp inside the viewport on both axes.
    top = Math.max(window.scrollY + GAP, top);
    left = Math.min(Math.max(left, window.scrollX + GAP), window.scrollX + window.innerWidth - menuWidth - GAP);

    menuStyles.value = {
        top: `${top}px`,
        left: `${left}px`,
        position: 'absolute',
        visibility: 'visible',
        minWidth: `${MENU_WIDTH}px`
    };
};

watch(
    () => props.visible,
    async (val) => {
        if (val) {
            menuStyles.value.visibility = 'hidden';
            await nextTick();
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        } else {
            selected.value = null;
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        }
    }
);

watch(confirmVisible, (val) => {
    if (!val) pendingValue.value = null;
});

watch(
    () => props.statuses.length,
    () => {
        if (props.visible) nextTick(updatePosition);
    }
);

onUnmounted(() => {
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
});

const handleSelect = (option: StatusOption): void => {
    if (stateOf(option.value) !== CHANGE_STATUS_CELL_STATE.ALLOWED) return;
    selected.value = option.value;
};

const handleExtra = (action: ExtraAction): void => {
    internalVisible.value = false;
    emit('extra', action.key);
};

const handleApply = () => {
    if (selected.value === null) return;
    pendingValue.value = selected.value;
    internalVisible.value = false;
    confirmVisible.value = true;
};

const handleConfirm = () => {
    if (pendingValue.value === null) return;
    emit('change', pendingValue.value);
    confirmVisible.value = false;
};
</script>

<template>
    <Teleport to="body">
        <div
            v-if="internalVisible"
            class="fixed inset-0 z-999"
            @click="internalVisible = false" />

        <div
            v-if="internalVisible"
            ref="menuRef"
            :style="menuStyles"
            class="bg-surface-card border-border-default absolute z-999 rounded-2xl border p-2 shadow-2xl">
            <p class="text-text-tertiary px-3 pt-1 pb-2 text-xs font-semibold uppercase">
                {{ $lang.changeStatus || 'Change status' }}
            </p>

            <div class="flex max-h-80 flex-col space-y-0.5 overflow-y-auto">
                <button
                    v-for="status in statuses"
                    :key="status.value"
                    type="button"
                    :disabled="stateOf(status.value) !== CHANGE_STATUS_CELL_STATE.ALLOWED"
                    class="flex w-full items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors"
                    :class="[
                        selected === status.value ? 'border-border-strong bg-surface-hover' : 'border-transparent',
                        stateOf(status.value) === CHANGE_STATUS_CELL_STATE.ALLOWED
                            ? 'hover:bg-surface-hover cursor-pointer'
                            : '',
                        stateOf(status.value) === CHANGE_STATUS_CELL_STATE.BLOCKED
                            ? 'cursor-not-allowed opacity-40'
                            : '',
                        stateOf(status.value) === CHANGE_STATUS_CELL_STATE.CURRENT
                            ? 'bg-surface-subtle cursor-default'
                            : ''
                    ]"
                    @click="handleSelect(status)">
                    <span
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        :style="chipStyle(status)">
                        <i
                            :class="[iconClassFor(status), 'text-sm']"
                            aria-hidden="true" />
                    </span>

                    <span class="text-text-primary flex-1 truncate text-sm font-medium">
                        {{ status.label }}
                    </span>

                    <span
                        v-if="stateOf(status.value) === CHANGE_STATUS_CELL_STATE.CURRENT"
                        class="text-text-muted shrink-0 text-[10px] font-semibold tracking-wide uppercase">
                        {{ $lang.current || 'Current' }}
                    </span>
                    <CheckCircle
                        v-if="stateOf(status.value) === CHANGE_STATUS_CELL_STATE.CURRENT || selected === status.value"
                        :size="18"
                        class="shrink-0"
                        :style="{ color: colorOf(status) }" />
                </button>

                <!-- Non-status shortcuts (e.g. Accept & convert), pinned after the statuses. -->
                <div
                    v-if="extraActions.length"
                    class="border-border-subtle mt-1 flex flex-col space-y-0.5 border-t pt-1.5">
                    <button
                        v-for="action in extraActions"
                        :key="action.key"
                        type="button"
                        class="hover:bg-surface-hover flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left transition-colors"
                        @click="handleExtra(action)">
                        <span
                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            :style="chipStyle(action)">
                            <i
                                :class="[iconClassFor(action), 'text-sm']"
                                aria-hidden="true" />
                        </span>
                        <span class="text-text-primary flex-1 truncate text-sm font-medium">
                            {{ action.label }}
                        </span>
                    </button>
                </div>
            </div>

            <p
                v-if="isFlowGated && !hasSelectableTarget"
                class="text-text-muted px-3 py-2 text-center text-xs italic">
                {{ $lang.noFurtherStatusChange || 'No further status changes available.' }}
            </p>

            <div class="border-border-subtle mt-2 flex gap-2 border-t pt-2">
                <button
                    type="button"
                    class="border-border-default text-text-tertiary hover:bg-surface-hover flex-1 rounded-xl border py-2 text-sm transition-colors"
                    @click="internalVisible = false">
                    {{ $lang.cancel || 'Cancel' }}
                </button>
                <button
                    type="button"
                    :disabled="selected === null"
                    class="bg-schedule-brand-blue flex-1 rounded-xl py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                    @click="handleApply">
                    {{ $lang.apply || 'Apply' }}
                </button>
            </div>
        </div>
    </Teleport>

    <ConfirmDialog
        v-model:show="confirmVisible"
        type="primary"
        :title="$lang.confirmStatusChange || 'Confirm status change'"
        :message="$lang.confirmStatusChangeMessage || 'Are you sure you want to change this status?'"
        :item-label="itemLabel ?? undefined"
        :status-transition="statusTransition"
        :confirm-label="$lang.confirm || 'Confirm'"
        @confirm="handleConfirm" />
</template>
