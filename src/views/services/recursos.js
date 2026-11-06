import { api } from './api.js'
import { obterSessao } from './auth.js'

// Recursos que dependem de API, para candidatas e empresas.
//
// Ligados (true) os que já têm rota no backend. Os desligados mostram um
// estado "ainda não disponível" e não simulam dados.
export const DISPONIVEL = {
  mensagens: true, //      GET/POST /api/mensagens, GET/POST /api/mensagens/:id
  notificacoes: true, //   GET /api/notificacoes, POST /api/notificacoes/:id/lida, POST /api/notificacoes/lidas
  comunidades: true, //    GET/POST /api/comunidades, GET/DELETE /api/comunidades/:id, POST .../participar, POST .../publicacoes
  conta: true, //          PUT /api/auth/senha
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
// Abre (ou retoma) a conversa de uma candidatura (id numérico do servidor).
export const abrirConversa = (candidaturaId) => chamar('/mensagens', { method: 'POST', corpo: { candidaturaId } })

// Notificações
export const listarNotificacoes = () => chamar('/notificacoes')
export const marcarComoLida = (id) => chamar(`/notificacoes/${encodeURIComponent(id)}/lida`, { method: 'POST' })
export const marcarTodasComoLidas = () => chamar('/notificacoes/lidas', { method: 'POST' })
export const lerPreferenciasNotificacao = () => chamar('/notificacoes/preferencias').then((r) => r.preferencias)
export const salvarPreferenciasNotificacao = (corpo) => chamar('/notificacoes/preferencias', { method: 'PUT', corpo }).then((r) => r.preferencias)
export const contarNaoLidas = () => chamar('/notificacoes?resumo=1').then((r) => r.naoLidas)
// Disparado quando notificações são lidas, para o sino atualizar a contagem.
export const EVENTO_NOTIFICACOES = 'bloom-notificacoes-lidas'

// Comunidades temáticas (grupos)
export const listarComunidades = () => chamar('/comunidades')
export const lerComunidadeTematica = (id) => chamar(`/comunidades/${encodeURIComponent(id)}`)
export const participarComunidade = (id) => chamar(`/comunidades/${encodeURIComponent(id)}/participar`, { method: 'POST' })
export const criarComunidade = (corpo) => chamar('/comunidades', { method: 'POST', corpo })
export const excluirComunidade = (id) => chamar(`/comunidades/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const publicarNaComunidade = (id, corpo) => chamar(`/comunidades/${encodeURIComponent(id)}/publicacoes`, { method: 'POST', corpo })

// Privacidade da candidata
export const lerPrivacidade = () => chamar('/candidata/privacidade').then((r) => r.privacidade)
export const salvarPrivacidade = (corpo) => chamar('/candidata/privacidade', { method: 'PUT', corpo }).then((r) => r.privacidade)

// Exclusão da conta (candidata ou empresa)
export const excluirConta = (corpo) => chamar('/auth/conta', { method: 'DELETE', corpo })

// Conta
export const alterarSenha = (corpo) => chamar('/auth/senha', { method: 'PUT', corpo })
