import { computed, onMounted, reactive, ref, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';

import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/modules/user/store/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { normalizeErrors, validateFormWithZod, type NormalizedErrors } from '@/utils/errorFormatter';
import { useUserProfileSchema, type UserProfileFields } from '@/modules/user/schemas/UserProfile/userProfileSchema';
import type { UserProfile, UserProfileForm } from '@/modules/user/types/UserProfile/userProfile';

const appendFormData = (formData: FormData, key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') {
        return;
    }

    const rawValue = toRaw(value);

    if (rawValue instanceof File || rawValue instanceof Blob) {
        formData.append(key, rawValue);
        return;
    }

    formData.append(key, String(rawValue));
};

export function useUserProfile() {
    const authStore = useAuthStore();
    const { translations } = storeToRefs(useLanguageStore());

    const profile = ref<UserProfile | null>(null);
    const isLoading = ref(false);
    const isSaving = ref(false);
    const errors = ref<NormalizedErrors<keyof UserProfileFields>>({});

    const form = reactive<UserProfileForm>({
        email: '',
        bio: '',
        photo: null,
        cover_photo: null
    });

    const syncProfile = (data: UserProfile | null) => {
        profile.value = data;
        form.email = data?.email || '';
        form.bio = data?.bio || '';
        form.photo = data?.photo || null;
        form.cover_photo = data?.cover_photo || null;
    };

    syncProfile((authStore.user as UserProfile | null) || null);

    watch(
        () => authStore.user,
        (user) => {
            syncProfile((user as UserProfile | null) || null);
        },
        { deep: true }
    );

    const fetchProfile = async () => {
        isLoading.value = true;

        try {
            const response = await axiosInstance.get('/account/me');
            const data = response.data.data as UserProfile;

            syncProfile(data);
            authStore.user = data;
        } catch (error: any) {
            toast.error(error.response?.data?.message || translations.value.somethingWentWrong || 'Something went wrong');
        } finally {
            isLoading.value = false;
        }
    };

    const submitProfile = async (payload: Partial<UserProfileForm>) => {
        errors.value = {};

        const candidate = {
            email: form.email,
            bio: payload.bio ?? form.bio,
            photo: payload.photo ?? form.photo,
            cover_photo: payload.cover_photo ?? form.cover_photo
        };

        const validationErrors = validateFormWithZod<keyof UserProfileFields>(useUserProfileSchema.value, candidate);

        if (validationErrors) {
            errors.value = validationErrors;
            return false;
        }

        isSaving.value = true;

        try {
            const formData = new FormData();

            appendFormData(formData, 'bio', candidate.bio);
            appendFormData(formData, 'photo', candidate.photo instanceof File ? candidate.photo : null);
            appendFormData(formData, 'cover_photo', candidate.cover_photo instanceof File ? candidate.cover_photo : null);

            const response = await axiosInstance.post('/account/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = response.data.data as UserProfile;
            syncProfile(data);
            authStore.user = data;
            toast.success(response.data.message || translations.value.userSuccessfullyUpdated || 'Profile updated successfully');

            return true;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                errors.value = normalizeErrors<keyof UserProfileFields>(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || translations.value.somethingWentWrong || 'Something went wrong');
            }

            return false;
        } finally {
            isSaving.value = false;
        }
    };

    const saveBio = async () => submitProfile({ bio: form.bio });

    const updateAvatar = async (file: File) => submitProfile({ photo: file });

    const updateCoverPhoto = async (file: File) => submitProfile({ cover_photo: file });

    const fullName = computed(() =>
        [profile.value?.first_name, profile.value?.middle_name, profile.value?.last_name].filter(Boolean).join(' ')
    );

    const roleLabel = computed(
        () => profile.value?.roles?.[0]?.display_name || profile.value?.roles?.[0]?.name || '-'
    );

    const locationLabel = computed(
        () => profile.value?.entity?.display_name || profile.value?.entity?.name || '-'
    );

    const genderLabel = computed(() => {
        const gender = profile.value?.gender;

        if (!gender) {
            return '-';
        }

        if (typeof gender === 'number') {
            return String(gender);
        }

        return gender.display_name || gender.label || gender.name || '-';
    });

    onMounted(() => {
        if (!profile.value) {
            fetchProfile();
        }
    });

    return {
        form,
        errors,
        profile,
        isLoading,
        isSaving,
        fullName,
        roleLabel,
        genderLabel,
        locationLabel,
        fetchProfile,
        saveBio,
        updateAvatar,
        updateCoverPhoto
    };
}
