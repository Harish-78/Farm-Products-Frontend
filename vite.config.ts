import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars (including VITE_DEV_BACKEND_URL) from .env / .env.local
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          // Dev-only: forwards /api/* to your local backend.
          // Ignored on Vercel builds — production uses the api/index.js proxy.
          target: env.VITE_DEV_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  }
})