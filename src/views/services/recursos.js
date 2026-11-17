import { api, baixarArquivo } from './api.js'
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
// depois: id da última mensagem que a tela já tem (traz só as novas).
export const lerConversa = (id, { depois } = {}) => chamar(`/mensagens/${encodeURIComponent(id)}${depois ? `?depois=${depois}` : ""}`)
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
// filtro: "minhas" | "descobrir" | "" (todas); busca: nome, tema ou descrição.
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
// Quem criou tira uma publicação da comunidade (ela continua no perfil de quem publicou).
export const tirarDaComunidade = (id, publicacaoId) => chamar(`/comunidades/${encodeURIComponent(id)}/publicacoes/${encodeURIComponent(publicacaoId)}`, { method: 'DELETE' })

// Conversas entre candidatas (separadas das conversas com empresas)
export const listarConversasCandidatas = () => chamar('/mensagens/candidatas')
export const abrirConversaCandidata = (usuariaId) => chamar('/mensagens/candidatas', { method: 'POST', corpo: { usuariaId } })
// antes: carrega as anteriores; depois: só as novas.
export const lerConversaCandidata = (id, { antes, depois } = {}) => {
  const q = antes ? `?antes=${antes}` : depois ? `?depois=${depois}` : ""
  return chamar(`/mensagens/candidatas/${encodeURIComponent(id)}${q}`)
}
export const apagarMensagemCandidata = (id, mensagemId) => chamar(`/mensagens/candidatas/${encodeURIComponent(id)}/mensagens/${encodeURIComponent(mensagemId)}`, { method: 'DELETE' })
export const enviarMensagemCandidata = (id, texto) => chamar(`/mensagens/candidatas/${encodeURIComponent(id)}`, { method: 'POST', corpo: { texto } })

// Privacidade da candidata
export const lerPrivacidade = () => chamar('/candidata/privacidade').then((r) => r.privacidade)
export const salvarPrivacidade = (corpo) => chamar('/candidata/privacidade', { method: 'PUT', corpo }).then((r) => r.privacidade)

// Exclusão da conta (candidata ou empresa)
export const excluirConta = (corpo) => chamar('/auth/conta', { method: 'DELETE', corpo })

// Conta
export const alterarSenha = (corpo) => chamar('/auth/senha', { method: 'PUT', corpo })

// Currículo da candidata (PDF, DOC ou DOCX, até 5 MB)
export const lerCurriculo = () => chamar('/candidata/curriculo').then((r) => r.curriculo)
export const enviarCurriculo = (nome, arquivo) => chamar('/candidata/curriculo', { method: 'PUT', corpo: { nome, arquivo } }).then((r) => r.curriculo)
export const removerCurriculo = () => chamar('/candidata/curriculo', { method: 'DELETE' })
export const baixarMeuCurriculo = () => baixarArquivo('/candidata/curriculo/arquivo', obterSessao()?.token, 'curriculo')
// Empresa: currículo enviado junto com uma candidatura
export const baixarCurriculoCandidatura = (id) => baixarArquivo(`/empresa/candidaturas/${encodeURIComponent(id)}/curriculo`, obterSessao()?.token, 'curriculo')

// E-mail de login (confere a senha)
export const alterarEmail = (corpo) => chamar('/auth/email', { method: 'PUT', corpo })

// Projetos de outras integrantes (Explorar e perfil público)
export const listarProjetosComunidade = ({ busca, autora } = {}) => {
  const q = new URLSearchParams(Object.entries({ busca, autora }).filter(([, v]) => v)).toString()
  return chamar(`/comunidade/projetos${q ? `?${q}` : ''}`).then((r) => r.projetos)
}

