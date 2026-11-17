import { api, baixarArquivo } from './api.js'
import { obterSessao } from './auth.js'

export const DISPONIVEL = {
  mensagens: true,
  notificacoes: true,
  comunidades: true,
  conta: true,
}

const chamar = (caminho, opcoes = {}) => {
  const token = obterSessao()?.token
  if (!token) return Promise.reject(new Error('Sessão inválida. Faça login novamente.'))
  return api(caminho, { ...opcoes, token })
}

export const listarConversas = () => chamar('/mensagens')
export const lerConversa = (id, { depois } = {}) => chamar(`/mensagens/${encodeURIComponent(id)}${depois ? `?depois=${depois}` : ""}`)
const corpoMensagem = (corpo) => (typeof corpo === 'string' ? { texto: corpo } : corpo)
export const enviarMensagem = (id, corpo) => chamar(`/mensagens/${encodeURIComponent(id)}`, { method: 'POST', corpo: corpoMensagem(corpo) })
export const apagarMensagemEmpresa = (id, mensagemId) => chamar(`/mensagens/${encodeURIComponent(id)}/mensagens/${encodeURIComponent(mensagemId)}`, { method: 'DELETE' })
export const contarMensagensNaoLidas = () => chamar('/mensagens/nao-lidas').then((r) => r.total)
export const EVENTO_MENSAGENS = 'bloom-mensagens-lidas'
export const abrirConversa = (candidaturaId) => chamar('/mensagens', { method: 'POST', corpo: { candidaturaId } })

export const listarNotificacoes = () => chamar('/notificacoes')
export const marcarComoLida = (id) => chamar(`/notificacoes/${encodeURIComponent(id)}/lida`, { method: 'POST' })
export const marcarTodasComoLidas = () => chamar('/notificacoes/lidas', { method: 'POST' })
export const lerPreferenciasNotificacao = () => chamar('/notificacoes/preferencias').then((r) => r.preferencias)
export const salvarPreferenciasNotificacao = (corpo) => chamar('/notificacoes/preferencias', { method: 'PUT', corpo }).then((r) => r.preferencias)
export const contarNaoLidas = () => chamar('/notificacoes?resumo=1').then((r) => r.naoLidas)
export const EVENTO_NOTIFICACOES = 'bloom-notificacoes-lidas'

export const listarComunidades = ({ filtro = "", busca = "" } = {}) => {
  const q = new URLSearchParams(Object.entries({ filtro, busca }).filter(([, v]) => v)).toString()
  return chamar(`/comunidades${q ? `?${q}` : ""}`)
}
export const lerComunidadeTematica = (id, pagina = 1) => chamar(`/comunidades/${encodeURIComponent(id)}${pagina > 1 ? `?pagina=${pagina}` : ""}`)
export const participarComunidade = (id) => chamar(`/comunidades/${encodeURIComponent(id)}/participar`, { method: 'POST' })
export const criarComunidade = (corpo) => chamar('/comunidades', { method: 'POST', corpo })
export const excluirComunidade = (id) => chamar(`/comunidades/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const publicarNaComunidade = (id, corpo) => chamar(`/comunidades/${encodeURIComponent(id)}/publicacoes`, { method: 'POST', corpo })
export const atualizarComunidade = (id, corpo) => chamar(`/comunidades/${encodeURIComponent(id)}`, { method: 'PUT', corpo })
export const enviarCapaComunidade = (id, imagem) => chamar(`/comunidades/${encodeURIComponent(id)}/capa`, { method: 'PUT', corpo: { imagem } })
export const removerCapaComunidade = (id) => chamar(`/comunidades/${encodeURIComponent(id)}/capa`, { method: 'DELETE' })
export const tirarDaComunidade = (id, publicacaoId) => chamar(`/comunidades/${encodeURIComponent(id)}/publicacoes/${encodeURIComponent(publicacaoId)}`, { method: 'DELETE' })

export const listarConversasCandidatas = () => chamar('/mensagens/candidatas')
export const abrirConversaCandidata = (usuariaId) => chamar('/mensagens/candidatas', { method: 'POST', corpo: { usuariaId } })
export const lerConversaCandidata = (id, { antes, depois } = {}) => {
  const q = antes ? `?antes=${antes}` : depois ? `?depois=${depois}` : ""
  return chamar(`/mensagens/candidatas/${encodeURIComponent(id)}${q}`)
}
export const apagarMensagemCandidata = (id, mensagemId) => chamar(`/mensagens/candidatas/${encodeURIComponent(id)}/mensagens/${encodeURIComponent(mensagemId)}`, { method: 'DELETE' })
export const enviarMensagemCandidata = (id, corpo) => chamar(`/mensagens/candidatas/${encodeURIComponent(id)}`, { method: 'POST', corpo: corpoMensagem(corpo) })
export const bloquearConversa = (id) => chamar(`/mensagens/candidatas/${encodeURIComponent(id)}/bloqueio`, { method: 'PUT' })
export const desbloquearConversa = (id) => chamar(`/mensagens/candidatas/${encodeURIComponent(id)}/bloqueio`, { method: 'DELETE' })

export const lerPrivacidade = () => chamar('/candidata/privacidade').then((r) => r.privacidade)
export const salvarPrivacidade = (corpo) => chamar('/candidata/privacidade', { method: 'PUT', corpo }).then((r) => r.privacidade)

export const excluirConta = (corpo) => chamar('/auth/conta', { method: 'DELETE', corpo })

export const alterarSenha = (corpo) => chamar('/auth/senha', { method: 'PUT', corpo })

export const lerCurriculo = () => chamar('/candidata/curriculo').then((r) => r.curriculo)
export const enviarCurriculo = (nome, arquivo) => chamar('/candidata/curriculo', { method: 'PUT', corpo: { nome, arquivo } }).then((r) => r.curriculo)
export const removerCurriculo = () => chamar('/candidata/curriculo', { method: 'DELETE' })
export const baixarMeuCurriculo = () => baixarArquivo('/candidata/curriculo/arquivo', obterSessao()?.token, 'curriculo')
export const baixarCurriculoCandidatura = (id) => baixarArquivo(`/empresa/candidaturas/${encodeURIComponent(id)}/curriculo`, obterSessao()?.token, 'curriculo')

export const alterarEmail = (corpo) => chamar('/auth/email', { method: 'PUT', corpo })

export const listarProjetosComunidade = ({ busca, autora } = {}) => {
  const q = new URLSearchParams(Object.entries({ busca, autora }).filter(([, v]) => v)).toString()
  return chamar(`/comunidade/projetos${q ? `?${q}` : ''}`).then((r) => r.projetos)
}

