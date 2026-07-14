import './assets/style.css';
import './assets/fontawesome/css/all.css';

import { createApp } from 'vue';

import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persistedstate';

import App from './App.vue';
import router from './router';

import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useLanguageStore } from '@/stores/languageStore';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersist);

app.use(pinia);
app.use(router);

const allowedRoutesStore = useAllowedRoutesStore();
const languageStore = useLanguageStore();

app.config.globalProperties.$can = allowedRoutesStore.can;
Object.defineProperty(app.config.globalProperties, '$lang', {
    get: () => languageStore.translations
});

app.mount('#app');
