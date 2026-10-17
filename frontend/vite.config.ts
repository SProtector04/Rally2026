import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Inside Docker the backend is reached by its service name; locally by localhost.
    // Set VITE_PROXY_TARGET when running under docker-compose.dev.yml.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: (process.env.VITE_PROXY_TARGET ?? 'http://localhost:8000').replace(/^http/, 'ws'),
        ws: true,
      },
    },
    // Windows + Docker Desktop bind mounts don't emit reliable fs events,
    // so poll when CHOKIDAR_USEPOLLING is set by the dev compose file.
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
  },
})
