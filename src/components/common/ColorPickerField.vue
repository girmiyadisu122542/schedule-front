<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

/**
 * Reusable colour picker field: a swatch trigger that opens a panel with a native
 * gradient picker, HEX + R/G/B inputs, a preset palette and recent colours
 * (persisted). The panel is TELEPORTED to <body> with fixed positioning so it is
 * never clipped by an ancestor's overflow (e.g. a dialog body's overflow-y:auto)
 * and always paints above modals. Drop-in replacement for the ad-hoc
 * `<input type="color"> + hex` pairs across the app.
 */
const props = withDefaults(
    defineProps<{
        modelValue?: string | null;
        label?: string;
        invalid?: boolean;
        message?: string;
        swatches?: string[];
    }>(),
    {
        modelValue: '#3B82F6',
        label: '',
        invalid: false,
        message: '',
        swatches: () => [
            '#0B529C',
            '#3B82F6',
            '#06B6D4',
            '#22C55E',
            '#84CC16',
            '#EAB308',
            '#F59E0B',
            '#EF4444',
            '#EC4899',
            '#8B5CF6',
            '#6366F1',
            '#64748B'
        ]
    }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const RECENT_KEY = 'schedule:recentColors';
const PANEL_WIDTH = 288; // w-72
const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const recents = ref<string[]>([]);
const pos = ref<{ top: number; left: number }>({ top: 0, left: 0 });

function normalizeHex(input: string | null | undefined): string {
    if (!input) return '';
    let hex = input.trim().replace(/^#?/, '');
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
        hex = hex
            .split('')
            .map((char) => char + char)
            .join('');
    }
    return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toUpperCase()}` : '';
}

const value = computed(() => normalizeHex(props.modelValue) || '#3B82F6');

const rgb = computed(() => {
    const hex = value.value.replace('#', '');
    return {
        r: parseInt(hex.slice(0, 2), 16) || 0,
        g: parseInt(hex.slice(2, 4), 16) || 0,
        b: parseInt(hex.slice(4, 6), 16) || 0
    };
});

function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel || 0)));
    return `#${[clamp(r), clamp(g), clamp(b)]
        .map((channel) => channel.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`;
}

const panelStyle = computed(() => ({
    position: 'fixed' as const,
    top: `${pos.value.top}px`,
    left: `${pos.value.left}px`,
    zIndex: 100000
}));

const place = (): void => {
    const rect = trigger.value?.getBoundingClientRect();
    if (!rect) return;
    const gap = 8;
    const panelHeight = panel.value?.offsetHeight ?? 320;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = rect.bottom + gap;
    if (viewportHeight - rect.bottom < panelHeight + gap && rect.top > panelHeight + gap) {
        top = rect.top - panelHeight - gap; // flip above when there isn't room below
    }
    let left = rect.left;
    if (left + PANEL_WIDTH > viewportWidth - 8) left = viewportWidth - PANEL_WIDTH - 8;
    if (left < 8) left = 8;
    pos.value = { top, left };
};

const setColor = (hex: string): void => {
    const normalized = normalizeHex(hex);
    if (normalized) emit('update:modelValue', normalized);
};
const onHexInput = (raw: string): void => setColor(raw);
const onChannel = (channel: 'r' | 'g' | 'b', raw: string): void => {
    const next = { ...rgb.value, [channel]: Number(raw) };
    emit('update:modelValue', rgbToHex(next.r, next.g, next.b));
};
const pickSwatch = (hex: string): void => setColor(hex);

const loadRecents = (): void => {
    try {
        const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        if (Array.isArray(stored)) recents.value = stored.slice(0, 8);
    } catch {
        recents.value = [];
    }
};
const rememberRecent = (hex: string): void => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    recents.value = [normalized, ...recents.value.filter((color) => color !== normalized)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.value));
};

const toggle = (): void => {
    open.value = !open.value;
};

watch(open, (isOpen) => {
    if (isOpen) {
        nextTick(() => {
            place();
            window.addEventListener('scroll', place, true);
            window.addEventListener('resize', place);
        });
    } else {
        rememberRecent(value.value);
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

onMounted(() => {
    loadRecents();
    document.addEventListener('mousedown', onDocPointer);
});
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
            class="border-border-default bg-surface-card hover:border-border-strong flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
            :class="invalid ? 'border-schedule-error-strong' : ''"
            @click="toggle">
            <span
                class="border-border-subtle h-7 w-7 shrink-0 rounded-md border"
                :style="{ backgroundColor: value }" />
            <span class="text-text-primary font-mono text-sm">{{ value }}</span>
            <i class="fas fa-chevron-down text-text-muted ml-auto text-xs" />
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
                class="bg-surface-card border-border-default w-72 rounded-2xl border p-4 shadow-xl"
                :style="panelStyle">
                <div class="flex items-center gap-3">
                    <label
                        class="border-border-subtle relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border">
                        <span
                            class="block h-full w-full"
                            :style="{ backgroundColor: value }" />
                        <input
                            :value="value"
                            type="color"
                            class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            @input="setColor(($event.target as HTMLInputElement).value)" />
                    </label>
                    <div class="flex-1 space-y-2">
                        <div>
                            <p class="text-text-tertiary mb-1 text-[11px] font-semibold tracking-wide uppercase">HEX</p>
                            <input
                                :value="value"
                                class="border-border-default bg-surface-subtle text-text-primary focus:border-border-strong h-8 w-full rounded-md border px-2 font-mono text-sm uppercase outline-none"
                                @change="onHexInput(($event.target as HTMLInputElement).value)" />
                        </div>
                        <div class="grid grid-cols-3 gap-1.5">
                            <div
                                v-for="channel in ['r', 'g', 'b'] as const"
                                :key="channel">
                                <p class="text-text-tertiary mb-1 text-center text-[11px] font-semibold uppercase">
                                    {{ channel }}
                                </p>
                                <input
                                    :value="rgb[channel]"
                                    type="number"
                                    min="0"
                                    max="255"
                                    class="border-border-default bg-surface-subtle text-text-primary focus:border-border-strong h-8 w-full rounded-md border text-center text-sm tabular-nums outline-none"
                                    @input="onChannel(channel, ($event.target as HTMLInputElement).value)" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <p class="text-text-tertiary mb-1.5 text-[11px] font-semibold tracking-wide uppercase">
                        {{ $lang.presets || 'Presets' }}
                    </p>
                    <div class="grid grid-cols-6 gap-1.5">
                        <button
                            v-for="swatch in swatches"
                            :key="swatch"
                            type="button"
                            class="h-7 w-full rounded-md transition hover:scale-110"
                            :class="
                                value.toUpperCase() === swatch.toUpperCase()
                                    ? 'ring-schedule-brand-blue ring-2 ring-offset-1'
                                    : ''
                            "
                            :style="{ backgroundColor: swatch }"
                            @click="pickSwatch(swatch)" />
                    </div>
                </div>

                <div
                    v-if="recents.length"
                    class="mt-3">
                    <p class="text-text-tertiary mb-1.5 text-[11px] font-semibold tracking-wide uppercase">
                        {{ $lang.recentColors || 'Recent' }}
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                        <button
                            v-for="color in recents"
                            :key="color"
                            type="button"
                            class="border-border-subtle h-6 w-6 rounded-md border transition hover:scale-110"
                            :style="{ backgroundColor: color }"
                            @click="pickSwatch(color)" />
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
