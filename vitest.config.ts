/**
 * Vitest configuration for @ldesign/grid
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules', 'dist', 'examples'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx,vue}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/**/types.ts'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})

