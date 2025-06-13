import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './',
  publicDir: '../example',
  server: {
    port: 3007,
    host: true,
    open: true
  },
  optimizeDeps: {
    // 强制预构建本地包
    include: ['@ai-map/meta_map']
  },
  build: {
    outDir: 'dist',
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
}); 