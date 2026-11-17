import { useState } from 'react'

import CampoSenha from '../CampoSenha'
import Botao from '../ui/Botao'
import { Aviso, Campo, Entrada } from '../ui/Campo'
import { obterSessao, salvarSessao } from '../../services/auth'
import { alterarEmail } from '../../services/recursos'

// Troca do e-mail de login (candidata ou empresa), pela API PUT /api/auth/email,
// que confere a senha. A sessão salva passa a mostrar o e-mail novo.
function FormularioEmail({ emailAtual }) {
  const [aberto, setAberto] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function enviar(e) {
    e.preventDefault()
    const limpo = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) return setEstado({ tipo: 'erro', texto: 'Digite um e-mail válido.' })
    if (!senha) return setEstado({ tipo: 'erro', texto: 'Digite sua senha para confirmar.' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await alterarEmail({ email: limpo, senha })
      const sessao = obterSessao()
      if (sessao) salvarSessao({ token: sessao.token, usuario: { ...sessao.usuario, email: r.usuario.email, emailVerificado: false } })
      setEstado({ tipo: 'sucesso', texto: `E-mail alterado. Use ${r.usuario.email} para entrar. Enviamos um link para confirmar o novo endereço.` })
      setEmail('')
      setSenha('')
      setAberto(false)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  if (!aberto) {
    return (
      <div className="flex flex-col items-start gap-3">
        {estado.tipo === 'sucesso' && <Aviso tipo="sucesso">{estado.texto}</Aviso>}
        <Botao variante="secundario" tamanho="sm" onClick={() => setAberto(true)}>
          Alterar e-mail
        </Botao>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4">
      <Campo rotulo="Novo e-mail" ajuda={`Atual: ${emailAtual}`}>
        {(p) => <Entrada {...p} type="email" autoComplete="email" maxLength={150} value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Campo>
      <CampoSenha rotulo="Sua senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" variante="secundario" disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Salvando…' : 'Salvar novo e-mail'}
        </Botao>
        <Botao type="button" variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

export default FormularioEmail
