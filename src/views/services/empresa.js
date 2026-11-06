import { api } from './api.js'
import { obterSessao } from './auth.js'

// Cliente da API da área empresarial (src/routes/empresaRoutes.js).
// O backend valida o token (conta "empresa") e a propriedade de cada registro.

const chamar = (caminho, opcoes = {}) => {
  const token = obterSessao()?.token
  if (!token) return Promise.reject(new Error('Sessão inválida. Faça login novamente.'))
  return api(`/empresa${caminho}`, { ...opcoes, token })
}

const consulta = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
  return q ? `?${q}` : ''
}

export const STATUS_VAGA = ['Rascunho', 'Aberta', 'Pausada', 'Encerrada']
export const STATUS_CANDIDATURA = ['Recebida', 'Em análise', 'Em entrevista', 'Aprovada', 'Reprovada']
export const NIVEIS = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Liderança']
export const MODALIDADES = ['Presencial', 'Híbrido', 'Remoto']
export const CONTRATOS = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Trainee']

// Como cada status aparece na interface (cor do Selo e rótulo).
export const VISUAL_VAGA = {
  Rascunho: { variante: 'contorno', rotulo: 'Rascunho' },
  Aberta: { variante: 'sucesso', rotulo: 'Publicada' },
  Pausada: { variante: 'alerta', rotulo: 'Desativada' },
  Encerrada: { variante: 'neutro', rotulo: 'Encerrada' },
}
export const VISUAL_CANDIDATURA = {
  Recebida: { variante: 'vinho', rotulo: 'Recebida' },
  'Em análise': { variante: 'alerta', rotulo: 'Em análise' },
  'Em entrevista': { variante: 'alerta', rotulo: 'Em entrevista' },
  Aprovada: { variante: 'sucesso', rotulo: 'Aprovada' },
  Reprovada: { variante: 'erro', rotulo: 'Não selecionada' },
}

// Ação de status permitida a partir de cada status (regras de VAGAS).
export const ACOES_VAGA = {
  Rascunho: [{ status: 'Aberta', rotulo: 'Publicar' }],
  Aberta: [
    { status: 'Pausada', rotulo: 'Desativar' },
    { status: 'Encerrada', rotulo: 'Encerrar' },
  ],
  Pausada: [
    { status: 'Aberta', rotulo: 'Reativar' },
    { status: 'Encerrada', rotulo: 'Encerrar' },
  ],
  Encerrada: [{ status: 'Aberta', rotulo: 'Reabrir' }],
}

// Perfil
export const lerPerfilEmpresa = () => chamar('/perfil')
export const salvarPerfilEmpresa = (corpo) => chamar('/perfil', { method: 'PUT', corpo })

// Vagas
export const listarVagasEmpresa = (status) => chamar(`/vagas${consulta({ status })}`)
export const criarVaga = (corpo) => chamar('/vagas', { method: 'POST', corpo })
export const lerVagaEmpresa = (id) => chamar(`/vagas/${encodeURIComponent(id)}`)
export const editarVaga = (id, corpo) => chamar(`/vagas/${encodeURIComponent(id)}`, { method: 'PUT', corpo })
export const mudarStatusVaga = (id, status) => chamar(`/vagas/${encodeURIComponent(id)}/status`, { method: 'PATCH', corpo: { status } })
export const excluirVaga = (id) => chamar(`/vagas/${encodeURIComponent(id)}`, { method: 'DELETE' })

// Painel (números do recrutamento)
export const lerDashboard = () => chamar('/dashboard')

// Candidaturas recebidas
export const listarCandidaturasEmpresa = ({ vaga, status } = {}) => chamar(`/candidaturas${consulta({ vaga, status })}`)
export const lerCandidaturaEmpresa = (id) => chamar(`/candidaturas/${encodeURIComponent(id)}`)
export const mudarStatusCandidatura = (id, status) => chamar(`/candidaturas/${encodeURIComponent(id)}/status`, { method: 'PATCH', corpo: { status } })

// Publicações
export const listarPublicacoesEmpresa = () => chamar('/publicacoes')
export const criarPublicacaoEmpresa = (corpo) => chamar('/publicacoes', { method: 'POST', corpo })
export const editarPublicacaoEmpresa = (id, corpo) => chamar(`/publicacoes/${encodeURIComponent(id)}`, { method: 'PUT', corpo })
export const excluirPublicacaoEmpresa = (id) => chamar(`/publicacoes/${encodeURIComponent(id)}`, { method: 'DELETE' })

// Rede
export const lerFeedEmpresa = (pagina = 1) => chamar(`/feed${consulta({ pagina: pagina > 1 ? pagina : '' })}`)
export const listarTalentos = ({ busca, area } = {}) => chamar(`/talentos${consulta({ busca, area })}`)
export const convidarTalento = (id, corpo) => chamar(`/talentos/${encodeURIComponent(id)}/convites`, { method: 'POST', corpo })

// Faixa salarial em reais ("R$ 5.000,00 a R$ 7.000,00").
export function faixaSalarial(min, max) {
  const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (min === null || min === undefined) return ''
  return max !== null && max !== undefined && max !== min ? `${brl(min)} a ${brl(max)}` : brl(min)
}
export const lerTalento = (id) => chamar(`/talentos/${encodeURIComponent(id)}`)

// "2026-11-03" -> "03/11/2026"
export function dataCurta(valor) {
  if (!valor) return ''
  const [a, m, d] = String(valor).slice(0, 10).split('-')
  return a && m && d ? `${d}/${m}/${a}` : String(valor)
}

// Foto da empresa: a enviada pela própria empresa ou, sem ela, o logo
// informado por endereço (PERFIL_EMPRESA.logo).
// Foto enviada > logo informado > ícone escolhido ("icone:...").
export function fotoEmpresa(dados) {
  const foto = dados?.imagens?.foto
  if (foto && !foto.startsWith('icone:')) return foto
  return dados?.perfil?.logo || foto || ''
}
