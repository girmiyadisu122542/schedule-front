<script setup lang="ts">
import { computed, toRefs, useSlots, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';

import MainLabel from '@/components/common/MainLabel.vue';

import { FALLBACK_COUNTRY_ICON, PHONE_TRUNK_PREFIX } from '@/config/appConfig';

/* ---------------- TYPES ---------------- */

type InputType =
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'search'
    | 'tel'
    | 'url'
    | 'color'
    | 'time'
    | 'date'
    | 'datetime-local';

type InputSize = 'small' | 'normal' | 'large';
type InputVariant = 'outlined' | 'filled' | 'none';
type MessageType = 'error' | 'success' | 'warning' | 'info';
type IconPosition = 'left' | 'right';
type ActionState = 'idle' | 'loading' | 'success' | 'error';

/* ---------------- PROPS ---------------- */

const props = defineProps<{
    modelValue?: any;
    type?: InputType;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    size?: InputSize;
    variant?: InputVariant;
    pt?: { root?: string; input?: string };
    message?: string;
    messageType?: MessageType;
    icon?: any;
    iconPosition?: IconPosition;
    clearable?: boolean;

    labelText?: string;
    label?: string;
    isRequired?: boolean;
    helperMessage?: string;
    isFloating?: boolean;

    /* TEL */
    countries?: { name: string; code: string; dial_code: string; flag?: string }[];
    defaultCountry?: string;

    /* ACTION */
    actionHandler?: (value: any) => Promise<boolean> | boolean;
    actionButtonText?: string;
    showStatusIcon?: boolean;
    icons?: {
        default?: any;
        success?: any;
        error?: any;
    };
}>();

const emit = defineEmits(['update:modelValue', 'input', 'blur', 'focus']);
const slots = useSlots();

const { modelValue, invalid, size, variant, pt, icon, iconPosition, clearable, type } = toRefs(props);

/* ---------------- STATE ---------------- */

const isFocused = ref(false);

/* TEL */
const selectedCountry = ref(props.defaultCountry || '');
const isDropdownOpen = ref(false);
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });
const triggerRef = ref<HTMLElement | null>(null);

/* ACTION */
const actionState = ref<ActionState>('idle');

/* ---------------- COMPUTED ---------------- */

/**
 * The dial-code picker only earns its space when there are countries to pick.
 * This app ships no country catalogue (`useCommonData.fetchCountries` is a
 * no-op), so an unconditional `type="tel"` rendered a 🌍 button with a blank
 * dial code over an empty dropdown, and reserved `pl-20` for it.
 */
const hasCountryPicker = computed(() => props.type === 'tel' && !!props.countries?.length);
const hasPrefix = computed(() => hasCountryPicker.value || !!slots.prefix);
const hasSuffix = computed(() => !!slots.suffix || props.actionHandler || clearable.value || props.type === 'color');

const iconPos = computed<IconPosition>(() => iconPosition.value || 'left');

const showClear = computed(() => clearable.value && modelValue.value && String(modelValue.value).length > 0);

const currentStatusIcon = computed(() => {
    if (!props.showStatusIcon) return null;

    switch (actionState.value) {
        case 'success':
            return props.icons?.success;
        case 'error':
            return props.icons?.error;
        default:
            return props.icons?.default;
    }
});

/* ---------------- STYLES ---------------- */

const sizeClasses = computed(() => {
    switch (size.value) {
        case 'small':
            return 'text-sm px-2 py-1 h-8';
        case 'large':
            return 'text-base px-4 py-3 h-12';
        default:
            return 'text-base px-3 py-2 h-10';
    }
});

const variantClasses = computed(() => {
    if (variant.value === 'filled') {
        return 'placeholder:text-schedule-text-tertiary placeholder:text-base bg-schedule-generic-white dark:bg-gray-800 py-3.5 border border-schedule-border-primary dark:border-gray-700 text-schedule-text-primary text-base font-normal dark:text-white focus:bg-white dark:focus:bg-gray-700';
    }
    if (variant.value === 'none') {
        return 'placeholder:text-schedule-text-tertiary placeholder:text-base bg-transparent py-3.5 border border-transparent text-schedule-text-primary text-base font-normal dark:text-white focus:outline-none';
    }
    // outlined
    return 'placeholder:text-schedule-text-tertiary placeholder:text-base bg-schedule-generic-white dark:bg-gray-900 py-3.5 border border-schedule-border-primary dark:border-gray-700 text-schedule-text-primary text-base text-normal dark:text-white focus:ring-[1px] focus:text-schedule-text-primary focus:shadow-xs focus:shadow-schedule-border-brand focus:ring-schedule-border-brand focus:outline-none dark:focus:text-white/70 dark:focus:ring-primary-500/70 dark:focus:border-primary-500/70 dark:hover:border-primary-500/70 transition duration-200 ease-in-out';
});

const invalidClasses = computed(() => (invalid.value ? 'border-red-500!' : ''));

const inputClasses = computed(() => {
    return [
        'w-full rounded-lg outline-none transition',
        sizeClasses.value,
        variantClasses.value,
        invalidClasses.value,
        hasPrefix.value ? 'pl-20' : props.icon && iconPos.value === 'left' ? 'pl-10' : 'pl-3',
        hasSuffix.value ? 'pr-24' : props.icon && iconPos.value === 'right' ? 'pr-10' : 'pr-3'
    ].join(' ');
});

/* ---------------- HANDLERS ---------------- */

function onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value.trimStart();
    emit('update:modelValue', value);
}

function updateModelWithTel(fullNumber: string) {
    const mv = modelValue.value;
    if (mv && typeof mv === 'object') {
        const keys = ['phone', 'value', 'number', 'tel'];
        const key = keys.find((k) => (k in mv) as any) as string | undefined;
        const newObj = { ...(mv as any) } as any;
        if (key) {
            newObj[key] = fullNumber;
        } else {
            newObj.phone = fullNumber;
        }

        if ('country' in newObj) newObj.country = selectedCountry.value;

        emit('update:modelValue', newObj);
        return;
    }

    emit('update:modelValue', fullNumber);
}

function onTelInput(e: Event) {
    // User input is the local part (without dial code) shown in the input
    let number = (e.target as HTMLInputElement).value.replace(/\s+/g, '');
    const country = props.countries?.find((c) => c.code === selectedCountry.value);

    const dialCode = country?.dial_code || '';

    // If user pasted a full number including dial code, remove only the leading dial code
    if (dialCode && number.startsWith(dialCode)) {
        number = number.slice(dialCode.length);
    }

    if (dialCode && number.startsWith(PHONE_TRUNK_PREFIX)) {
        number = number.slice(PHONE_TRUNK_PREFIX.length);
    }

    const full = `${dialCode}${number}`;
    updateModelWithTel(full);
}

function onClear() {
    emit('update:modelValue', '');
}

async function handleAction() {
    if (!props.actionHandler) return;

    actionState.value = 'loading';

    try {
        const result = await props.actionHandler(props.modelValue);
        actionState.value = result ? 'success' : 'error';
    } catch {
        actionState.value = 'error';
    }
}

/* ---------------- DROPDOWN ---------------- */

function updateDropdownPosition() {
    if (!triggerRef.value) return;

    const rect = triggerRef.value.getBoundingClientRect();

    dropdownPosition.value = {
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width
    };

    const dropdownHeight = 240;
    const viewportHeight = window.innerHeight;
    if (dropdownPosition.value.top + dropdownHeight > viewportHeight) {
        dropdownPosition.value.top = Math.max(8, rect.top - dropdownHeight - 6);
    }
}

async function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
    await nextTick();
    if (isDropdownOpen.value) updateDropdownPosition();
}

function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;

    if (!target.closest('.tel-trigger') && !target.closest('.tel-dropdown')) {
        isDropdownOpen.value = false;
    }
}
function extractPhoneRaw() {
    const mv = modelValue.value;
    if (mv === null || mv === undefined) return '';
    if (typeof mv === 'object') {
        const keys = ['phone', 'value', 'number', 'tel'];
        for (const k of keys) {
            if (k in mv) return String((mv as any)[k] ?? '');
        }
        return '';
    }
    return String(mv);
}

const getTelNumberPart = computed(() => {
    const raw = extractPhoneRaw();
    if (!raw) return '';

    // Prefer selected country dial code if available, otherwise try to detect from value
    let country = props.countries?.find((c) => c.code === selectedCountry.value);
    if (!country) {
        country = props.countries?.find((c) => raw.startsWith(c.dial_code));
    }

    const dialCode = country?.dial_code || '';

    // Remove only leading dialCode
    if (dialCode && raw.startsWith(dialCode)) {
        return raw.slice(dialCode.length);
    }

    return raw;
});

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    if (props.type === 'tel' && modelValue.value && props.countries) {
        const match = props.countries.find((c) => String(modelValue.value).startsWith(c.dial_code));

        if (match) {
            selectedCountry.value = match.code;
        }
    }
});

/* Default to first country when countries load asynchronously */
watch(
    () => props.countries,
    (newCountries) => {
        if (props.type !== 'tel' || !newCountries?.length) return;

        if (modelValue && modelValue.value !== undefined) {
            const raw = String(modelValue.value);
            const match = newCountries.find((c) => raw.startsWith(c.dial_code));
            if (match) {
                selectedCountry.value = match.code;
                return;
            }
        }

        const hasMatch = newCountries.some((c) => c.code === selectedCountry.value);
        if (!hasMatch) {
            const firstCountry = newCountries[0];
            if (firstCountry) {
                selectedCountry.value = firstCountry.code;
            }
        }
    },
    { immediate: true }
);

watch(
    () => selectedCountry.value,
    (newCode, oldCode) => {
        if (props.type !== 'tel' || !props.countries?.length) return;

        const oldCountry = props.countries.find((c) => c.code === oldCode);
        const newCountry = props.countries.find((c) => c.code === newCode);
        const oldDial = oldCountry?.dial_code || '';
        const newDial = newCountry?.dial_code || '';

        const raw = String(modelValue.value || '');
        const local = oldDial && raw.startsWith(oldDial) ? raw.slice(oldDial.length) : raw;

        emit('update:modelValue', `${newDial}${local}`);
    }
);

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div class="w-full">
        <MainLabel
            :isRequired="props.isRequired"
            :labelText="props.label || props.labelText"
            :helperMessage="props.helperMessage" />

        <div class="relative">
            <!-- TEL PREFIX -->
            <div
                v-if="hasCountryPicker"
                class="absolute inset-y-0 left-0 flex items-center pl-2">
                <div
                    ref="triggerRef"
                    class="tel-trigger z-20">
                    <button
                        type="button"
                        @click.stop="toggleDropdown"
                        class="flex items-center gap-1 text-sm">
                        {{
                            countries?.find((c) => c.code === selectedCountry)?.flag ||
                            countries?.find((c) => c.code === selectedCountry)?.code ||
                            FALLBACK_COUNTRY_ICON
                        }}
                        <span class="text-xs">
                            {{ countries?.find((c) => c.code === selectedCountry)?.dial_code }}
                        </span>
                    </button>
                </div>

                <!-- TELEPORT -->
                <teleport to="body">
                    <div
                        v-if="isDropdownOpen"
                        class="tel-dropdown pointer-events-auto fixed max-h-60 overflow-auto rounded-lg border border-gray-300 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
                        :style="{
                            position: 'fixed',
                            top: dropdownPosition.top + 'px',
                            left: dropdownPosition.left + 'px',
                            zIndex: 99999,
                            transform: 'none',
                            minWidth: dropdownPosition.width + 'px'
                        }">
                        <div
                            v-for="c in countries"
                            :key="c.code"
                            @click="
                                selectedCountry = c.code;
                                isDropdownOpen = false;
                            "
                            class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                            {{ c.flag }} {{ c.name }} ({{ c.dial_code }})
                        </div>
                    </div>
                </teleport>
            </div>

            <!-- INPUT -->
            <input
                v-if="type !== 'tel'"
                :type="type === 'color' ? 'text' : type"
                :value="modelValue"
                :placeholder="type === 'color' ? '#000000' : placeholder"
                :disabled="props.disabled"
                @input="onInput"
                :class="[
                    inputClasses,
                    'py-6',
                    props.disabled ? 'cursor-not-allowed bg-gray-100 opacity-60 dark:bg-gray-800' : ''
                ]" />
            <!--
                Carries the placeholder like every other branch. Without a
                country picker there is no dial-code prefix to imply the
                expected shape, so the hint is the only thing telling the user
                what a valid number looks like.
            -->
            <input
                v-else
                type="tel"
                :value="getTelNumberPart"
                :placeholder="placeholder"
                :disabled="props.disabled"
                @input="onTelInput"
                :class="[
                    inputClasses,
                    'py-6',
                    props.disabled ? 'cursor-not-allowed bg-gray-100 opacity-60 dark:bg-gray-800' : ''
                ]" />

            <div
                v-if="icon && iconPos === 'left'"
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <component
                    :is="icon"
                    class="h-5 w-5" />
            </div>
            <div
                v-if="icon && iconPos === 'right'"
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <component
                    :is="icon"
                    class="h-5 w-5" />
            </div>

            <!-- RIGHT SIDE -->
            <div
                v-if="hasSuffix"
                class="absolute inset-y-0 right-0 flex items-center gap-2 pr-2">
                <div
                    v-if="type === 'color'"
                    class="relative flex items-center">
                    <label
                        :style="{ backgroundColor: modelValue || '#000000' }"
                        class="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 shadow-sm transition-transform active:scale-95">
                        <input
                            type="color"
                            :value="modelValue || '#000000'"
                            @input="onInput"
                            class="sr-only" />
                    </label>
                </div>
                <component
                    v-if="currentStatusIcon"
                    :is="currentStatusIcon"
                    class="h-4 w-4" />
                <slot name="suffix" />
                <button
                    v-if="actionHandler"
                    @click="handleAction"
                    type="button"
                    class="bg-primary-500 rounded px-2 py-1 text-xs text-white">
                    {{ actionButtonText || 'Check' }}
                </button>

                <button
                    v-if="showClear"
                    @click.stop="onClear"
                    class="text-xs text-gray-400">
                    ✕
                </button>
            </div>
        </div>

        <!-- MESSAGE -->
        <p
            v-if="message"
            class="text-schedule-text-tertiary mt-1.5 text-xs font-normal"
            :class="{
                'text-red-500!': messageType === 'error',
                'text-green-500!': messageType === 'success'
            }">
            {{ message }}
        </p>
    </div>
</template>
