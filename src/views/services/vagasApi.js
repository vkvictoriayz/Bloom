import { api } from './api.js'
import { obterSessao } from './auth.js'
import { iniciais } from '../hooks/useSessao'

export const EVENTO_CANDIDATURAS_SERVIDOR = 'bloom-candidaturas-servidor'

const chamar = (caminho, opcoes = {}) => {
  const token = obterSessao()?.token
  if (!token) return Promise.reject(new Error('Sessão inválida. Faça login novamente.'))
  return api(caminho, { ...opcoes, token })
}

export const ehVagaReal = (id) => /^b\d+$/.test(String(id))
export const idServidor = (id) => Number(String(id).slice(1))

function diasDesde(data) {
  if (!data) return 0
  const [a, m, d] = String(data).slice(0, 10).split('-').map(Number)
  const dias = Math.floor((Date.now() - new Date(a, m - 1, d).getTime()) / 86400000)
  return Math.max(0, dias)
}

function dataBR(data) {
  const [a, m, d] = String(data ?? '').slice(0, 10).split('-')
  return a && m && d ? `${d}/${m}/${a}` : ''
}

const linhas = (s) => (s ? s.split('\n').map((l) => l.trim()).filter(Boolean) : null)

function faixa(min, max) {
  if (min === null || min === undefined) return null
  const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return max !== null && max !== undefined && Number(max) !== Number(min) ? `${brl(min)} a ${brl(max)}` : brl(min)
}

export const lerEmpresaPublica = (id) => chamar(`/vagas/empresas/${encodeURIComponent(id)}`).then((r) => ({ ...r, vagas: r.vagas.map(converterVaga) }))

export function converterVaga(v) {
  const empresa = v.empresa ?? { id: 0, nome: 'Empresa' }
  return {
    id: `b${v.id}`,
    real: true,
    titulo: v.titulo,
    empresa: `empresa-${empresa.id}`,
    destaque: Boolean(empresa.premium),
    dadosEmpresa: {
      slug: null,
      id: empresa.id,
      premium: Boolean(empresa.premium),
      nome: empresa.nome,
      nomeCurto: empresa.nome,
      sigla: iniciais(empresa.nome) || 'E',
      segmento: 'Empresa na Bloom',
      cor: '#85243d',
      corTexto: '#ffffff',
      logo: empresa.logo || null,
      foto: empresa.foto || null,
      capa: empresa.capa || null,
      site: empresa.site || '',
    },
    area: v.area || 'Não informada',
    local: v.localizacao || 'Local não informado',
    cidade: v.localizacao || '',
    uf: '',
    modalidade: v.modalidade || 'Não informada',
    contrato: v.tipoContrato || 'Não informado',
    nivel: v.nivel || null,
    publicadaHaDias: diasDesde(v.dataPublicacao),
    salario: faixa(v.salario, v.salarioMax),
    resumo: v.descricao,
    descricao: v.descricao,
    responsabilidades: null,
    requisitos: linhas(v.requisitos),
    beneficios: linhas(v.beneficios),
    competencias: [],
    status: v.status,
  }
}

export function converterCandidatura(c) {
  const vaga = c.vaga?.empresa ? converterVaga(c.vaga) : null
  return {
    id: `s${c.id}`,
    servidor: true,
    vagaId: `b${c.vaga?.id}`,
    cargo: c.vaga?.titulo ?? 'Vaga',
    empresa: vaga?.dadosEmpresa.nome ?? '',
    dadosEmpresa: vaga?.dadosEmpresa ?? null,
    idServidor: c.id,
    local: vaga?.local ?? '',
    modalidade: vaga?.modalidade ?? '',
    data: dataBR(c.data),
    status: c.status,
    confirmadaPeloServidor: true,
    enviado: c.envio ? { apresentacao: c.envio.apresentacao, links: c.envio.links, perfil: c.envio.titulo ? { titulo: c.envio.titulo } : null } : null,
  }
}

export const listarVagasServidor = () => chamar('/vagas').then((r) => r.vagas.map(converterVaga))
export const lerVagaServidor = (id) => chamar(`/vagas/${idServidor(id)}`).then((r) => converterVaga(r.vaga))
export const listarCandidaturasServidor = () => chamar('/candidaturas/minhas').then((r) => r.candidaturas.map(converterCandidatura))

export async function retirarCandidaturaServidor(idCandidatura) {
  const r = await chamar(`/candidaturas/${encodeURIComponent(idCandidatura)}`, { method: 'DELETE' })
  window.dispatchEvent(new Event(EVENTO_CANDIDATURAS_SERVIDOR))
  return r
}

export async function candidatarServidor(vagaId, extras) {
  const r = await chamar('/candidaturas', { method: 'POST', corpo: { vagaId: idServidor(vagaId), ...extras } })
  window.dispatchEvent(new Event(EVENTO_CANDIDATURAS_SERVIDOR))
  return r
}
