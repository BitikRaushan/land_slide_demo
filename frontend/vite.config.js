import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vite config for Resilio-Route.
 *
 * Local dev:        REACT_APP_BACKEND_URL=http://localhost:8001 → direct calls
 * Local dev (proxy): leave REACT_APP_BACKEND_URL empty + set BACKEND_PROXY_URL
 *                    in .env to make Vite proxy /api → backend (no CORS).
 * Hosted (Emergent / Vercel etc.): REACT_APP_BACKEND_URL is the public URL,
 *                                  HMR uses wss over 443.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'REACT_APP_', 'BACKEND_'])
  const isHosted = !!env.REACT_APP_BACKEND_URL && env.REACT_APP_BACKEND_URL.startsWith('https://')

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: true,
      // Only force wss/443 when running behind the hosted HTTPS preview.
      // Locally, let Vite auto-detect (ws + same port).
      hmr: isHosted ? { clientPort: 443, protocol: 'wss' } : true,
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/build/**', '**/dist/**'],
      },
      // Optional dev proxy — activates only if BACKEND_PROXY_URL is set.
      // Lets you call /api/* from the browser without setting a backend URL.
      proxy: env.BACKEND_PROXY_URL
        ? {
            '/api': {
              target: env.BACKEND_PROXY_URL,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
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
  }
})
