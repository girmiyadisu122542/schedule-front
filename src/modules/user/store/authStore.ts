import { useRouter } from 'vue-router';
import { ref, watch } from 'vue';
import { defineStore, storeToRefs } from 'pinia';

import Cookies from 'js-cookie';
import { toast } from 'vue-sonner';
import axiosInstance from '@/api/axiosInstance';

import { ACCESS_TOKEN_KEY } from '@/config/appConfig';
import { HTTP_UNAUTHORIZED } from '@/constants/httpStatus';
import type { UserProfile } from '@/modules/user/types/UserProfile/userProfile';
import { useLanguageStore } from '@/stores/languageStore';

export const useAuthStore = defineStore(
    'auth',
    () => {
        type AuthUser = UserProfile & {
            username?: string;
            is_teacher?: boolean;
        };

        const user = ref<AuthUser | null>(null);
        const router = useRouter();

        const token = ref(Cookies.get(ACCESS_TOKEN_KEY) || null);
        const loadingUser = ref(false);
        const isInitialized = ref(false);
        const languageStore = useLanguageStore();
        const { translations } = storeToRefs(languageStore);
        const { customizeLanguageData } = languageStore;

        const rememberMe = ref<boolean>(false);

        const login = async (username: string, password: string) => {
            try {
                const response = await axiosInstance.post('/login', { username, password });
                const { token: newToken, mfa_required, email } = response.data;

                if (mfa_required) {
                    return { mfa_required: true, email };
                }

                Cookies.set(ACCESS_TOKEN_KEY, newToken);
                token.value = newToken;

                await initialize();
                return { mfa_required: false };
            } catch (error: any) {
                throw error.response?.data?.message || 'Login failed';
            }
        };

        const fetchUser = async () => {
            if (!token.value) return;

            loadingUser.value = true;
            try {
                const response = await axiosInstance.get('/account/me', {
                    headers: { Authorization: `Bearer ${token.value}` }
                });
                user.value = response.data.data;
                isInitialized.value = true;
            } catch (error: any) {
                // Only a rejected session is a reason to sign out. This used to
                // log out on ANY failure, so a 403, a 500 or a dropped network
                // connection all looked identical to an expired token and threw
                // the user back to the login screen.
                if (error?.response?.status === HTTP_UNAUTHORIZED) {
                    logout();
                    return;
                }

                toast.error(
                    error?.response?.data?.message ||
                        customizeLanguageData('unableToLoadProfile', 'Unable to load your profile. Please retry.')
                );
            } finally {
                loadingUser.value = false;
            }
        };

        const logout = async () => {
            try {
                if (token.value) await axiosInstance.post('/account/logout');
            } catch (error) {
            } finally {
                Cookies.remove(ACCESS_TOKEN_KEY);
                token.value = null;
                user.value = null;
                isInitialized.value = false;
                router.push('/login');
            }
        };

        const initialize = async () => {
            if (token.value && !isInitialized.value) await fetchUser();
        };

        watch(
            translations,
            (newTranslations) => {
                if (isInitialized.value) {
                    fetchUser();
                }
            },
            { immediate: true }
        );

        return {
            user,
            token,
            rememberMe,
            loadingUser,
            isInitialized,
            login,
            fetchUser,
            logout,
            initialize
        };
    },
    {
        persist: {
            key: 'auth',
            storage: localStorage
        }
    }
);
