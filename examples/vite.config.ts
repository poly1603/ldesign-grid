import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ldesign/grid-core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@ldesign/grid-vue': resolve(__dirname, '../packages/vue/src/index.ts'),
    },
  },
  server: {
    port: 5555,
    host: true,
    open: true,
  },
});
