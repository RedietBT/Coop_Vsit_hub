import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:8080'
  const port = parseInt(env.VITE_PORT, 10) || 3000

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src')
      }
    },
    server: {
      port,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        },
        '/rooms': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            const cleanPath = req.url.split('?')[0].replace(/^\//, '');
            const localFile = path.resolve(import.meta.dirname, 'public', cleanPath);
            if (fs.existsSync(localFile)) {
              return req.url; // Serve directly from public/ without proxying
            }
          }
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        },
        '/images': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
