<script setup lang="ts">
import InputText from '@/components/common/InputText.vue';

const props = withDefaults(
    defineProps<{
        latitude?: number | string | null;
        longitude?: number | string | null;
        disabled?: boolean;
        title?: string;
        description?: string;
        latitudeLabel?: string;
        longitudeLabel?: string;
        latitudePlaceholder?: string;
        longitudePlaceholder?: string;
    }>(),
    {
        disabled: false,
        title: '',
        description: '',
        latitudeLabel: '',
        longitudeLabel: '',
        latitudePlaceholder: '',
        longitudePlaceholder: ''
    }
);

const emit = defineEmits<{
    (e: 'update:latitude', value: string | number | null): void;
    (e: 'update:longitude', value: string | number | null): void;
}>();
</script>

<template>
    <div class="rounded-[24px] border border-gray-200 bg-white p-6">
        <div class="mb-6">
            <h3
                v-if="title"
                class="text-[20px] font-semibold text-gray-900">
                {{ title }}
            </h3>

            <p
                v-if="description"
                class="mt-2 text-[16px] text-gray-500">
                {{ description }}
            </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
            <div>
                <label class="mb-2 block text-[16px] font-medium text-gray-700">
                    {{ latitudeLabel }}
                </label>
                <InputText
                    :model-value="latitude ?? ''"
                    type="text"
                    :disabled="disabled"
                    :placeholder="latitudePlaceholder"
                    @update:modelValue="emit('update:latitude', $event)" />
            </div>

            <div>
                <label class="mb-2 block text-[16px] font-medium text-gray-700">
                    {{ longitudeLabel }}
                </label>
                <InputText
                    :model-value="longitude ?? ''"
                    type="text"
                    :disabled="disabled"
                    :placeholder="longitudePlaceholder"
                    @update:modelValue="emit('update:longitude', $event)" />
            </div>
        </div>
    </div>
</template>
