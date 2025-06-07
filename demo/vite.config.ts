import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: './',
  publicDir: '../example',
  server: {
    port: 3004,
    host: true,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
}); 