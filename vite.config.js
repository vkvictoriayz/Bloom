import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Repassa as chamadas /api para o backend (npm run dev dentro de /backend)
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
