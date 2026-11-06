// Para onde cada tipo de conta vai depois de entrar.
// O tipo vem da sessão devolvida pela API (não de um botão da interface).
export function destinoAposLogin(sessao) {
  const tipo = sessao?.usuario?.tipo
  if (tipo === 'usuaria') return '/candidata/feed'
  if (tipo === 'empresa') return '/empresa/feed'
  return '/'
}
