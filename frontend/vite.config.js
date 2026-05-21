import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vite config for Resilio-Route Frontend
// - Serves on 0.0.0.0:3000 to satisfy Kubernetes ingress
// - HMR works over the public HTTPS preview (clientPort 443)
// - Exposes both REACT_APP_* (existing protected var) and VITE_* env variables
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/build/**', '**/dist/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  envPrefix: ['VITE_', 'REACT_APP_'],
  build: {
    outDir: 'build',
    sourcemap: false,
  },
})
