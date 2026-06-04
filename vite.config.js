import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// App is served from https://noahatc12.github.io/habit-tracker/, so every asset
// URL must be prefixed with the repo name. `base` must match the repo exactly.
// https://vite.dev/config/
export default defineConfig({
  base: '/habit-tracker/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
    coverage: {
      include: ['src/lib/**/*.js'],
    },
  },
})
