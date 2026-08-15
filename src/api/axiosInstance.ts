import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'vue-sonner';

import { API_URL } from '@/constants';
import { ACCESS_TOKEN_KEY, LANGUAGE_KEY } from '@/config/appConfig';
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/constants/httpStatus';

const axiosInstance = axios.create({
    baseURL: API_URL
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = Cookies.get(ACCESS_TOKEN_KEY);
        const currentLanguage = Cookies.get(LANGUAGE_KEY);

        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (currentLanguage) config.headers.lang = currentLanguage;

        if (config.data instanceof FormData && config.method && ['put', 'patch'].includes(config.method)) {
            config.data.append('_method', config.method.toUpperCase());
            config.method = 'post';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Clear the session and send the user back to sign in.
 *
 * Only 401 reaches this. A 403 must NOT: the session is valid, the user simply
 * may not do that one thing.
 */
const endSession = () => {
    localStorage.removeItem('auth');
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(LANGUAGE_KEY);

    // Guard against a reload loop.
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

/**
 * The server's own message when it sent one, otherwise the localized default.
 *
 * The language store is read lazily — this module is imported before Pinia is
 * installed, so resolving it at module scope would throw.
 */
const forbiddenMessage = async (error: any): Promise<string> => {
    const serverMessage = error?.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
        return serverMessage;
    }

    try {
        const { useLanguageStore } = await import('@/stores/languageStore');
        return useLanguageStore().customizeLanguageData('youDoNotHavePermission', 'You do not have permission');
    } catch {
        return 'You do not have permission';
    }
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        if (status === HTTP_UNAUTHORIZED) {
            endSession();
        } else if (status === HTTP_FORBIDDEN) {
            // 403 used to be handled as 401: any permission denial anywhere in
            // the app wiped the token and bounced the user to the login screen,
            // which reads as being logged out at random. The session is fine —
            // say what was refused and leave the user where they are.
            toast.error(await forbiddenMessage(error));
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
