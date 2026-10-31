// Leitura e escrita no localStorage com tolerância a erro (modo privado,
// cota cheia). Depois de gravar, avisamos as outras partes da tela por evento.

export function lerJSON(chave, padrao) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) ?? 'null')
    return valor ?? padrao
  } catch {
    return padrao
  }
}

export function lerLista(chave) {
  const valor = lerJSON(chave, [])
  return Array.isArray(valor) ? valor : []
}

// Devolve true se gravou. "evento" é disparado em window após gravar.
export function gravarJSON(chave, valor, evento) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
    if (evento) window.dispatchEvent(new Event(evento))
    return true
  } catch {
    return false
  }
}
