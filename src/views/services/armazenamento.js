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

export function gravarJSON(chave, valor, evento) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
    if (evento) window.dispatchEvent(new Event(evento))
    return true
  } catch {
    return false
  }
}
