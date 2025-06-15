import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@ai-map/meta_map': path.resolve(__dirname, '../meta_map/src')
    }
  },
  optimizeDeps: {
    include: ['leaflet', 'leaflet.markercluster']
  }
}) 