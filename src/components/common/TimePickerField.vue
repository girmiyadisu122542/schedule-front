<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

/**
 * Reusable smart time picker field: a clock trigger that opens a compact
 * hour / minute / AM-PM column picker TELEPORTED to <body> so it is never
 * clipped by a dialog's overflow and always paints above modals. Stores and
 * emits a 24-hour "HH:mm" string while rendering a friendly 12-hour label by
 * default (set `use24h` for a 24-hour face). Mirrors ColorPickerField's
 * trigger + teleported-panel + :invalid/:message field API so it is a drop-in
 * replacement for the ad-hoc `<input type="time">` pairs across the app.
 */
const props = withDefaults(
    defineProps<{
        modelValue?: string | null;
        label?: string;
        placeholder?: string;
        invalid?: boolean;
        message?: string;
        minuteStep?: number;
        use24h?: boolean;
        disabled?: boolean;
    }>(),
    {
        modelValue: '',
        label: '',
        placeholder: '',
        invalid: false,
        message: '',
        minuteStep: 5,
        use24h: false,
        disabled: false
    }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const PANEL_WIDTH = 264;
const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const pos = ref<{ top: number; left: number }>({ top: 0, left: 0 });

const draftH = ref<number | null>(null); // 0..23
const draftM = ref<number | null>(null); // 0..59

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

function parse(value: string | null | undefined): { h: number; m: number } | null {
    if (!value) return null;
    const match = /^(\d{1,2}):(\d{1,2})/.exec(value.trim());
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return null;
    return { h, m };
}

const hourCells = computed(() =>
    props.use24h ? Array.from({ length: 24 }, (_, index) => index) : Array.from({ length: 12 }, (_, index) => index + 1)
);
const minuteCells = computed(() => {
    const step = props.minuteStep > 0 ? props.minuteStep : 5;
    const cells: number[] = [];
    for (let minute = 0; minute < 60; minute += step) cells.push(minute);
    return cells;
});

const period = computed<'AM' | 'PM'>(() => (draftH.value !== null && draftH.value >= 12 ? 'PM' : 'AM'));
const hour12 = computed<number | null>(() => {
    if (draftH.value === null) return null;
    const mod = draftH.value % 12;
    return mod === 0 ? 12 : mod;
});

const display = computed(() => {
    if (draftH.value === null || draftM.value === null) return '';
    if (props.use24h) return pad(draftH.value) + ':' + pad(draftM.value);
    return pad(hour12.value ?? 12) + ':' + pad(draftM.value) + ' ' + period.value;
});

function commit(): void {
    if (draftH.value === null) draftH.value = 0;
    if (draftM.value === null) draftM.value = 0;
    emit('update:modelValue', pad(draftH.value) + ':' + pad(draftM.value));
}

function pickHour(cell: number): void {
    if (props.use24h) {
        draftH.value = cell;
    } else {
        const base = cell % 12; // 12 -> 0
        draftH.value = period.value === 'PM' ? base + 12 : base;
    }
    commit();
}
function pickMinute(cell: number): void {
    draftM.value = cell;
    commit();
}
function pickPeriod(next: 'AM' | 'PM'): void {
    if (draftH.value === null) draftH.value = next === 'PM' ? 12 : 0;
    else if (next === 'AM' && draftH.value >= 12) draftH.value -= 12;
    else if (next === 'PM' && draftH.value < 12) draftH.value += 12;
    commit();
}
function setNow(): void {
    const now = new Date();
    draftH.value = now.getHours();
    draftM.value = now.getMinutes();
    commit();
}

const panelStyle = computed(() => ({
    position: 'fixed' as const,
    top: pos.value.top + 'px',
    left: pos.value.left + 'px',
    width: PANEL_WIDTH + 'px',
    zIndex: 100000
}));

const place = (): void => {
    const rect = trigger.value?.getBoundingClientRect();
    if (!rect) return;
    const gap = 8;
    const panelHeight = panel.value?.offsetHeight ?? 300;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = rect.bottom + gap;
    if (viewportHeight - rect.bottom < panelHeight + gap && rect.top > panelHeight + gap) {
        top = rect.top - panelHeight - gap; // flip above when there is not room below
    }
    let left = rect.left;
    if (left + PANEL_WIDTH > viewportWidth - 8) left = viewportWidth - PANEL_WIDTH - 8;
    if (left < 8) left = 8;
    pos.value = { top, left };
};

function scrollSelectedIntoView(): void {
    const nodes = panel.value?.querySelectorAll('[data-selected="true"]');
    nodes?.forEach((node) => (node as HTMLElement).scrollIntoView({ block: 'center' }));
}

const toggle = (): void => {
    if (props.disabled) return;
    open.value = !open.value;
};

watch(
    () => props.modelValue,
    (value) => {
        const parsed = parse(value);
        draftH.value = parsed ? parsed.h : null;
        draftM.value = parsed ? parsed.m : null;
    },
    { immediate: true }
);

watch(open, (isOpen) => {
    if (isOpen) {
        nextTick(() => {
            place();
            scrollSelectedIntoView();
            window.addEventListener('scroll', place, true);
            window.addEventListener('resize', place);
        });
    } else {
        window.removeEventListener('scroll', place, true);
        window.removeEventListener('resize', place);
    }
});

const onDocPointer = (event: MouseEvent): void => {
    if (!open.value) return;
    const target = event.target as Node;
    if (trigger.value?.contains(target) || panel.value?.contains(target)) return;
    open.value = false;
};

onMounted(() => document.addEventListener('mousedown', onDocPointer));
onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onDocPointer);
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
});
</script>

<template>
    <div class="relative">
        <label
            v-if="label"
            class="text-text-secondary mb-1.5 block text-sm font-semibold">
            {{ label }}
        </label>
        <button
            ref="trigger"
            type="button"
            :disabled="disabled"
            class="border-border-default bg-surface-card hover:border-border-strong flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            :class="invalid ? 'border-schedule-error-strong' : ''"
            @click="toggle">
            <i class="fas fa-clock text-schedule-brand-blue text-sm"></i>
            <span
                v-if="display"
                class="text-text-primary text-sm font-medium tabular-nums">
                {{ display }}
            </span>
            <span
                v-else
                class="text-text-muted text-sm">
                {{ placeholder || $lang.selectTime || 'Select time' }}
            </span>
            <i class="fas fa-chevron-down text-text-muted ml-auto text-xs"></i>
        </button>
        <p
            v-if="invalid && message"
            class="text-schedule-error-strong mt-1 text-xs">
            {{ message }}
        </p>

        <Teleport to="body">
            <div
                v-if="open"
                ref="panel"
                class="bg-surface-card border-border-default rounded-2xl border p-3 shadow-xl"
                :style="panelStyle">
                <div class="bg-surface-subtle mb-3 flex items-center justify-center rounded-xl py-2.5">
                    <span class="text-text-primary text-2xl font-semibold tabular-nums">
                        {{ display || (use24h ? '--:--' : '--:-- --') }}
                    </span>
                </div>
                <div class="flex gap-2">
                    <div class="flex-1">
                        <p
                            class="text-text-tertiary mb-1 text-center text-[11px] font-semibold tracking-wide uppercase">
                            {{ $lang.hour || 'Hr' }}
                        </p>
                        <div class="schedule-time-col flex max-h-44 flex-col gap-0.5 overflow-y-auto pr-1">
                            <button
                                v-for="cell in hourCells"
                                :key="'h' + cell"
                                type="button"
                                :data-selected="(use24h ? draftH === cell : hour12 === cell) ? 'true' : 'false'"
                                class="shrink-0 rounded-md py-1.5 text-center text-sm font-medium tabular-nums transition-colors"
                                :class="
                                    (use24h ? draftH === cell : hour12 === cell)
                                        ? 'bg-schedule-brand-blue text-white'
                                        : 'text-text-secondary hover:bg-surface-hover'
                                "
                                @click="pickHour(cell)">
                                {{ use24h ? pad(cell) : cell }}
                            </button>
                        </div>
                    </div>
                    <div class="flex-1">
                        <p
                            class="text-text-tertiary mb-1 text-center text-[11px] font-semibold tracking-wide uppercase">
                            {{ $lang.minute || 'Min' }}
                        </p>
                        <div class="schedule-time-col flex max-h-44 flex-col gap-0.5 overflow-y-auto pr-1">
                            <button
                                v-for="cell in minuteCells"
                                :key="'m' + cell"
                                type="button"
                                :data-selected="draftM === cell ? 'true' : 'false'"
                                class="shrink-0 rounded-md py-1.5 text-center text-sm font-medium tabular-nums transition-colors"
                                :class="
                                    draftM === cell
                                        ? 'bg-schedule-brand-blue text-white'
                                        : 'text-text-secondary hover:bg-surface-hover'
                                "
                                @click="pickMinute(cell)">
                                {{ pad(cell) }}
                            </button>
                        </div>
                    </div>
                    <div
                        v-if="!use24h"
                        class="flex w-14 flex-col">
                        <p
                            class="text-text-tertiary mb-1 text-center text-[11px] font-semibold tracking-wide uppercase">
                            {{ $lang.meridiem || 'AM/PM' }}
                        </p>
                        <div class="flex flex-col gap-1">
                            <button
                                v-for="value in ['AM', 'PM'] as const"
                                :key="value"
                                type="button"
                                class="rounded-md py-2 text-center text-sm font-semibold transition-colors"
                                :class="
                                    period === value
                                        ? 'bg-schedule-brand-blue text-white'
                                        : 'text-text-secondary bg-surface-subtle hover:bg-surface-hover'
                                "
                                @click="pickPeriod(value)">
                                {{ value }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="border-border-subtle mt-3 flex items-center justify-between border-t pt-2.5">
                    <button
                        type="button"
                        class="text-schedule-brand-blue hover:bg-surface-hover rounded-md px-2 py-1 text-xs font-semibold transition-colors"
                        @click="setNow">
                        {{ $lang.now || 'Now' }}
                    </button>
                    <button
                        type="button"
                        class="bg-schedule-brand-blue rounded-md px-4 py-1.5 text-xs font-semibold text-white transition-colors"
                        @click="open = false">
                        {{ $lang.done || 'Done' }}
                    </button>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.schedule-time-col::-webkit-scrollbar {
    width: 5px;
}
.schedule-time-col::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    background: rgb(148 163 184 / 0.4);
}
</style>
