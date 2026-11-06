import { gravarJSON, lerJSON } from './armazenamento'

// Perfil profissional da usuária.
//
// O banco tem PERFIL_USUARIA, EXPERIENCIA, FORMACAO e HABILIDADE, mas o
// backend ainda não tem rotas para eles. O perfil fica neste navegador,
// marcado com o e-mail da dona — assim outra conta no mesmo navegador não
// vê dados que não são dela. Nome e e-mail iniciais vêm da sessão real.

export const CHAVE_PERFIL = 'bloom-perfil'
export const EVENTO_PERFIL = 'bloom-perfil-atualizado'

export function perfilVazio(usuario = {}) {
  return {
    dono: usuario.email ?? '',
    nome: usuario.nome ?? '',
    email: usuario.email ?? '',
    telefone: '',
    cargo: '',
    local: '',
    foto: '',
    capa: '',
    sobre: '',
    preferencias: { modalidades: [], areas: [], disponibilidade: '' },
    objetivo: '',
    links: { linkedin: '', github: '', portfolio: '' },
    tecnicas: [],
    comportamentais: [],
    experiencias: [],
    formacoes: [],
    cursos: [],
    projetos: [],
  }
}

export function lerPerfil(usuario) {
  const base = perfilVazio(usuario)
  const salvo = lerJSON(CHAVE_PERFIL, null)
  if (!salvo || typeof salvo !== 'object') return base

  // Perfis antigos não tinham "dono": só aproveitamos se o e-mail bater.
  const dono = salvo.dono ?? salvo.email
  if (!usuario?.email || dono?.toLowerCase() !== usuario.email.toLowerCase()) return base

  return {
    ...base,
    ...salvo,
    links: { ...base.links, ...salvo.links },
    preferencias: {
      ...base.preferencias,
      ...salvo.preferencias,
      modalidades: Array.isArray(salvo.preferencias?.modalidades) ? salvo.preferencias.modalidades : [],
      areas: Array.isArray(salvo.preferencias?.areas) ? salvo.preferencias.areas : [],
    },
    tecnicas: Array.isArray(salvo.tecnicas) ? salvo.tecnicas : [],
    comportamentais: Array.isArray(salvo.comportamentais) ? salvo.comportamentais : [],
    experiencias: Array.isArray(salvo.experiencias) ? salvo.experiencias : [],
    formacoes: Array.isArray(salvo.formacoes) ? salvo.formacoes : [],
    cursos: Array.isArray(salvo.cursos) ? salvo.cursos : [],
    projetos: Array.isArray(salvo.projetos) ? salvo.projetos : [],
  }
}

export function salvarPerfil(perfil) {
  return gravarJSON(CHAVE_PERFIL, perfil, EVENTO_PERFIL)
}

// Itens que contam para a completude, calculada só com dados preenchidos.
export function itensCompletude(perfil) {
  const temLink = Object.values(perfil.links ?? {}).some((valor) => valor?.trim())
  return [
    { id: 'foto', rotulo: 'Foto de perfil', feito: Boolean(perfil.foto), ancora: 'imagens' },
    { id: 'cargo', rotulo: 'Cargo ou área desejada', feito: Boolean(perfil.cargo?.trim()), ancora: 'dados' },
    { id: 'local', rotulo: 'Localização', feito: Boolean(perfil.local?.trim()), ancora: 'dados' },
    { id: 'sobre', rotulo: 'Apresentação profissional', feito: Boolean(perfil.sobre?.trim()), ancora: 'resumo' },
    { id: 'tecnicas', rotulo: 'Três competências técnicas', feito: perfil.tecnicas.length >= 3, ancora: 'competencias' },
    { id: 'experiencias', rotulo: 'Uma experiência', feito: perfil.experiencias.length > 0, ancora: 'experiencias' },
    { id: 'formacoes', rotulo: 'Formação acadêmica', feito: perfil.formacoes.length > 0, ancora: 'formacao' },
    { id: 'links', rotulo: 'Um link profissional', feito: temLink, ancora: 'dados' },
  ]
}

export function completude(perfil) {
  const itens = itensCompletude(perfil)
  const feitos = itens.filter((item) => item.feito).length
  return { percentual: Math.round((feitos / itens.length) * 100), itens, pendentes: itens.filter((item) => !item.feito) }
}
