
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'

function CadastroEmpresa() {
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  function handleSubmit() {
    setMensagem('')

    if (!nome.trim() || !cnpj.trim() || !email.trim() || !senha) {
      setMensagem('Preencha todos os campos.')
      return
    }

    if (senha.length < 8) {
      setMensagem('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setMensagem('As senhas não coincidem.')
      return
    }

    try {
      const empresas = JSON.parse(
        localStorage.getItem('bloom-empresas-demo') || '[]'
      )

      if (!Array.isArray(empresas)) {
        setMensagem('Não foi possível ler os cadastros. Tente novamente.')
        return
      }

      const emailNormalizado = email.trim().toLowerCase()
      const cnpjNormalizado = cnpj.replace(/\D/g, '')

      if (empresas.some((empresa) => empresa.email === emailNormalizado)) {
        setMensagem('Já existe uma conta com esse e-mail.')
        return
      }

      if (cnpjNormalizado.length !== 14) {
        setMensagem('Informe um CNPJ com 14 números.')
        return
      }

      if (empresas.some((empresa) => empresa.cnpj === cnpjNormalizado)) {
        setMensagem('Já existe uma conta com esse CNPJ.')
        return
      }

      empresas.push({
        id: Date.now(),
        nome: nome.trim(),
        cnpj: cnpjNormalizado,
        email: emailNormalizado,
        senha,
      })

      localStorage.setItem('bloom-empresas-demo', JSON.stringify(empresas))

      navigate('/empresa/login', {
        state: { mensagem: 'Cadastro demonstrativo realizado! Entre com sua conta.' },
      })
    } catch {
      setMensagem('Não foi possível concluir o cadastro neste navegador.')
    }
  }

  return (
    <TelaAcesso
      etiqueta="Para empregadores"
      titulo="Cadastre sua empresa"
      subtitulo="Faça parte do BLOOM e prepare-se para conectar sua empresa a talentos da tecnologia."
      aoEnviar={handleSubmit}
      visual={{
        ilustracao: 'empresa',
        frase: 'Talentos da tecnologia, perto da sua empresa.',
        itens: ['Cadastro da sua organização', 'Acesso à área empresarial', 'Publicação de vagas em breve'],
      }}
      rodape={
        <>
          <p>
            Já possui uma conta? <LinkAcesso to="/empresa/login">Entrar</LinkAcesso>
          </p>
          <p>
            É candidata? <LinkAcesso to="/login">Acesse sua conta</LinkAcesso>
          </p>
        </>
      }
    >
      <Campo rotulo="Nome da empresa">
        {(props) => (
          <Entrada
            {...props}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Empresa Tecnologia Ltda."
            autoComplete="organization"
            required
          />
        )}
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo rotulo="CNPJ">
          {(props) => (
            <Entrada
              {...props}
              value={cnpj}
              onChange={(event) => setCnpj(event.target.value)}
              placeholder="14 números do CNPJ"
              inputMode="numeric"
              maxLength={18}
              required
            />
          )}
        </Campo>

        <Campo rotulo="E-mail corporativo">
          {(props) => (
            <Entrada
              {...props}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contato@empresa.com.br"
              autoComplete="email"
              required
            />
          )}
        </Campo>
      </div>

      <CampoSenha rotulo="Senha" valor={senha} aoMudar={setSenha} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
      <CampoSenha rotulo="Confirmar senha" valor={confirmarSenha} aoMudar={setConfirmarSenha} placeholder="Digite a senha novamente" autoComplete="new-password" />

      {mensagem && <Aviso tipo="erro">{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full">
        Criar conta empresarial
      </Botao>
    </TelaAcesso>
  )
}

export default CadastroEmpresa

