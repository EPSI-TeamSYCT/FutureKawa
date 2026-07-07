import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  // Top-level await in main.tsx requires a build target that supports it.
  build: {
    target: 'es2022',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Gate coverage on the pure business logic only — UI (components, pages,
      // providers, Chart.js setup, MSW mocks) is intentionally out of scope.
      include: ['src/lib/**'],
      exclude: ['src/lib/chartSetup.ts', 'src/lib/**/*.{test,spec}.*'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
