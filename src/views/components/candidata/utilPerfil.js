// Utilitários de exibição do perfil (datas e links).

// "2023-05" -> "mai. 2023"
export function mes(valor) {
  if (!valor) return ''
  const [ano, m] = valor.split('-').map(Number)
  if (!ano || !m) return valor
  return new Date(ano, m - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export function periodo(inicio, fim, rotuloAtual = 'atual') {
  if (!inicio && !fim) return ''
  return `${mes(inicio) || '—'} – ${fim ? mes(fim) : rotuloAtual}`
}

// Aceita "github.com/ana" ou "https://..."; devolve null se não for um endereço válido.
export function enderecoSeguro(url) {
  if (!url) return null
  const completo = /^https?:\/\//i.test(url) ? url : `https://${url}`
  try {
    const endereco = new URL(completo)
    return ['http:', 'https:'].includes(endereco.protocol) && endereco.hostname.includes('.') ? endereco.href : null
  } catch {
    return null
  }
}

export const LINKS = [
  { chave: 'linkedin', rotulo: 'LinkedIn' },
  { chave: 'github', rotulo: 'GitHub' },
  { chave: 'portfolio', rotulo: 'Portfólio' },
]
