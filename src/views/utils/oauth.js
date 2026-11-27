// Leitura dos dados que o login com Google/GitHub devolve no fragmento (#) da URL.

// Tira o fragmento (#…) do endereço, sem recarregar a página.
export function limparFragmento() {
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

// Cadastro vindo do Google/GitHub: lê o token de pré-cadastro (#oauth=…), que traz nome e e-mail.
export function lerPreCadastro() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('oauth')
  if (!token) return null
  try {
    const binario = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    const p = JSON.parse(new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0))))
    if (p.exp * 1000 < Date.now()) return null
    return { token, email: p.email, nome: p.nome ?? '', provedor: p.provedor === 'github' ? 'GitHub' : 'Google' }
  } catch {
    return null
  }
}
