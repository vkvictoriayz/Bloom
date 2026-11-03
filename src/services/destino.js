// Para onde cada tipo de conta vai depois de entrar.
// O tipo vem da sessão devolvida pela API (não de um botão da interface).
// A área privada da empresa será criada depois; por ora, só a candidata
// tem destino próprio.
export function destinoAposLogin(sessao) {
  return sessao?.usuario?.tipo === 'usuaria' ? '/candidata/feed' : '/'
}
