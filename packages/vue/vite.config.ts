import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LDesignGridVue',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue', '@ldesign/grid-core'],
      output: {
        globals: {
          vue: 'Vue',
          '@ldesign/grid-core': 'LDesignGridCore',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@ldesign/grid-core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
