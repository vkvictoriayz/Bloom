import { useState } from 'react'
import { Link } from 'react-router-dom'
import TelaAcesso from '../components/TelaAcesso'

function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState('')

  function handleSubmit() {
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setMensagem('Digite um e-mail válido!')
      setTipoMensagem('erro')
      return
    }

    setMensagem(
      'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.'
    )
    setTipoMensagem('sucesso')
  }

  return (
    <TelaAcesso
      titulo="Recuperar senha"
      subtitulo="Não se preocupe! Informe seu e-mail para recuperar o acesso."
      aoEnviar={handleSubmit}
      rodape={
        <p>
          Lembrou sua senha? <Link to="/login">Voltar ao login</Link>
        </p>
      }
    >
      <label className="campo">
        <span className="campo-rotulo">E-mail</span>
        <input
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      {mensagem && (
        <p className={`mensagem ${tipoMensagem}`} role="alert">
          {mensagem}
        </p>
      )}

      <button type="submit" className="botao">
        Recuperar senha
      </button>
    </TelaAcesso>
  )
}

export default RecuperarSenha
