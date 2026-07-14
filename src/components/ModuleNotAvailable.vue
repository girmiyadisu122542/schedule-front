<script setup lang="ts">
import WarningIcon from '@/assets/icons/WarningIcon.vue';
import MainButton from '@/components/common/MainButton.vue';

interface Props {
    message: string;
    moduleName: string;
    goBackToModules: () => void;
}
const props = withDefaults(defineProps<Props>(), {
    message: '',
    moduleName: '',
    goBackToModules: () => {}
});
</script>

<template>
    <div class="flex min-h-100 flex-col items-center justify-center space-y-6 p-8 text-center">
        <div class="space-y-4">
            <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <WarningIcon />
            </div>

            <div class="space-y-2">
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    {{ moduleName }}
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ message }}
                </p>
            </div>

            <div class="pt-4">
                <MainButton
                    :label="$lang.goToModules || 'Goto to Modules'"
                    severity="primary"
                    @click="goBackToModules" />
            </div>
        </div>
    </div>
</template>
