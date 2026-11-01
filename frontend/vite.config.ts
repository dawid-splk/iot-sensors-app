import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        // The backend serves both the API and (in production) this app from one origin.
        proxy: {
            '/api': 'http://localhost:8080',
        },
    },
})
