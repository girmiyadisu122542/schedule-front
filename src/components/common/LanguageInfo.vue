<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import ExclamationCircleIcon from '@/assets/icons/ExclamationCircleIcon.vue';

const languageStore = useLanguageStore();
const currentLang = ref(languageStore.getCurrentLang);

defineProps({
    edit: {
        type: Boolean,
        default: false
    },
    editMessage: {
        type: String,
        default: ''
    }
});

const languageTranslations = computed(() => {
    return (key?: string) => {
        return key?.replace(
            '{{!!}}',
            `<span class='font-bold pl-1 text-primary-500 underline dark:text-white/70'>${currentLang.value?.name}</span>`
        );
    };
});
</script>

<template>
    <div class="space-y-2">
        <div
            class="dark:bg-primary-500/10 dark:text-qmtOrange-500/70 mb-3 flex w-full items-center justify-between gap-4 rounded-md border border-yellow-500 bg-yellow-100 p-3 text-sm text-gray-800">
            <div class="flex w-12 items-center justify-center gap-2 rounded-md bg-yellow-500 py-2 text-white">
                <ExclamationCircleIcon class="h-8 w-8 self-center" />
            </div>
            <div
                class="w-full self-center"
                v-html="languageTranslations($lang.formSubmissionNote)"></div>
        </div>
        <div
            v-if="editMessage"
            class="border-input rounded-md border border-gray-200 px-3 py-2 dark:border-white/20">
            <div class="flex min-w-0 flex-col gap-2 text-lg font-bold text-gray-700 sm:flex-row dark:text-white/70">
                <span class="shrink-0">{{ $lang.editingForm }} :</span>
                <span
                    class="wrap-break-words min-w-0 overflow-hidden"
                    v-html="editMessage"></span>
            </div>
        </div>
    </div>
</template>
