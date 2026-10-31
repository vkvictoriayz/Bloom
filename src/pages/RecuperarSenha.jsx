import { useState } from 'react'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'

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
          Lembrou sua senha? <LinkAcesso to="/login">Voltar ao login</LinkAcesso>
        </p>
      }
    >
      <Campo rotulo="E-mail">
        {(props) => (
          <Entrada
            {...props}
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Campo>

      {mensagem && <Aviso tipo={tipoMensagem}>{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full">
        Recuperar senha
      </Botao>
    </TelaAcesso>
  )
}

export default RecuperarSenha
