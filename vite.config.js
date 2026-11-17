import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const portaApi = Number(loadEnv(mode, process.cwd(), '').PORT || 3001)
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3006,
      strictPort: true,
      proxy: {
        '/api': `http://127.0.0.1:${portaApi}`,
      },
    },
    preview: { port: 3006 },
  }
})
