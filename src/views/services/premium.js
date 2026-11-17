import { api } from './api.js'
import { obterSessao } from './auth.js'

function chamar(caminho, opcoes = {}) {
  const token = obterSessao()?.token
  if (!token) return Promise.reject(new Error('Sessão inválida. Faça login novamente.'))
  return api(`/premium${caminho}`, { ...opcoes, token })
}

export const lerPremium = () => chamar('')
export const assinarPlano = (plano) => chamar('/assinatura', { method: 'POST', corpo: { plano } })
export const sincronizarAssinatura = () => chamar('/assinatura/sincronizar', { method: 'POST' })
export const cancelarAssinatura = () => chamar('/assinatura', { method: 'DELETE' })
export const criarCampanha = (corpo) => chamar('/campanhas', { method: 'POST', corpo })
export const sincronizarCampanha = (id) => chamar(`/campanhas/${encodeURIComponent(id)}/sincronizar`, { method: 'POST' })
export const cancelarCampanha = (id) => chamar(`/campanhas/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const reais = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const dataHora = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')
