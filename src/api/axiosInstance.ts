import axios from 'axios';
import Cookies from 'js-cookie';

import { API_URL } from '@/constants';
import { ACCESS_TOKEN_KEY, LANGUAGE_KEY } from '@/config/appConfig';

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

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('auth');
            Cookies.remove(ACCESS_TOKEN_KEY);
            Cookies.remove(LANGUAGE_KEY);

            // Guard against a reload loop.
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
