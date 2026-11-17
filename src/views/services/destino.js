export function destinoAposLogin(sessao) {
  const tipo = sessao?.usuario?.tipo
  if (tipo === 'usuaria') return '/candidata/feed'
  if (tipo === 'empresa') return '/empresa/feed'
  if (tipo === 'admin') return '/admin'
  return '/'
}
