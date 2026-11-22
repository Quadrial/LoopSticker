import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { handleApiRequest } from './server/index.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'sticker-api',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (!handleApiRequest(request, response)) next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          if (!handleApiRequest(request, response)) next()
        })
      },
    },
  ],
})
