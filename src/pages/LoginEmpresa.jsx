
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'

function LoginEmpresa() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState(
    location.state?.mensagem || ''
  )

  function handleSubmit() {
    setMensagem('')

    if (!email.trim() || !senha) {
      setMensagem('Preencha o e-mail e a senha.')
      return
    }

    try {
      const empresas = JSON.parse(
        localStorage.getItem('bloom-empresas-demo') || '[]'
      )

      const empresa = Array.isArray(empresas)
        ? empresas.find(
            (item) =>
              item.email === email.trim().toLowerCase() &&
              item.senha === senha
          )
        : null

      if (!empresa) {
        setMensagem('E-mail ou senha incorretos. Confira os dados ou cadastre sua empresa.')
        return
      }

      // Acesso demonstrativo: não representa autenticação segura.
      sessionStorage.setItem(
        'bloom-empresa-logada-demo',
        JSON.stringify({
          id: empresa.id,
          nome: empresa.nome,
          email: empresa.email,
        })
      )

      navigate('/empresa/painel')
    } catch {
      setMensagem('Não foi possível realizar o login. Tente novamente.')
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

      <Botao type="submit" tamanho="lg" className="mt-2 w-full">
        Entrar como empresa
      </Botao>
    </TelaAcesso>
  )
}

export default LoginEmpresa

