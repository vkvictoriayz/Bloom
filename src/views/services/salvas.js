import { gravarJSON, lerLista } from './armazenamento'
import { removerSalvaServidor, salvarVagaServidor } from './candidataApi'

// Vagas salvas (favoritas), na conta da candidata (/api/candidata/salvas).
// A lista local é a cópia que as telas leem; a área sincroniza ao abrir.
export const CHAVE_SALVAS = 'bloom-vagas-salvas'
export const EVENTO_SALVAS = 'bloom-salvas-atualizadas'

export function lerSalvas() {
  return lerLista(CHAVE_SALVAS).map(String)
}

export function estaSalva(id, lista = lerSalvas()) {
  return lista.includes(String(id))
}

// Liga/desliga na hora (a tela responde já) e confirma no servidor; se o
// servidor recusar, volta como estava e lança o erro.
export async function alternarSalva(id) {
  const atuais = lerSalvas()
  const alvo = String(id)
  const salvando = !atuais.includes(alvo)
  gravarJSON(CHAVE_SALVAS, salvando ? [...atuais, alvo] : atuais.filter((item) => item !== alvo), EVENTO_SALVAS)
  try {
    await (salvando ? salvarVagaServidor(alvo) : removerSalvaServidor(alvo))
  } catch (erro) {
    gravarJSON(CHAVE_SALVAS, atuais, EVENTO_SALVAS)
    throw erro
  }
}
