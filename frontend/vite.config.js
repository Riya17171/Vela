import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // In development the browser talks to Vite only; /api is forwarded to Express.
      // That keeps the refresh-token cookie first-party (SameSite=Lax works).
      proxy: {
        '/api': { target: env.VITE_DEV_API_PROXY || 'http://localhost:4000', changeOrigin: false },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      css: false,
    },
  }
})
