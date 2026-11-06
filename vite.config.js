import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// Front (npm run dev): http://localhost:3006
// API (npm run server): http://localhost:3001 — porta do PORT no .env.
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const portaApi = Number(loadEnv(mode, process.cwd(), '').PORT || 3001)
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3006,
      strictPort: true,
      // Repassa as chamadas /api para a API (npm run server)
      proxy: {
        '/api': `http://127.0.0.1:${portaApi}`,
      },
    },
    preview: { port: 3006 },
  }
})
