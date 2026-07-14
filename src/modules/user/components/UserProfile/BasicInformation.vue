<script setup lang="ts">
import { ref } from 'vue';

import { useUserProfile } from '@/modules/user/composables/UserProfile/useUserProfile';

import CoverPhoto from '@/modules/user/components/UserProfile/CoverPhoto.vue';
import Editor from '@/components/common/Editor.vue';
import MainButton from '@/components/common/MainButton.vue';
import DisplayContent from '@/components/common/DisplayContent.vue';

const { form, profile, isLoading, isSaving, genderLabel, saveBio } = useUserProfile();

const isEditingBio = ref(false);

const handleSaveBio = async () => {
    const ok = await saveBio();
    if (ok) isEditingBio.value = false;
};
</script>

<template>
    <div
        class="border-schedule-border-subtle overflow-hidden rounded-2xl border bg-white dark:border-gray-800 dark:bg-gray-900">
        <div
            v-if="isLoading"
            class="flex items-center justify-center py-24">
            <span class="text-schedule-text-tertiary text-sm">{{ $lang.loading || 'Loading...' }}</span>
        </div>
        <template v-else>
            <CoverPhoto />
            <div class="px-8 pb-8">
                <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div class="flex flex-col gap-1">
                        <span class="text-schedule-text-primary text-sm font-semibold dark:text-gray-300">
                            {{ $lang.gender }}
                        </span>
                        <span class="text-schedule-text-tertiary text-sm">{{ genderLabel }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-schedule-text-primary text-sm font-semibold dark:text-gray-300">
                            {{ $lang.dateOfBirth }}
                        </span>
                        <span class="text-schedule-text-tertiary text-sm">{{ profile?.dob || '-' }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-schedule-text-primary text-sm font-semibold dark:text-gray-300">
                            {{ $lang.email }}
                        </span>
                        <span class="text-schedule-text-tertiary text-sm">{{ profile?.email || '-' }}</span>
                    </div>

                    <div class="md:col-span-3">
                        <div class="items-center md:flex md:justify-between">
                            <span
                                class="text-schedule-text-secondary mb-3 block text-sm font-semibold dark:text-gray-300">
                                {{ $lang.bio }}
                            </span>
                            <div class="flex items-center gap-3">
                                <button
                                    v-if="isEditingBio"
                                    @click="isEditingBio = false"
                                    class="text-schedule-text-tertiary text-sm">
                                    {{ $lang.cancel }}
                                </button>
                                <button
                                    v-if="!isEditingBio"
                                    @click="isEditingBio = true"
                                    class="text-schedule-brand-blue text-sm">
                                    {{ $lang.edit }}
                                </button>
                                <MainButton
                                    v-if="isEditingBio"
                                    size="small"
                                    :loading="isSaving"
                                    :disabled="isSaving"
                                    :label="$lang.save || 'Save'"
                                    @click="handleSaveBio" />
                            </div>
                        </div>
                        <div
                            v-if="!isEditingBio"
                            class="border-schedule-border-primary rounded-2xl border bg-gray-50 px-6 py-3 
                                shadow-xs dark:border-gray-800 dark:bg-gray-800/50">
                            <p
                                v-if="!form.bio"
                                class="text-schedule-text-tertiary text-xs leading-relaxed dark:text-gray-400">
                                {{ $lang.noBioYet || 'No bio yet.' }}
                            </p>
                            <div v-else>
                                <DisplayContent :content="form.bio" />
                            </div>
                        </div>
                        <div v-else>
                            <Editor v-model="form.bio" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
