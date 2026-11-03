import { api } from './api.js'
import { obterSessao } from './auth.js'

// Recursos da área da candidata que ainda NÃO têm API no backend.
//
// Cada um está desligado (false). As telas mostram um estado "ainda não
// disponível" e não simulam dados. Quando a rota existir no backend
// (protegida com exigirLogin(["usuaria"])), basta trocar para true —
// as funções abaixo já chamam os caminhos esperados.
export const DISPONIVEL = {
  mensagens: false, //     GET /api/mensagens, GET /api/mensagens/:id, POST /api/mensagens/:id
  notificacoes: false, //  GET /api/notificacoes, POST /api/notificacoes/:id/lida
  comunidades: false, //   GET /api/comunidades, GET /api/comunidades/:id, POST /api/comunidades/:id/participar
  conta: false, //         PUT /api/auth/senha, PUT /api/conta/preferencias
}

const chamar = (caminho, opcoes = {}) => {
  const token = obterSessao()?.token
  if (!token) return Promise.reject(new Error('Sessão inválida. Faça login novamente.'))
  return api(caminho, { ...opcoes, token })
}

// Mensagens
export const listarConversas = () => chamar('/mensagens')
export const lerConversa = (id) => chamar(`/mensagens/${encodeURIComponent(id)}`)
export const enviarMensagem = (id, texto) => chamar(`/mensagens/${encodeURIComponent(id)}`, { method: 'POST', corpo: { texto } })

// Notificações
export const listarNotificacoes = () => chamar('/notificacoes')
export const marcarComoLida = (id) => chamar(`/notificacoes/${encodeURIComponent(id)}/lida`, { method: 'POST' })

// Comunidades temáticas (grupos)
export const listarComunidades = () => chamar('/comunidades')
export const lerComunidadeTematica = (id) => chamar(`/comunidades/${encodeURIComponent(id)}`)
export const participarComunidade = (id) => chamar(`/comunidades/${encodeURIComponent(id)}/participar`, { method: 'POST' })

// Conta
export const alterarSenha = (corpo) => chamar('/auth/senha', { method: 'PUT', corpo })
