<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { vOnClickOutside } from '@vueuse/components';
import { toEthiopian, toGregorian } from 'ethiopian-date';

/**
 * Dark-aware WEEK picker with a Gregorian (GC) / Ethiopian (EC) calendar
 * switcher -- the conversion logic is adapted from DateTimePicker.vue. The whole
 * Monday..Sunday band of the active week is highlighted; clicking any day emits
 * its GREGORIAN ISO (YYYY-MM-DD), so the host jumps the roster to that week no
 * matter which calendar is on screen. Self-contained trigger + popover that
 * closes on outside-click.
 */
const props = withDefaults(
    defineProps<{
        anchorIso: string; // a gregorian ISO (YYYY-MM-DD) inside the selected week
        label?: string;
        calendar?: 'GC' | 'EC';
    }>(),
    { label: '', calendar: 'GC' }
);

const emit = defineEmits<{
    (e: 'select', iso: string): void;
    (e: 'update:calendar', value: 'GC' | 'EC'): void;
}>();

type CalendarType = 'GC' | 'EC';
interface DayCell {
    day: number;
    iso: string;
}

const amharicMonths = ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
const gregorianMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];
const amharicDays = ['ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓር', 'ቅዳ', 'እሁ'];
const gregorianDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const open = ref(false);
const activeCalendar = computed<CalendarType>({
    get: () => (props.calendar === 'EC' ? 'EC' : 'GC'),
    set: (value) => emit('update:calendar', value)
});
const gregYear = ref(2000);
const gregMonth = ref(0); // 0-based
const ecYear = ref(1992);
const ecMonth = ref(1); // 1..13

function pad(value: number): string {
    return String(value).padStart(2, '0');
}
function isoFromYMD(year: number, month1: number, day: number): string {
    return `${year}-${pad(month1)}-${pad(day)}`;
}
function startOfWeekMonday(base: Date): Date {
    const date = new Date(base);
    const dow = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dow);
    date.setHours(0, 0, 0, 0);
    return date;
}

const now = new Date();
const todayIso = isoFromYMD(now.getFullYear(), now.getMonth() + 1, now.getDate());

const weekSet = computed<Set<string>>(() => {
    const set = new Set<string>();
    if (!props.anchorIso) return set;
    const monday = startOfWeekMonday(new Date(`${props.anchorIso}T00:00:00`));
    for (let index = 0; index < 7; index += 1) {
        const date = new Date(monday);
        date.setDate(date.getDate() + index);
        set.add(isoFromYMD(date.getFullYear(), date.getMonth() + 1, date.getDate()));
    }
    return set;
});

function syncCursorFromAnchor(): void {
    const date = props.anchorIso ? new Date(`${props.anchorIso}T00:00:00`) : new Date();
    gregYear.value = date.getFullYear();
    gregMonth.value = date.getMonth();
    const [ey, em] = toEthiopian(date.getFullYear(), date.getMonth() + 1, date.getDate());
    ecYear.value = ey;
    ecMonth.value = em;
}

const monthLabel = computed(() =>
    activeCalendar.value === 'EC'
        ? `${amharicMonths[ecMonth.value - 1]} ${ecYear.value}`
        : `${gregorianMonths[gregMonth.value]} ${gregYear.value}`
);
const weekdayHeader = computed(() => (activeCalendar.value === 'EC' ? amharicDays : gregorianDays));

const cells = computed<(DayCell | null)[]>(() => {
    const grid: (DayCell | null)[] = [];
    if (activeCalendar.value === 'EC') {
        const ey = ecYear.value;
        const em = ecMonth.value;
        const daysCount = em <= 12 ? 30 : ey % 4 === 3 ? 6 : 5;
        const [gy, gm, gd] = toGregorian(ey, em, 1);
        const firstDow = (new Date(gy, gm - 1, gd).getDay() + 6) % 7;
        for (let blank = 0; blank < firstDow; blank += 1) grid.push(null);
        for (let day = 1; day <= daysCount; day += 1) {
            const [cy, cm, cd] = toGregorian(ey, em, day);
            grid.push({ day, iso: isoFromYMD(cy, cm, cd) });
        }
        return grid;
    }
    const year = gregYear.value;
    const month0 = gregMonth.value;
    const firstDow = (new Date(year, month0, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    for (let blank = 0; blank < firstDow; blank += 1) grid.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) grid.push({ day, iso: isoFromYMD(year, month0 + 1, day) });
    return grid;
});

function shiftMonth(delta: number): void {
    if (activeCalendar.value === 'EC') {
        let month = ecMonth.value + delta;
        let year = ecYear.value;
        if (month > 13) {
            month = 1;
            year += 1;
        }
        if (month < 1) {
            month = 13;
            year -= 1;
        }
        ecMonth.value = month;
        ecYear.value = year;
        return;
    }
    const date = new Date(gregYear.value, gregMonth.value + delta, 1);
    gregYear.value = date.getFullYear();
    gregMonth.value = date.getMonth();
}

function setCalendar(type: CalendarType): void {
    if (type === activeCalendar.value) return;
    if (type === 'EC') {
        const mid = new Date(gregYear.value, gregMonth.value, 15);
        const [ey, em] = toEthiopian(mid.getFullYear(), mid.getMonth() + 1, mid.getDate());
        ecYear.value = ey;
        ecMonth.value = em;
    } else {
        const [gy, gm] = toGregorian(ecYear.value, ecMonth.value, 1);
        gregYear.value = gy;
        gregMonth.value = gm - 1;
    }
    activeCalendar.value = type;
}

function toggle(): void {
    if (!open.value) syncCursorFromAnchor();
    open.value = !open.value;
}
function close(): void {
    open.value = false;
}
function pick(iso: string): void {
    emit('select', iso);
    open.value = false;
}

watch(
    () => props.anchorIso,
    () => {
        if (open.value) syncCursorFromAnchor();
    }
);
onMounted(syncCursorFromAnchor);
</script>

<template>
    <div
        class="relative"
        v-on-click-outside="close">
        <button
            type="button"
            class="border-border-default text-text-primary hover:bg-surface-hover flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-bold tabular-nums transition-colors"
            @click="toggle">
            <i class="fas fa-calendar-day text-schedule-icon-brand text-xs"></i>
            {{ label }}
            <span
                class="bg-schedule-brand-blue/12 text-schedule-icon-brand rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                {{ activeCalendar }}
            </span>
            <i class="fas fa-chevron-down text-text-muted text-[10px]"></i>
        </button>

        <div
            v-if="open"
            class="bg-surface-card border-border-default absolute right-0 z-50 mt-2 w-[19rem] rounded-2xl border p-3 shadow-xl">
            <div class="mb-2 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="text-text-secondary hover:bg-surface-hover flex h-7 w-7 items-center justify-center rounded-md"
                        @click="shiftMonth(-1)">
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>
                    <span class="text-text-primary min-w-[7.5rem] text-center text-sm font-semibold">
                        {{ monthLabel }}
                    </span>
                    <button
                        type="button"
                        class="text-text-secondary hover:bg-surface-hover flex h-7 w-7 items-center justify-center rounded-md"
                        @click="shiftMonth(1)">
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
                <div
                    class="bg-surface-subtle relative flex shrink-0 rounded-lg p-0.5 text-[11px] font-bold"
                    role="tablist">
                    <span
                        class="bg-schedule-brand-blue absolute top-0.5 bottom-0.5 left-0.5 w-9 rounded-md shadow-sm transition-transform duration-200 ease-out"
                        :class="activeCalendar === 'EC' ? 'translate-x-9' : 'translate-x-0'"></span>
                    <button
                        type="button"
                        class="relative z-10 w-9 rounded-md py-1 text-center transition-colors"
                        :class="activeCalendar === 'GC' ? 'text-white' : 'text-text-tertiary hover:text-text-primary'"
                        @click="setCalendar('GC')">
                        GC
                    </button>
                    <button
                        type="button"
                        class="relative z-10 w-9 rounded-md py-1 text-center transition-colors"
                        :class="activeCalendar === 'EC' ? 'text-white' : 'text-text-tertiary hover:text-text-primary'"
                        @click="setCalendar('EC')">
                        EC
                    </button>
                </div>
            </div>

            <div class="mb-1 grid grid-cols-7 text-center">
                <span
                    v-for="weekday in weekdayHeader"
                    :key="weekday"
                    class="text-text-tertiary py-1 text-[10px] font-bold uppercase">
                    {{ weekday }}
                </span>
            </div>
            <div class="grid grid-cols-7 gap-0.5 text-center">
                <template
                    v-for="(cell, index) in cells"
                    :key="index">
                    <span v-if="!cell"></span>
                    <button
                        v-else
                        type="button"
                        class="relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs tabular-nums transition-colors"
                        :class="
                            weekSet.has(cell.iso)
                                ? 'bg-schedule-brand-blue font-bold text-white'
                                : 'text-text-secondary hover:bg-surface-hover'
                        "
                        @click="pick(cell.iso)">
                        {{ cell.day }}
                        <span
                            v-if="cell.iso === todayIso && !weekSet.has(cell.iso)"
                            class="bg-schedule-brand-blue absolute bottom-1 h-1 w-1 rounded-full"></span>
                    </button>
                </template>
            </div>

            <div class="border-border-subtle mt-2 flex justify-end border-t pt-2">
                <button
                    type="button"
                    class="text-schedule-brand-blue hover:bg-surface-hover rounded-md px-2 py-1 text-xs font-semibold"
                    @click="pick(todayIso)">
                    {{ $lang.thisWeek || 'This week' }}
                </button>
            </div>
        </div>
    </div>
</template>
