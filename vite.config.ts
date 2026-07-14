import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), vueDevTools(), tailwindcss()],
    server: {
        watch: {
            usePolling: true,
            interval: 100
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    // qr-code-styling ships as a CJS/UMD bundle -- pre-bundle it so the default
    optimizeDeps: {
        include: ['qr-code-styling']
    }
});
