<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { toast } from 'vue-sonner';

import axiosInstance from '@/api/axiosInstance';
import { use2FA } from '@/modules/user/composables/login/use2FA';

import CopyIcon from '@/assets/icons/CopyIcon.vue';
import MainButton from '@/components/common/MainButton.vue';

interface BackupCode {
    value: string;
    used: boolean;
}

const { regenerateBackupCodes, isSubmitting } = use2FA();

const codes = ref<BackupCode[]>([]);
const isLoading = ref(true);

const hasCodes = computed(() => codes.value.length > 0);
const unusedCount = computed(() => codes.value.filter((c) => !c.used).length);

onMounted(async () => {
    try {
        const response = await axiosInstance.get('/account/2fa/status');
        const raw = response.data?.backup_codes ?? [];
        codes.value = raw.map((c: any) => ({ value: c.value, used: c.used }));
    } catch {
    } finally {
        isLoading.value = false;
    }
});

const handleGenerate = async () => {
    const result = await regenerateBackupCodes();
    if (result) {
        codes.value = (result as any[]).map((c: any) =>
            typeof c === 'string' ? { value: c, used: false } : { value: c.value, used: c.used ?? false }
        );
    }
};

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied');
    } catch {
        toast.error('Failed to copy');
    }
};

const copyAll = () =>
    copyToClipboard(
        codes.value
            .filter((c) => !c.used)
            .map((c) => c.value)
            .join('\n')
    );
</script>

<template>
    <div
        class="bg-schedule-secondary border-schedule-border-subtle rounded-2xl border p-8 dark:border-gray-800 dark:bg-gray-800/50">
        <div class="mb-4 flex items-center justify-between">
            <h4 class="text-lg font-bold text-gray-900 dark:text-white">{{ $lang.backUpCode }}</h4>
            <span
                v-if="hasCodes"
                class="text-schedule-text-tertiary text-xs">
                {{ unusedCount }} {{ $lang.codesRemaining || 'remaining' }}
            </span>
        </div>

        <div
            v-if="isLoading"
            class="text-schedule-text-tertiary text-sm">
            {{ $lang.loading || 'Loading...' }}
        </div>

        <template v-else-if="!hasCodes">
            <p class="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {{ $lang.generateBackupCodesAndStore }}
            </p>
            <MainButton
                :label="$lang.generateBackupCode || 'Generate Backup Codes'"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="handleGenerate" />
        </template>

        <template v-else>
            <p class="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {{ $lang.screenShotCode }}
            </p>

            <div class="space-y-2">
                <div class="flex items-center justify-end">
                    <button
                        @click="copyAll"
                        class="text-schedule-text-tertiary hover:text-schedule-text-primary
                         flex items-center gap-1 text-xs transition-colors">
                        <span>{{ $lang.copyAll || 'Copy all' }}</span>
                        <CopyIcon class="h-4 w-4" />
                    </button>
                </div>

                <div class="bg-schedule-tertiary rounded-2xl p-6 dark:bg-gray-900/50">
                    <div class="grid grid-cols-1 gap-3">
                        <div
                            v-for="(code, index) in codes"
                            :key="index"
                            class="flex items-center gap-3">
                            <span
                                :class="[
                                    'font-mono text-base font-bold transition-all',
                                    code.used
                                        ? 'text-schedule-text-tertiary line-through opacity-60'
                                        : 'text-schedule-text-primary dark:text-white'
                                ]">
                                {{ code.value }}
                            </span>
                            <span
                                v-if="code.used"
                                class="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-bold
                                 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                                {{ $lang.used || 'Used' }}
                            </span>
                            <button
                                v-else
                                @click="copyToClipboard(code.value)"
                                class="hover:text-schedule-brand-blue text-schedule-text-tertiary ml-auto p-1">
                                <CopyIcon class="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                        <MainButton
                            :label="$lang.getNewCode || 'Get new codes'"
                            :loading="isSubmitting"
                            :disabled="isSubmitting"
                            size="small"
                            @click="handleGenerate" />
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
