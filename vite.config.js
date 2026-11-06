import { spawn } from 'node:child_process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// Sobe a API (src/server.js) junto com o `npm run dev`, para o login nunca
// ficar sem servidor. Se a API já estiver rodando (ex.: `npm run server` em
// outro terminal), usa essa. `node --watch` reinicia a API sozinha quando
// um arquivo dela muda (models, controllers, routes...).
function apiJunto(portaApi) {
  return {
    name: 'bloom-api',
    apply: 'serve',
    async configureServer(server) {
      const log = server.config.logger
      // O Vite pode se reiniciar (ex.: mudança neste arquivo): mantém a mesma API.
      if (globalThis.__apiBloom?.exitCode === null) return
      const noAr = await fetch(`http://127.0.0.1:${portaApi}/api/saude`, { signal: AbortSignal.timeout(1500) })
        .then((r) => r.ok)
        .catch(() => false)
      if (noAr) {
        log.info(`  API da Bloom já está rodando na porta ${portaApi}.`)
        return
      }
      const api = spawn(process.execPath, ['--watch', '--env-file=.env', 'src/server.js'], { stdio: 'inherit' })
      api.on('exit', (codigo) => {
        if (codigo) log.error(`  A API da Bloom parou (código ${codigo}). Veja a mensagem acima, corrija e rode "npm run dev" de novo.`)
      })
      globalThis.__apiBloom = api
      // Fecha a API junto com o `npm run dev` (Ctrl+C).
      const parar = () => api.exitCode === null && api.kill()
      process.once('exit', parar)
      process.once('SIGINT', () => process.exit())
      process.once('SIGTERM', () => process.exit())
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Mesma porta que a API usa (PORT do .env, padrão 3001).
  const portaApi = Number(loadEnv(mode, process.cwd(), '').PORT || 3001)
  return {
    plugins: [react(), tailwindcss(), apiJunto(portaApi)],
    server: {
      // Repassa as chamadas /api para a API
      proxy: {
        '/api': `http://127.0.0.1:${portaApi}`,
      },
    },
  }
})
