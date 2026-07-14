<script setup lang="ts">
import { ref } from 'vue';

import { useUserProfile } from '@/modules/user/composables/UserProfile/useUserProfile';

import MainDialog from '@/components/common/MainDialog.vue';
import ImageEditor from '@/components/common/ImageEditor.vue';
import ImageFileUpload from '@/components/common/ImageFileUpload.vue';

import EditIcon from '@/assets/icons/EditIcon.vue';
import Location from '@/assets/icons/Location.vue';
import CameraIcon from '@/assets/icons/CameraIcon.vue';
import CalendarIcon from '@/assets/icons/Calendar.vue';
import NewsPaperIcon from '@/assets/icons/NewsPaperIcon.vue';
import defaultCoverImage from '@/assets/images/cover.png';

const { form, profile, fullName, roleLabel, locationLabel, updateAvatar, updateCoverPhoto } = useUserProfile();

const editTarget = ref<'avatar' | 'cover' | null>(null);
const showUploadDialog = ref(false);
const showImageEditor = ref(false);
const selectedImageFile = ref<File | null>(null);

const triggerAvatarUpload = () => {
    editTarget.value = 'avatar';
    showUploadDialog.value = true;
};

const triggerCoverUpload = () => {
    editTarget.value = 'cover';
    showUploadDialog.value = true;
};

const handlePhotoUpload = (file: File | null) => {
    if (!file) return;
    selectedImageFile.value = file;
    showUploadDialog.value = false;
    showImageEditor.value = true;
};

const handleDiscardEdit = () => {
    selectedImageFile.value = null;
    showImageEditor.value = false;
};

const handleApplyEdit = async (dataUrl: string) => {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'edited-image.png', { type: 'image/png' });

    if (editTarget.value === 'cover') {
        await updateCoverPhoto(file);
    } else {
        await updateAvatar(file);
    }

    showImageEditor.value = false;
    editTarget.value = null;
};

const avatarUrl = () => (typeof form.photo === 'string' ? form.photo : undefined);
const coverUrl = () => (typeof form.cover_photo === 'string' ? form.cover_photo : undefined);
</script>

<template>
    <div class="overflow-hidden">
        <div
            class="relative h-28 w-full bg-linear-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20">
            <img
                :src="coverUrl() || defaultCoverImage"
                class="h-full w-full object-cover opacity-60" />
            <button
                @click="triggerCoverUpload"
                class="bg-schedule-generic-white absolute right-6 bottom-4 z-10 flex items-center gap-2
                 rounded-md px-4 py-2 text-sm text-gray-700 shadow-sm backdrop-blur transition-all hover:bg-white">
                <CameraIcon class="h-4 w-4" />
                {{ $lang.updateCoverPhoto }}
            </button>
        </div>

        <div class="relative px-8">
            <div class="relative -mt-12 mb-4 flex justify-center">
                <div class="relative h-24 w-24 rounded-full dark:border-gray-900 dark:bg-gray-800">
                    <img
                        :src="avatarUrl() || 'https://i.pravatar.cc/150'"
                        class="h-full w-full rounded-full object-cover" />
                    <button
                        @click="triggerAvatarUpload"
                        class="bg-schedule-brand-blue hover:bg-schedule-brand-blue-hover absolute right-1 -bottom-1 flex h-8 w-8
                         items-center justify-center rounded-full text-white transition-colors">
                        <EditIcon class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div class="text-center">
                <h2 class="text-md text-schedule-text-secondary font-medium dark:text-white">{{ fullName || '-' }}</h2>
                <div
                    class="text-schedule-text-secondary mt-4 flex flex-wrap justify-center gap-6 text-sm font-normal dark:text-gray-400">
                    <span
                        v-if="roleLabel && roleLabel !== '-'"
                        class="flex items-center gap-2">
                        <NewsPaperIcon class="h-4 w-4" />
                        {{ roleLabel }}
                    </span>
                    <span
                        v-if="locationLabel && locationLabel !== '-'"
                        class="flex items-center gap-2">
                        <Location class="h-4 w-4" />
                        {{ locationLabel }}
                    </span>
                    <span
                        v-if="profile?.joined_date"
                        class="flex items-center gap-2">
                        <CalendarIcon class="h-4 w-4" />
                        {{ $lang.joined }} {{ profile.joined_date }}
                    </span>
                </div>
            </div>

            <hr class="border-schedule-border-subtle my-8 dark:border-gray-800" />
        </div>
    </div>

    <MainDialog
        v-model:visible="showUploadDialog"
        modal
        :header="$lang.uploadPhoto || 'Upload Photo'">
        <div class="p-4">
            <ImageFileUpload
                :maxSizeMB="5"
                accept="image/*"
                @update:modelValue="handlePhotoUpload" />
        </div>
    </MainDialog>

    <MainDialog
        v-model:visible="showImageEditor"
        modal
        :rounded="true"
        maxWidth="max-w-4xl"
        @update:visible="handleDiscardEdit">
        <ImageEditor
            v-if="selectedImageFile"
            :imageFile="selectedImageFile"
            :cropShape="editTarget === 'cover' ? 'rect' : 'circle'"
            @apply="handleApplyEdit"
            @discard="handleDiscardEdit" />
    </MainDialog>
</template>
