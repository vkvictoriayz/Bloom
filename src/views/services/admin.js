import { api } from './api.js'
import { obterSessao, salvarSessao } from './auth.js'

// Cliente da API da administração (/api/admin). A sessão do administrador usa
// o mesmo lugar da sessão das contas, com tipo "admin".

function chamar(caminho, opcoes = {}) {
  const sessao = obterSessao()
  if (sessao?.usuario?.tipo !== 'admin') return Promise.reject(new Error('Sessão de administração inválida. Entre de novo.'))
  return api(`/admin${caminho}`, { ...opcoes, token: sessao.token })
}

const consulta = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)).toString()
  return q ? `?${q}` : ''
}

export async function entrarAdmin(usuario, senha) {
  const r = await api('/admin/login', { method: 'POST', corpo: { usuario, senha } })
  salvarSessao(r)
  return r
}

export const ehSuper = () => obterSessao()?.usuario?.nivel === 'super'

export const lerPainel = () => chamar('/dashboard')
export const listarCandidatasAdmin = (filtros = {}) => chamar(`/candidatas${consulta(filtros)}`)
export const lerCandidataAdmin = (id) => chamar(`/candidatas/${encodeURIComponent(id)}`)
export const listarEmpresasAdmin = (filtros = {}) => chamar(`/empresas${consulta(filtros)}`)
export const lerEmpresaAdmin = (id) => chamar(`/empresas/${encodeURIComponent(id)}`)
export const definirRepresentante = (id, status) => chamar(`/empresas/${encodeURIComponent(id)}/representante`, { method: 'PATCH', corpo: { status } })

// tipo: "candidatas" | "empresas"
export const suspenderConta = (tipo, id, motivo) => chamar(`/${tipo}/${encodeURIComponent(id)}/suspender`, { method: 'POST', corpo: { motivo } })
export const reativarConta = (tipo, id) => chamar(`/${tipo}/${encodeURIComponent(id)}/reativar`, { method: 'POST' })
export const excluirContaAdmin = (tipo, id, motivo) => chamar(`/${tipo}/${encodeURIComponent(id)}`, { method: 'DELETE', corpo: { motivo, confirmacao: 'EXCLUIR' } })

export const listarVagasAdmin = (filtros = {}) => chamar(`/vagas${consulta(filtros)}`)
export const moderarVaga = (id, status, motivo) => chamar(`/vagas/${encodeURIComponent(id)}/status`, { method: 'PATCH', corpo: { status, motivo } })

export const listarPublicacoesAdmin = (filtros = {}) => chamar(`/publicacoes${consulta(filtros)}`)
export const listarComentariosAdmin = (id) => chamar(`/publicacoes/${encodeURIComponent(id)}/comentarios`)
export const removerPublicacaoAdmin = (origem, id, motivo) =>
  chamar(`/${origem === 'empresa' ? 'publicacoes-empresa' : 'publicacoes'}/${encodeURIComponent(id)}`, { method: 'DELETE', corpo: { motivo } })
export const removerComentarioAdmin = (id, motivo) => chamar(`/comentarios/${encodeURIComponent(id)}`, { method: 'DELETE', corpo: { motivo } })
export const listarComunidadesAdmin = (busca) => chamar(`/comunidades${consulta({ busca })}`)
export const removerComunidadeAdmin = (id, motivo) => chamar(`/comunidades/${encodeURIComponent(id)}`, { method: 'DELETE', corpo: { motivo } })

export const lerPagamentosAdmin = () => chamar('/pagamentos')
export const listarDenuncias = (filtros = {}) => chamar(`/denuncias${consulta(filtros)}`)
export const decidirDenuncia = (id, status, resolucao) => chamar(`/denuncias/${encodeURIComponent(id)}`, { method: 'PATCH', corpo: { status, resolucao } })
// Manda para a conta o link oficial de "criar nova senha" (a equipe não vê a senha).
export const enviarRedefinicaoSenha = (tipo, id) => chamar(`/${tipo}/${encodeURIComponent(id)}/redefinicao-senha`, { method: 'POST' })
export const lerRegistro = (filtros = {}) => chamar(`/registro${consulta(filtros)}`)

export const listarAdmins = () => chamar('/admins')
export const criarAdmin = (corpo) => chamar('/admins', { method: 'POST', corpo })
export const alterarAdmin = (id, corpo) => chamar(`/admins/${encodeURIComponent(id)}`, { method: 'PATCH', corpo })
export const alterarSenhaAdmin = (corpo) => chamar('/senha', { method: 'PUT', corpo })

export const dataHora = (d) => (d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')
export const dinheiro = (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
