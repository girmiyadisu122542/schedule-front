<script setup lang="ts">
import Close from '@/assets/icons/Close.vue';
import Editor from '@/components/common/Editor.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainDialog from '@/components/common/MainDialog.vue';
import ImageEditor from '@/components/common/ImageEditor.vue';
import AvatarWithBtn from '@/components/common/AvatarWithBtn.vue';
import { useCommonData } from '@/composables/common/useCommonData';
import DateTimePicker from '@/components/common/DateTimePicker.vue';
import ImageFileUpload from '@/components/common/ImageFileUpload.vue';
import { useUserForm } from '@/modules/user/composables/AccessManagement/User/useUserForm';
import type { User, UserDetail } from '@/modules/user/types/AccessManagement/User/UserType';
import { useRegisterUser } from '@/modules/user/composables/AccessManagement/User/useRegisterUser';
import { DEFAULT_COUNTRY_CODE, EXAMPLE_PHONE_NUMBER } from '@/config/appConfig';

const props = defineProps<{
    user: User;
    userDetail: UserDetail;
    errors?: Record<string, any>;
    clearError?: (field: string) => void;
}>();

const emit = defineEmits(['update:user', 'update:userDetail', 'update:photoFile', 'verifyNationalId']);

const {
    userForm,
    userDetailForm,
    currentImageSrc,
    showImageEditor,
    selectedImageFile,

    updateUser,
    updateUserDetail,
    verifyNationalId,
    removePhoto,
    handlePhotoUpload,
    handleFileInputChange,
    handleApplyEdit,
    handleDiscardEdit
} = useUserForm(props, emit);
const { genderOptions } = useRegisterUser();

const { countries } = useCommonData();
</script>

<template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
            class="bg-schedule-generic-white border-schedule-border-subtle dark:border-border-default dark:bg-surface-card space-y-4 rounded-2xl border px-6 py-6 lg:col-span-2">
            <h3 class="text-lg font-semibold">{{ $lang.userDetails || 'User Details' }}</h3>

            <div class="mb-8">
                <InputText
                    :labelText="$lang.nationalIdOptional || 'National ID (Optional)'"
                    v-model="userDetailForm.national_id"
                    :invalid="!!props.errors?.national_id"
                    :message="props.errors?.national_id || ''"
                    messageType="error"
                    :actionHandler="verifyNationalId"
                    :showStatusIcon="true"
                    :icons="{ success: CheckIcon, error: Close }"
                    :actionButtonText="$lang.verify || 'Verify'"
                    @update:modelValue="(value) => updateUserDetail({ national_id: value })"
                    @input="props.clearError?.('national_id')" />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="col-span-1 grid grid-cols-1 gap-3 sm:col-span-3 sm:grid-cols-3">
                    <InputText
                        :labelText="$lang.firstName || 'First Name'"
                        v-model="userForm.first_name"
                        :invalid="!!props.errors?.first_name"
                        :message="props.errors?.first_name || ''"
                        messageType="error"
                        @update:modelValue="(value) => updateUser({ first_name: value })"
                        @input="props.clearError?.('first_name')" />

                    <InputText
                        :labelText="$lang.lastName || 'Last Name'"
                        v-model="userForm.last_name"
                        :invalid="!!props.errors?.last_name"
                        :message="props.errors?.last_name || ''"
                        messageType="error"
                        @update:modelValue="(value) => updateUser({ last_name: value })"
                        @input="props.clearError?.('last_name')" />

                    <InputText
                        :labelText="$lang.middleName || 'Middle Name'"
                        v-model="userForm.middle_name"
                        :invalid="!!props.errors?.middle_name"
                        :message="props.errors?.middle_name || ''"
                        messageType="error"
                        @update:modelValue="(value) => updateUser({ middle_name: value })"
                        @input="props.clearError?.('middle_name')" />
                </div>

                <div class="col-span-1 grid grid-cols-1 gap-3 sm:col-span-3 sm:grid-cols-2">
                    <InputText
                        :labelText="$lang.email || 'Email'"
                        type="email"
                        v-model="userForm.email"
                        :invalid="!!props.errors?.email"
                        :message="props.errors?.email || ''"
                        messageType="error"
                        @update:modelValue="(value) => updateUser({ email: value })"
                        @input="props.clearError?.('email')" />

                    <InputText
                        :labelText="$lang.phone || 'Phone'"
                        type="tel"
                        :placeholder="EXAMPLE_PHONE_NUMBER"
                        v-model="userForm.phone"
                        :invalid="!!props.errors?.phone"
                        :message="props.errors?.phone || ''"
                        messageType="error"
                        :countries="countries"
                        :defaultCountry="DEFAULT_COUNTRY_CODE"
                        @update:modelValue="(value) => updateUser({ phone: value })"
                        @input="props.clearError?.('phone')" />

                    <MainSelect
                        :options="genderOptions"
                        optionLabel="name"
                        optionValue="id"
                        :labelText="$lang.gender || 'Gender'"
                        :placeholder="$lang.genderPlaceholder || 'Select Gender'"
                        v-model="userForm.gender"
                        :invalid="!!props.errors?.gender"
                        :message="props.errors?.gender || ''"
                        messageType="error"
                        @change="
                            (value) => {
                                updateUser({ gender: value });
                                props.clearError?.('gender');
                            }
                        " />

                    <DateTimePicker
                        v-model="userDetailForm.birth_date"
                        :labelText="$lang.dob || 'Date of Birth'"
                        :placeholder="$lang.dob"
                        :invalid="!!props.errors?.birth_date"
                        :message="props.errors?.birth_date || ''"
                        messageType="error"
                        @update:modelValue="
                            (value) => {
                                updateUserDetail({ birth_date: value });
                            }
                        "
                        @input="props.clearError?.('birth_date')"
                        class="w-full" />
                </div>
            </div>

            <div class="col-span-2">
                <label
                    for="bio"
                    class="dark:text-text-secondary my-4 block text-sm font-medium text-gray-700">
                    {{ $lang.bio || 'Bio (Optional)' }}
                </label>
                <Editor
                    v-model="userDetailForm.bio"
                    :minHeight="'50px'"
                    :maxHeight="'200px'"
                    @update:modelValue="(value) => updateUserDetail({ bio: value })" />
            </div>
        </div>

        <div
            class="bg-schedule-generic-white border-schedule-border-subtle dark:border-border-default dark:bg-surface-card h-fit space-y-4 rounded-2xl border px-6 py-6 lg:col-span-1">
            <AvatarWithBtn
                v-model="currentImageSrc"
                :title="$lang.editProfile || 'Edit Profile'"
                :buttons="[
                    { label: $lang.remove || 'Remove', event: 'remove', type: 'danger' },
                    { label: $lang.update || 'Update', type: 'file' }
                ]"
                @remove="removePhoto"
                @file-change="handlePhotoUpload" />

            <div class="mt-8">
                <ImageFileUpload
                    accept="image/*"
                    :maxSizeMB="5"
                    :actionLabel="$lang.clickToUpload || 'Click to upload'"
                    :title="$lang.orDragAndDrop || 'or drag and drop'"
                    :subtitle="$lang.uploadPhotoSubtitle || 'JPG, PNG up to 5MB'"
                    @update:modelValue="handlePhotoUpload" />
            </div>
        </div>

        <MainDialog
            v-model:visible="showImageEditor"
            modal
            :plain-background="true"
            :header="$lang.editYourPhoto || 'Edit Your Photo'"
            :subtitle="$lang.dragToCrop || 'Drag, zoom, rotate & crop'"
            :rounded="true"
            maxWidth="max-w-4xl"
            @update:visible="handleDiscardEdit">
            <ImageEditor
                :imageFile="selectedImageFile"
                cropShape="circle"
                @apply="handleApplyEdit"
                @discard="handleDiscardEdit" />
        </MainDialog>
    </div>
</template>
