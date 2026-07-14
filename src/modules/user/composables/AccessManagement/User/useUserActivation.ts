import { toast } from 'vue-sonner';

import axiosInstance from '@/api/axiosInstance';
import { ACTIVE_STATUS } from '@/config/appConfig';
import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';

export const useUserActivation = () => {
    const languageStore = useLanguageStore();
    const { customizeLanguageData } = languageStore;
    const allowedRoutesStore = useAllowedRoutesStore();

    const ensureUserActive = async (user: User | null | undefined): Promise<boolean> => {
        if (!user?.id) return false;

        if (Number(user.state) === ACTIVE_STATUS) return true;

        if (!allowedRoutesStore.can('changeUserState')) {
            toast.error(
                customizeLanguageData(
                    'cannotActivateUserNoPermission',
                    'This user is inactive. You do not have permission to activate them.'
                )
            );
            return false;
        }

        try {
            const response = await axiosInstance.put(`/user/change-state/${user.id}`, {
                state: ACTIVE_STATUS
            });

            const updated: User = response.data.data;
            user.state = updated?.state ?? ACTIVE_STATUS;
            if (updated?.status) user.status = updated.status;

            return true;
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    customizeLanguageData('unableToActivateUser', 'Unable to activate user')
            );
            return false;
        }
    };

    return { ensureUserActive };
};
