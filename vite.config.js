import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    cloudflare()
  ],
  base: '/',
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split Three.js into its own chunk — it's ~500KB
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          // Split Firebase into its own chunk
          if (id.includes('firebase')) {
            return 'firebase-vendor';
          }
          // Split Sentry into its own chunk
          if (id.includes('@sentry')) {
            return 'sentry-vendor';
          }
          // Split framer-motion into its own chunk
          if (id.includes('framer-motion')) {
            return 'framer-vendor';
          }
          // Group remaining node_modules into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
