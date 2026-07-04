/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    maxConcurrency: 1, // Run tests sequentially to avoid conflicts
    pool: 'forks', // Use separate processes for better isolation
    isolate: true, // Ensure test isolation
    css: false, // Disable CSS processing for faster tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        '**/__mocks__/**'
      ]
    },
    // Retry failed tests once
    retry: 1,
    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})