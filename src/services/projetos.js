import { lerPerfil, salvarPerfil } from './perfil'

// Projetos da candidata. Ficam dentro do perfil (mesma persistência do
// perfil, neste navegador), até existir uma API de projetos.

export const LIMITE_IMAGEM_PROJETO = 400 * 1024 // 400 KB, por causa do armazenamento local

function novoId() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// Projetos antigos (do editor de perfil) tinham só nome, link e descrição
// e nenhum id: completamos os campos sem perder o que foi salvo.
function normalizar(projeto, i) {
  return {
    id: projeto.id ?? `antigo-${i}`,
    nome: projeto.nome ?? '',
    descricao: projeto.descricao ?? '',
    imagem: projeto.imagem ?? '',
    tecnologias: Array.isArray(projeto.tecnologias) ? projeto.tecnologias : [],
    repositorio: projeto.repositorio ?? '',
    demo: projeto.demo ?? projeto.link ?? '',
    inicio: projeto.inicio ?? '',
    fim: projeto.fim ?? '',
  }
}

export function lerProjetos(usuario) {
  return lerPerfil(usuario).projetos.map(normalizar)
}

export function buscarProjeto(usuario, id) {
  return lerProjetos(usuario).find((p) => p.id === id) ?? null
}

// Cria (sem id) ou atualiza (com id). Devolve o projeto salvo ou null.
export function salvarProjeto(usuario, dados) {
  const perfil = lerPerfil(usuario)
  const atuais = perfil.projetos.map(normalizar)
  const projeto = { ...dados, id: dados.id ?? novoId() }
  const projetos = dados.id ? atuais.map((p) => (p.id === dados.id ? projeto : p)) : [...atuais, projeto]
  return salvarPerfil({ ...perfil, projetos }) ? projeto : null
}

export function excluirProjeto(usuario, id) {
  const perfil = lerPerfil(usuario)
  const projetos = perfil.projetos.map(normalizar).filter((p) => p.id !== id)
  return salvarPerfil({ ...perfil, projetos })
}
