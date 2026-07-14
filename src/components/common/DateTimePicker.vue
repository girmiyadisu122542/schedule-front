<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { vOnClickOutside } from '@vueuse/components';
import { toEthiopian, toGregorian } from 'ethiopian-date';
import { computed, ref, watch, nextTick, onUnmounted } from 'vue';

import DateIcon from '@/assets/icons/DateIcon.vue';
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon.vue';

import MainLabel from '@/components/common/MainLabel.vue';

import { useLanguageStore } from '@/stores/languageStore';
import {
    DATE_PICKER_POPUP_HEIGHT as POPUP_HEIGHT,
    DATE_PICKER_POPUP_WIDTH as POPUP_WIDTH,
    DATE_PICKER_POPUP_Z_INDEX as POPUP_Z_INDEX,
    DATE_PICKER_POPUP_OFFSET as POPUP_OFFSET,
    DATE_PICKER_YEAR_RANGE as YEAR_RANGE,
    DATE_PICKER_MAX_HOUR as MAX_HOUR,
    DATE_PICKER_MAX_MINUTE as MAX_MINUTE,
    DATE_PICKER_MAX_SECOND as MAX_SECOND,
    STATUS_ERROR,
    STATUS_SUCCESS,
    STATUS_WARNING,
    STATUS_INFO,
    VARIANT_NONE,
    CALENDAR_TYPE,
    DATE_PICKER_VIEW,
    type CalendarType,
    type DatePickerView
} from '@/config/appConfig';
import { DEFAULT } from '@/modules/user/constants/fixedValues';

type MessageType = typeof STATUS_ERROR | typeof STATUS_SUCCESS | typeof STATUS_WARNING | typeof STATUS_INFO;

const ET_CAL = CALENDAR_TYPE.ETHIOPIAN;
const GR_CAL = CALENDAR_TYPE.GREGORIAN;

interface Props {
    modelValue?: string | null;
    labelText?: string;
    placeholder?: string;
    helperMessage?: string;
    required?: boolean;
    clearable?: boolean;
    showTime?: boolean;
    isRequired?: boolean;
    invalid?: boolean;
    message?: string;
    messageType?: MessageType;
    variant?: typeof DEFAULT | typeof VARIANT_NONE;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'mm/dd/yyyy',
    messageType: STATUS_ERROR,
    variant: DEFAULT
});

const { translations } = storeToRefs(useLanguageStore());

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | null): void;
    (e: 'change', value: string): void;
    (e: 'clear'): void;
}>();

const triggerClasses = computed(() => {
    const invalid = props.invalid || (props.isRequired && !props.modelValue);
    if (props.variant === VARIANT_NONE) {
        return invalid ? 'text-red-500' : '';
    }
    return [
        'focus:border-schedule-border-brand rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800',
        invalid ? 'border-red-500' : ''
    ];
});

const triggerRef = ref<HTMLElement | null>(null);
const floatingStyle = ref({
    top: '0px',
    left: '0px',
    width: `${POPUP_WIDTH}px`,
    position: 'fixed' as const,
    zIndex: POPUP_Z_INDEX,
    pointerEvents: 'auto' as const
});

const updatePosition = () => {
    if (triggerRef.value) {
        const rect = triggerRef.value.getBoundingClientRect();
        const popupHeight = POPUP_HEIGHT;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
            floatingStyle.value.top = `${rect.bottom + POPUP_OFFSET}px`;
        } else {
            floatingStyle.value.top = `${rect.top - popupHeight - POPUP_OFFSET}px`;
        }

        floatingStyle.value.left = `${rect.left}px`;
    }
};

const openView = async (view: DatePickerView) => {
    currentView.value = view;
    await nextTick();
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
};

const closeView = () => {
    currentView.value = null;
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
};

onUnmounted(() => closeView());

const currentView = ref<DatePickerView | null>(null);
const activeCalendar = ref<CalendarType>(GR_CAL);

const amharicMonths = ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
const amharicDays = ['እሁ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓር', 'ቅዳ'];
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
const gregorianDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const now = new Date();
const [ey, em, ed] = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());

const ethState = ref({ year: ey, month: em, day: ed });
const gregState = ref({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });
const timeState = ref({ hour: 0, minute: 0, second: 0 });

const pad = (input: number): string => String(input).padStart(2, '0');
const meridiem = computed(() => (timeState.value.hour >= 12 ? 'PM' : 'AM'));
const hour12 = computed(() => timeState.value.hour % 12 || 12);
function setHour12(value: number): void {
    const clamped = Math.max(1, Math.min(12, Math.floor(value || 0)));
    timeState.value.hour = (clamped % 12) + (timeState.value.hour >= 12 ? 12 : 0);
}
function setMinute(value: number): void {
    timeState.value.minute = Math.max(0, Math.min(59, Math.floor(value || 0)));
}
function stepHour(delta: number): void {
    let next = hour12.value + delta;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setHour12(next);
}
function stepMinute(delta: number): void {
    let next = timeState.value.minute + delta;
    if (next > 59) next = 0;
    if (next < 0) next = 59;
    timeState.value.minute = next;
}
function toggleMeridiem(): void {
    timeState.value.hour = (timeState.value.hour + 12) % 24;
}
// --- Original Computed ---
const daysHeader = computed(() => (activeCalendar.value === ET_CAL ? amharicDays : gregorianDays));
const monthsList = computed(() => (activeCalendar.value === ET_CAL ? amharicMonths : gregorianMonths));

const gridDates = computed(() => {
    if (activeCalendar.value === ET_CAL) {
        const daysCount = ethState.value.month <= 12 ? 30 : ethState.value.year % 4 === 3 ? 6 : 5;
        const [gy, gm, gd] = toGregorian(ethState.value.year, ethState.value.month, 1);
        const startDay = new Date(gy, gm - 1, gd).getDay();
        return [...Array(startDay).fill(null), ...Array.from({ length: daysCount }, (_, i) => i + 1)];
    } else {
        const daysCount = new Date(gregState.value.year, gregState.value.month + 1, 0).getDate();
        const startDay = new Date(gregState.value.year, gregState.value.month, 1).getDay();
        return [...Array(startDay).fill(null), ...Array.from({ length: daysCount }, (_, i) => i + 1)];
    }
});

const displayValue = computed(() => {
    if (!props.modelValue) return null;
    const base =
        activeCalendar.value === ET_CAL
            ? `${amharicMonths[ethState.value.month - 1]} ${ethState.value.day}, ${ethState.value.year}`
            : `${gregorianMonths[gregState.value.month]} ${gregState.value.day}, ${gregState.value.year}`;
    if (!props.showTime) return base;
    return `${base} · ${pad(hour12.value)}:${pad(timeState.value.minute)} ${meridiem.value}`;
});

const calendarTooltip = computed(() =>
    activeCalendar.value === GR_CAL
        ? translations.value.switchToEthiopianCalendar || 'Gregorian calendar — click to switch to Ethiopian'
        : translations.value.switchToGregorianCalendar || 'Ethiopian calendar — click to switch to Gregorian'
);

function toggleCalendar() {
    activeCalendar.value = activeCalendar.value === GR_CAL ? ET_CAL : GR_CAL;
}

function selectDate(day: number) {
    if (activeCalendar.value === ET_CAL) {
        ethState.value.day = day;
        const [gy, gm, gd] = toGregorian(ethState.value.year, ethState.value.month, day);
        gregState.value = { year: gy, month: gm - 1, day: gd };
    } else {
        gregState.value.day = day;
        const [ey2, em2, ed2] = toEthiopian(gregState.value.year, gregState.value.month + 1, day);
        ethState.value = { year: ey2, month: em2, day: ed2 };
    }
    if (!props.showTime) {
        commitChange();
        closeView();
    }
}

function commitChange() {
    const y = gregState.value.year;
    const m = String(gregState.value.month + 1).padStart(2, '0');
    const d = String(gregState.value.day).padStart(2, '0');
    let val = `${y}-${m}-${d}`;

    if (props.showTime) {
        const hh = String(timeState.value.hour).padStart(2, '0');
        const mm = String(timeState.value.minute).padStart(2, '0');
        const ss = String(timeState.value.second).padStart(2, '0');
        val += ` ${hh}:${mm}:${ss}`;
    }
    emit('update:modelValue', val);
    emit('change', val);
}

function nextMonth() {
    if (activeCalendar.value === ET_CAL) {
        if (ethState.value.month === 13) {
            ethState.value.month = 1;
            ethState.value.year++;
        } else ethState.value.month++;
    } else {
        if (gregState.value.month === 11) {
            gregState.value.month = 0;
            gregState.value.year++;
        } else gregState.value.month++;
    }
}

function prevMonth() {
    if (activeCalendar.value === ET_CAL) {
        if (ethState.value.month === 1) {
            ethState.value.month = 13;
            ethState.value.year--;
        } else ethState.value.month--;
    } else {
        if (gregState.value.month === 0) {
            gregState.value.month = 11;
            gregState.value.year--;
        } else gregState.value.month--;
    }
}

function setToday() {
    const [eyT, emT, edT] = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
    ethState.value = { year: eyT, month: emT, day: edT };
    gregState.value = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
    commitChange();
}

function clear() {
    emit('update:modelValue', null);
    emit('clear');
    closeView();
}

const yearsList = computed(() => {
    const currentYear = activeCalendar.value === ET_CAL ? ethState.value.year : gregState.value.year;
    const years = [];
    for (let i = currentYear - YEAR_RANGE; i <= currentYear + YEAR_RANGE; i++) {
        years.push(i);
    }
    return years;
});

function selectYear(year: number) {
    if (activeCalendar.value === ET_CAL) {
        ethState.value.year = year;
    } else {
        gregState.value.year = year;
    }
    currentView.value = DATE_PICKER_VIEW.DATE_TIME;
}

watch(
    () => props.modelValue,
    (val) => {
        if (!val) return;
        const parts = val.replace('T', ' ').split(' ');
        const dateString = parts[0] ?? '';
        const timeString = parts[1] ?? '';
        const dateSegments = dateString.split('-').map(Number);
        const y = dateSegments[0] ?? now.getFullYear();
        const m = dateSegments[1] ?? now.getMonth() + 1;
        const d = dateSegments[2] ?? now.getDate();

        gregState.value = { year: y, month: m - 1, day: d };
        const ethRes = toEthiopian(y, m, d);
        ethState.value = { year: ethRes[0] ?? ey, month: ethRes[1] ?? em, day: ethRes[2] ?? ed };

        if (timeString) {
            const segments = timeString.split(':');
            timeState.value = {
                hour: parseInt(segments[0] ?? '0', 10) || 0,
                minute: parseInt(segments[1] ?? '0', 10) || 0,
                second: parseInt(segments[2] ?? '0', 10) || 0
            };
        }
    },
    { immediate: true }
);
</script>

<template>
    <div
        class="relative w-full font-sans text-[#334155]"
        ref="triggerRef">
        <MainLabel
            :isRequired="props.isRequired"
            :labelText="props.labelText"
            :helperMessage="props.helperMessage" />

        <div class="relative flex items-center">
            <button
                type="button"
                @click="openView(DATE_PICKER_VIEW.DATE_TIME)"
                class="flex h-11 w-full items-center justify-between px-3 py-2 text-sm transition-all"
                :class="triggerClasses">
                <div class="flex items-center gap-2 truncate">
                    <DateIcon class="h-5 w-5 shrink-0 text-gray-400" />
                    <span :class="!displayValue ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'">
                        {{ displayValue || props.placeholder }}
                    </span>
                </div>
                <div class="group/cal relative shrink-0">
                    <div
                        role="button"
                        tabindex="0"
                        :title="calendarTooltip"
                        @click.stop="toggleCalendar"
                        class="text-schedule-text-tertiary dark:bg-schedule-brand-blue/15 dark:hover:bg-schedule-brand-blue/25 cursor-pointer rounded bg-gray-50 px-2 py-0.5 text-[10px] font-bold transition-colors hover:bg-blue-100">
                        {{ activeCalendar }}
                    </div>
                    <span
                        class="pointer-events-none absolute right-0 bottom-full z-9999 mb-2 hidden w-max max-w-[200px] rounded-md bg-gray-900 px-2 py-1 text-[11px] leading-snug font-normal text-white shadow-lg group-hover/cal:block dark:bg-gray-700">
                        {{ calendarTooltip }}
                    </span>
                </div>
            </button>
        </div>

        <Teleport to="body">
            <div
                v-if="currentView"
                v-on-click-outside="closeView"
                :style="floatingStyle"
                class="overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                <div v-if="currentView === DATE_PICKER_VIEW.DATE_TIME">
                    <div class="mb-4 flex items-center justify-between">
                        <div class="flex items-center gap-1">
                            <button
                                @click="currentView = DATE_PICKER_VIEW.MONTH"
                                class="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold hover:bg-gray-100">
                                {{
                                    activeCalendar === ET_CAL
                                        ? amharicMonths[ethState.month - 1]
                                        : gregorianMonths[gregState.month]
                                }}
                                <ArrowDownIcon class="h-3 w-3 opacity-50" />
                            </button>

                            <button
                                @click="currentView = DATE_PICKER_VIEW.YEAR"
                                class="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold hover:bg-gray-100">
                                {{ activeCalendar === ET_CAL ? ethState.year : gregState.year }}
                                <ArrowDownIcon class="h-3 w-3 opacity-50" />
                            </button>
                        </div>
                        <div class="flex gap-1">
                            <button
                                @click="prevMonth"
                                class="rounded-full p-1.5 hover:bg-gray-100">
                                ‹
                            </button>
                            <button
                                @click="nextMonth"
                                class="rounded-full p-1.5 hover:bg-gray-100">
                                ›
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-7 text-center">
                        <div
                            v-for="day in daysHeader"
                            :key="day"
                            class="py-2 text-[11px] font-bold text-gray-400 uppercase">
                            {{ day }}
                        </div>
                        <template
                            v-for="(date, idx) in gridDates"
                            :key="idx">
                            <div v-if="date === null"></div>
                            <button
                                v-else
                                type="button"
                                @click="selectDate(date)"
                                class="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors"
                                :class="[
                                    (activeCalendar === ET_CAL ? ethState.day === date : gregState.day === date)
                                        ? 'bg-[#0b529c] font-bold text-white shadow-md'
                                        : 'text-gray-700 hover:bg-blue-50'
                                ]">
                                {{ date }}
                            </button>
                        </template>
                    </div>
                    <div
                        v-if="showTime"
                        class="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <span class="text-[11px] font-bold tracking-wide text-gray-400 uppercase">
                            {{ $lang.time || 'Time' }}
                        </span>
                        <div class="flex items-center gap-1.5">
                            <div
                                class="flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    class="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    @click="stepHour(-1)">
                                    <i class="fas fa-minus text-[10px]"></i>
                                </button>
                                <input
                                    :value="pad(hour12)"
                                    inputmode="numeric"
                                    class="w-9 border-x border-gray-200 bg-transparent py-1 text-center text-sm font-semibold text-gray-900 tabular-nums outline-none dark:border-gray-700 dark:text-gray-100"
                                    @input="setHour12(Number(($event.target as HTMLInputElement).value))" />
                                <button
                                    type="button"
                                    class="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    @click="stepHour(1)">
                                    <i class="fas fa-plus text-[10px]"></i>
                                </button>
                            </div>
                            <span class="text-sm font-bold text-gray-400">:</span>
                            <div
                                class="flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    class="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    @click="stepMinute(-1)">
                                    <i class="fas fa-minus text-[10px]"></i>
                                </button>
                                <input
                                    :value="pad(timeState.minute)"
                                    inputmode="numeric"
                                    class="w-9 border-x border-gray-200 bg-transparent py-1 text-center text-sm font-semibold text-gray-900 tabular-nums outline-none dark:border-gray-700 dark:text-gray-100"
                                    @input="setMinute(Number(($event.target as HTMLInputElement).value))" />
                                <button
                                    type="button"
                                    class="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    @click="stepMinute(1)">
                                    <i class="fas fa-plus text-[10px]"></i>
                                </button>
                            </div>
                            <button
                                type="button"
                                class="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-[#0b529c] dark:bg-blue-500/15 dark:text-blue-300"
                                @click="toggleMeridiem">
                                {{ meridiem }}
                            </button>
                        </div>
                    </div>
                    <div class="border-schedule-border-subtle mt-4 flex items-center justify-between border-t pt-4">
                        <button
                            @click="setToday"
                            class="rounded-md border border-gray-200 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                            {{ $lang.today }}
                        </button>
                        <div class="flex gap-2">
                            <button
                                @click="clear"
                                class="text-xs text-gray-500 hover:underline">
                                {{ $lang.clear }}
                            </button>
                            <button
                                @click="
                                    commitChange();
                                    closeView();
                                "
                                class="rounded-md bg-[#0b529c] px-6 py-1.5 text-xs text-white">
                                {{ $lang.save }}
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    v-if="currentView === DATE_PICKER_VIEW.MONTH"
                    class="grid grid-cols-3 gap-2">
                    <button
                        v-for="(m, i) in monthsList"
                        :key="m"
                        @click="
                            activeCalendar === ET_CAL ? (ethState.month = i + 1) : (gregState.month = i);
                            currentView = DATE_PICKER_VIEW.DATE_TIME;
                        "
                        class="rounded-lg p-2 text-sm hover:bg-blue-50"
                        :class="
                            (activeCalendar === ET_CAL ? ethState.month === i + 1 : gregState.month === i)
                                ? 'bg-blue-100 font-bold'
                                : ''
                        ">
                        {{ m }}
                    </button>
                </div>

                <div
                    v-if="currentView === DATE_PICKER_VIEW.YEAR"
                    class="grid max-h-60 grid-cols-4 gap-2 overflow-y-auto p-1">
                    <button
                        v-for="year in yearsList"
                        :key="year"
                        @click="selectYear(year)"
                        class="rounded-lg p-2 text-sm hover:bg-blue-50"
                        :class="
                            (activeCalendar === ET_CAL ? ethState.year === year : gregState.year === year)
                                ? 'bg-blue-100 font-bold'
                                : ''
                        ">
                        {{ year }}
                    </button>
                </div>
            </div>
        </Teleport>
        <p
            v-if="message"
            class="mt-1 text-xs"
            :class="{
                'text-red-500': messageType === STATUS_ERROR,
                'text-green-500': messageType === STATUS_SUCCESS
            }">
            {{ message }}
        </p>
    </div>
</template>
