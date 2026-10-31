import { api } from './api'

// Solicitações de contato entre usuárias e empresas.
//
// O backend ainda NÃO tem um sistema de mensagens nem canais de contato
// autorizados pelas empresas. Enquanto CONTATOS_DISPONIVEL for false, a tela
// monta e revisa a solicitação, mas não envia nada e não finge envio.
//
// Para ativar: criar no backend
//   POST /api/contatos   { empresa, assunto, mensagem }  -> { id, status, criadaEm }
//   GET  /api/contatos                                    -> [{ id, empresa, assunto, status, criadaEm }]
// protegidos por exigirLogin(), e trocar a constante abaixo para true.

export const CONTATOS_DISPONIVEL = false

export const ASSUNTOS = [
  'Dúvida sobre uma vaga',
  'Interesse em oportunidades futuras',
  'Andamento de uma candidatura',
  'Outro assunto',
]

export function enviarSolicitacao(token, dados) {
  return api('/contatos', { method: 'POST', corpo: dados, token })
}

export function listarSolicitacoes(token) {
  return api('/contatos', { token })
}
