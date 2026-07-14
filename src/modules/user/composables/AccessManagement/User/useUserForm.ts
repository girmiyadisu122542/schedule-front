import { ref, computed, watch } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import type { User, UserDetail } from '@/modules/user/types/AccessManagement/User/UserType';

export function useUserForm(
    props: {
        user: User;
        userDetail: UserDetail;
    },
    emit: any
) {
    const { customizeLanguageData } = useLanguageStore();
    const userDetailForm = ref<UserDetail>({ ...props.userDetail });
    const selectedImageFile = ref<File | null>(null);
    const userForm = ref<User>({ ...props.user });
    const photoFile = ref<File | null>(null);
    const showImageEditor = ref(false);
    const editApplied = ref(false);
    const showToast = ref(false);
    const toastMessage = ref('');

    watch(
        () => props.user,
        (val) => (userForm.value = { ...val })
    );

    watch(
        () => props.userDetail,
        (val) => (userDetailForm.value = { ...val })
    );

    const currentImageSrc = computed(() =>
        photoFile.value ? URL.createObjectURL(photoFile.value) : userForm.value.photo || ''
    );

    const updateUser = (updates: Partial<User>) => {
        userForm.value = { ...userForm.value, ...updates };
        emit('update:user', userForm.value);
    };

    const updateUserDetail = (updates: Partial<UserDetail>) => {
        userDetailForm.value = { ...userDetailForm.value, ...updates };
        emit('update:userDetail', userDetailForm.value);
    };

    const verifyNationalId = async (nationalId: string) => {
        emit('verifyNationalId', nationalId);
        return !!nationalId;
    };

    const copy = async (value?: string) => {
        if (!value) return;

        await navigator.clipboard.writeText(value);

        toastMessage.value = customizeLanguageData('copied', 'Copied!');
        showToast.value = true;

        setTimeout(() => {
            showToast.value = false;
        }, 2000);
    };

    const removePhoto = () => {
        photoFile.value = null;
        updateUser({ photo: null });
    };

    const handlePhotoUpload = (file: File | null) => {
        if (!file) return;
        selectedImageFile.value = file;
        showImageEditor.value = true;
    };

    const handleFileInputChange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        selectedImageFile.value = file;
        showImageEditor.value = true;
        (e.target as HTMLInputElement).value = '';
    };

    const handleApplyEdit = async (dataUrl: string) => {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'edited-image.png', { type: 'image/png' });

        photoFile.value = file;
        emit('update:photoFile', file);

        editApplied.value = true;
        selectedImageFile.value = null;
        showImageEditor.value = false;
    };

    const handleDiscardEdit = () => {
        if (editApplied.value) {
            editApplied.value = false;
            return;
        }

        if (selectedImageFile.value) {
            photoFile.value = selectedImageFile.value;
            emit('update:photoFile', selectedImageFile.value);
        }

        selectedImageFile.value = null;
        showImageEditor.value = false;
    };

    return {
        selectedImageFile,
        showImageEditor,
        currentImageSrc,
        userDetailForm,
        toastMessage,
        editApplied,
        showToast,
        photoFile,
        userForm,
        copy,
        updateUser,
        removePhoto,
        handleApplyEdit,
        updateUserDetail,
        verifyNationalId,
        handleDiscardEdit,
        handlePhotoUpload,
        handleFileInputChange
    };
}
