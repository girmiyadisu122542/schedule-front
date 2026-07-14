<script setup>
import { ref, computed } from 'vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import { useCommonData } from '@/composables/common/useCommonData';
import { RECTANGLE } from '@/modules/user/constants/fixedValues';

const { translations } = useCommonData();

const props = defineProps({
    modelValue: String,
    title: String,
    buttons: {
        type: Array,
        default: () => [
            { label: 'Remove', event: 'remove', type: 'danger' },
            { label: 'Update', type: 'file' }
        ]
    },
    shapeType: {
        type: String,
        default: 'circle',
        validator: (value) => ['circle', 'rectangle'].includes(value)
    },
    deleteIconOnly: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'file-change', 'remove']);

const imageKey = ref(Date.now());

const resolvedTitle = computed(() => {
    return props.title || translations.value?.editProfilePicture || 'Edit Picture';
});

const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    emit('file-change', file);
    imageKey.value = Date.now();
};

const defaultBtnClass = (type) => {
    return (
        {
            danger: 'text-sm text-red-600 hover:underline',
            primary: 'text-sm text-blue-600 hover:underline'
        }[type] || 'text-sm text-gray-600 hover:underline'
    );
};

const avatarClasses = computed(() => {
    if (props.shapeType === 'rectangle') {
        return 'w-full h-40 sm:h-48 rounded-lg object-cover';
    }
    return 'h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover';
});
</script>

<template>
    <div class="w-full">
        <div
            :class="[
                'flex w-full gap-4',
                shapeType === RECTANGLE ? 'flex-col' : 'flex-col sm:flex-row sm:items-center'
            ]">
            <!-- Title (Rectangle) -->
            <div
                v-if="shapeType === RECTANGLE && resolvedTitle"
                class="w-full">
                <h4 class="mb-2 text-left text-sm font-medium">
                    {{ resolvedTitle }}
                </h4>
            </div>

            <!-- Avatar Wrapper -->
            <div class="relative flex w-full justify-center sm:block sm:w-auto sm:justify-start">
                <!-- Image -->
                <img
                    v-if="modelValue"
                    :key="imageKey"
                    :src="modelValue"
                    :class="avatarClasses" />

                <!-- No Image -->
                <div
                    v-else
                    :class="[
                        'border-schedule-tertiary flex items-center justify-center border border-dashed bg-white dark:bg-gray-800',
                        avatarClasses,
                        shapeType === 'circle' ? 'mx-auto' : ''
                    ]">
                    <span class="text-sm text-gray-400">
                        {{ $lang.noImage || 'No Image' }}
                    </span>
                </div>

                <!-- Delete Icon: only when an image is present -->
                <button
                    v-if="shapeType === RECTANGLE && modelValue"
                    type="button"
                    class="absolute top-2 right-2 z-10 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                    @click="$emit('remove')">
                    <TrashIcon class="h-4 w-4" />
                </button>
            </div>

            <!-- Right Section -->
            <div
                v-if="shapeType !== RECTANGLE"
                class="w-full flex-1 text-center sm:text-left">
                <h4
                    v-if="resolvedTitle"
                    class="mb-2 text-sm font-medium">
                    {{ resolvedTitle }}
                </h4>

                <div
                    v-if="!deleteIconOnly && buttons?.length"
                    class="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <template
                        v-for="(btn, index) in buttons"
                        :key="index">
                        <label
                            v-if="btn.type === 'file'"
                            class="cursor-pointer text-sm text-blue-600 hover:underline">
                            {{ btn.label }}
                            <input
                                type="file"
                                class="hidden"
                                accept="image/*"
                                @change="onFileChange" />
                        </label>

                        <button
                            v-else
                            type="button"
                            :class="btn.class || defaultBtnClass(btn.type)"
                            @click="$emit(btn.event)">
                            {{ btn.label }}
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
