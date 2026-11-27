// Requisitos de senha nova. São os mesmos conferidos pela API (AuthController.validarSenha).
export const REQUISITOS_SENHA = [
  { id: 'tamanho', rotulo: 'Pelo menos 8 caracteres', ok: (s) => s.length >= 8 },
  { id: 'maiuscula', rotulo: 'Uma letra maiúscula', ok: (s) => /[A-Z]/.test(s) },
  { id: 'minuscula', rotulo: 'Uma letra minúscula', ok: (s) => /[a-z]/.test(s) },
  { id: 'numero', rotulo: 'Um número', ok: (s) => /\d/.test(s) },
  { id: 'especial', rotulo: 'Um caractere especial (! @ # ? …)', ok: (s) => /[^A-Za-z0-9]/.test(s) },
]

export const senhaForte = (senha) => REQUISITOS_SENHA.every((r) => r.ok(senha))

// Mensagem de erro para a primeira regra que falta (ou null se a senha atende a todas).
export function problemaSenha(senha) {
  if (!senha) return 'Crie uma senha.'
  const falta = REQUISITOS_SENHA.find((r) => !r.ok(senha))
  return falta ? `A senha precisa ter: ${falta.rotulo.toLowerCase()}.` : null
}
