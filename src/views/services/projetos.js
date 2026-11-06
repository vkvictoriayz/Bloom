import { lerPerfil, salvarPerfil } from './perfil'

import { criarProjetoServidor, editarProjetoServidor, excluirProjetoServidor } from './candidataApi'

// Projetos da candidata, salvos no servidor (/api/candidata/projetos). A
// cópia dentro do perfil local serve para as telas lerem na hora.

export const LIMITE_IMAGEM_PROJETO = 400 * 1024 // 400 KB, o mesmo limite do servidor

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

// Cria (sem id) ou atualiza (com id) no servidor e atualiza a cópia local.
// Devolve o projeto salvo; em caso de erro, lança com a mensagem da API.
export async function salvarProjeto(usuario, dados) {
  const { id, ...campos } = dados
  const projeto = id ? await editarProjetoServidor(id, campos) : await criarProjetoServidor(campos)
  const perfil = lerPerfil(usuario)
  const atuais = perfil.projetos.map(normalizar)
  const projetos = id ? atuais.map((p) => (p.id === id ? projeto : p)) : [projeto, ...atuais]
  salvarPerfil({ ...perfil, projetos })
  return projeto
}

export async function excluirProjeto(usuario, id) {
  await excluirProjetoServidor(id)
  const perfil = lerPerfil(usuario)
  salvarPerfil({ ...perfil, projetos: perfil.projetos.map(normalizar).filter((p) => p.id !== id) })
}
