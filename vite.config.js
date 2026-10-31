import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Repassa as chamadas /api para o backend (npm run server)
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
})
