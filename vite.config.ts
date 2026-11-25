import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { serviceWorker } from './tools/serviceworker.ts'

export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
