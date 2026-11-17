import { api } from './api.js'
import { obterSessao } from './auth.js'
import { lerPerfil, perfilVazio, salvarPerfil } from './perfil'
import { gravarJSON, lerLista } from './armazenamento'
import { CHAVE_SALVAS, EVENTO_SALVAS } from './salvas'

function chamar(caminho, opcoes = {}) {
  const token = obterSessao()?.token
  if (!token) return Promise.reject(new Error('Sessão inválida. Faça login novamente.'))
  return api(`/candidata${caminho}`, { ...opcoes, token })
}

const SECOES = ['nome', 'telefone', 'cargo', 'local', 'links', 'sobre', 'objetivo', 'tecnicas', 'comportamentais', 'experiencias', 'formacoes', 'cursos', 'preferencias']

function guardarNoCache(usuario, doServidor) {
  const atual = lerPerfil(usuario)
  const { atualizadoEm, ...dados } = doServidor
  salvarPerfil({ ...atual, ...dados, dono: usuario.email, email: usuario.email, sincronizadoEm: atualizadoEm ?? null })
}

export async function salvarSecoesPerfil(usuario, mudancas) {
  const corpo = Object.fromEntries(Object.entries(mudancas).filter(([chave]) => SECOES.includes(chave)))
  const r = await chamar('/perfil', { method: 'PUT', corpo })
  guardarNoCache(usuario, r.perfil)
  return r.perfil
}

export const criarProjetoServidor = (dados) => chamar('/projetos', { method: 'POST', corpo: dados }).then((r) => r.projeto)
export const editarProjetoServidor = (id, dados) => chamar(`/projetos/${encodeURIComponent(id)}`, { method: 'PUT', corpo: dados }).then((r) => r.projeto)
export const excluirProjetoServidor = (id) => chamar(`/projetos/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const salvarVagaServidor = (vagaId) => chamar(`/salvas/${String(vagaId).replace(/^b/, '')}`, { method: 'PUT' })
export const removerSalvaServidor = (vagaId) => chamar(`/salvas/${String(vagaId).replace(/^b/, '')}`, { method: 'DELETE' })

function temConteudo(p) {
  return Boolean(
    p.cargo || p.local || p.sobre || p.objetivo || p.telefone ||
      Object.values(p.links ?? {}).some(Boolean) ||
      p.tecnicas?.length || p.comportamentais?.length || p.experiencias?.length ||
      p.formacoes?.length || p.cursos?.length || p.projetos?.length
  )
}

let sincronizacao = null

export function sincronizarAreaCandidata(usuario) {
  sincronizacao = sincronizar(usuario)
  return sincronizacao
}

export function aguardarSincronizacao(usuario) {
  return (sincronizacao ?? sincronizarAreaCandidata(usuario)).then(
    () => ({ ok: true }),
    (erro) => ({ ok: false, erro: erro.message })
  )
}

async function sincronizar(usuario) {
  const [{ perfil }, { vagas }] = await Promise.all([chamar('/perfil'), chamar('/salvas')])
  const local = lerPerfil(usuario)
  const migrar = !temConteudo(perfil) && temConteudo(local) && !local.sincronizadoEm

  if (migrar) {
    const secoes = Object.fromEntries(SECOES.map((c) => [c, local[c] ?? perfilVazio(usuario)[c]]))
    secoes.nome = local.nome || usuario.nome
    secoes.sobre = (secoes.sobre ?? '').slice(0, 500)
    const r = await chamar('/perfil', { method: 'PUT', corpo: secoes })
    for (const projeto of local.projetos ?? []) {
      try {
        await criarProjetoServidor(projeto)
      } catch {
      }
    }
    const atualizado = await chamar('/perfil')
    guardarNoCache(usuario, { ...r.perfil, projetos: atualizado.perfil.projetos })
  } else {
    guardarNoCache(usuario, perfil)
  }

  const doServidor = vagas.map((id) => `b${id}`)
  const locaisReais = lerLista(CHAVE_SALVAS).map(String).filter((id) => /^b\d+$/.test(id) && !doServidor.includes(id))
  for (const id of locaisReais) {
    try {
      await salvarVagaServidor(id)
      doServidor.push(id)
    } catch {
    }
  }
  gravarJSON(CHAVE_SALVAS, doServidor, EVENTO_SALVAS)
}
