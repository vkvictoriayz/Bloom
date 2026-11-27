import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import AcessoSocial from '../components/conta/AcessoSocial'
import LembrarESenha from '../components/conta/LembrarESenha'
import Icone from '../components/Icone'
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
  const [lembrar, setLembrar] = useState(false)
  const [erros, setErros] = useState({})

  async function handleSubmit() {
    setMensagem('')
    const novos = {}
    if (!email.trim()) novos.email = 'Informe o e-mail corporativo.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) novos.email = 'Digite um e-mail válido.'
    if (!senha) novos.senha = 'Informe a senha.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setCarregando(true)
    try {
      const sessao = await entrarEmpresa({ email: email.trim(), senha })
      salvarSessao(sessao, { lembrar })
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
      titulo="Entre como empresa"
      subtitulo="Publique vagas e acompanhe candidaturas."
      aoEnviar={handleSubmit}
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
      <AcessoSocial tipo="empresa" />

      <Campo rotulo="E-mail corporativo" rotuloOculto erro={erros.email}>
        {(props) => (
          <div className="relative">
            <Icone nome="email" tamanho={17} className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-suave" />
            <Entrada
              {...props}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-mail corporativo"
              autoComplete="username"
              className="pl-11"
            />
          </div>
        )}
      </Campo>

      <CampoSenha rotulo="Senha" rotuloOculto icone="cadeado" valor={senha} aoMudar={setSenha} placeholder="Senha" erro={erros.senha} />

      <LembrarESenha lembrar={lembrar} aoMudar={setLembrar} linkSenha="/recuperar-senha?tipo=empresa" />

      {mensagem && <Aviso tipo={location.state?.mensagem === mensagem ? 'sucesso' : 'erro'}>{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={carregando}>
        {carregando ? 'Entrando…' : 'Entrar como empresa'}
      </Botao>
    </TelaAcesso>
  )
}

export default LoginEmpresa

