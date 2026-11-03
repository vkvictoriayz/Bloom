
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'
import { entrarEmpresa, salvarSessao } from '../services/auth'
import { destinoAposLogin } from '../services/destino'

function LoginEmpresa() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState(
    location.state?.mensagem || ''
  )
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit() {
    setMensagem('')

    if (!email.trim() || !senha) {
      setMensagem('Preencha o e-mail e a senha.')
      return
    }

    // Login real pela API (/api/auth/empresa/login): o tipo da conta vem
    // no token, e a área da empresa só abre para contas "empresa".
    setCarregando(true)
    try {
      const sessao = await entrarEmpresa({ email: email.trim(), senha })
      salvarSessao(sessao)
      navigate(destinoAposLogin(sessao))
    } catch (erro) {
      setMensagem(erro.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <TelaAcesso
      etiqueta="Área empresarial"
      titulo="Bem-vinda ao BLOOM"
      subtitulo="Entre na sua conta empresarial para continuar."
      aoEnviar={handleSubmit}
      visual={{
        ilustracao: 'empresa',
        frase: 'Talentos da tecnologia, perto da sua empresa.',
        itens: ['Cadastro da sua organização', 'Acesso à área empresarial', 'Publicação de vagas em breve'],
      }}
      rodape={
        <>
          <p>
            Ainda não tem conta? <LinkAcesso to="/empresa/cadastro">Cadastrar uma empresa</LinkAcesso>
          </p>
          <p>
            É candidata? <LinkAcesso to="/login">Acesse sua conta</LinkAcesso>
          </p>
        </>
      }
    >
      <Campo rotulo="E-mail corporativo">
        {(props) => (
          <Entrada
            {...props}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="contato@empresa.com.br"
            autoComplete="username"
            required
          />
        )}
      </Campo>

      <CampoSenha rotulo="Senha" valor={senha} aoMudar={setSenha} placeholder="Digite sua senha" />

      {mensagem && <Aviso tipo={location.state?.mensagem === mensagem ? 'sucesso' : 'erro'}>{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={carregando}>
        {carregando ? 'Entrando…' : 'Entrar como empresa'}
      </Botao>
    </TelaAcesso>
  )
}

export default LoginEmpresa

