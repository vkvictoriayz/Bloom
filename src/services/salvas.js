import { gravarJSON, lerLista } from './armazenamento'

// Vagas salvas (favoritas), guardadas neste navegador.
export const CHAVE_SALVAS = 'bloom-vagas-salvas'
export const EVENTO_SALVAS = 'bloom-salvas-atualizadas'

export function lerSalvas() {
  return lerLista(CHAVE_SALVAS).map(String)
}

export function estaSalva(id, lista = lerSalvas()) {
  return lista.includes(String(id))
}

// Liga/desliga e devolve a nova lista.
export function alternarSalva(id) {
  const atuais = lerSalvas()
  const alvo = String(id)
  const novas = atuais.includes(alvo) ? atuais.filter((item) => item !== alvo) : [...atuais, alvo]
  gravarJSON(CHAVE_SALVAS, novas, EVENTO_SALVAS)
  return novas
}
