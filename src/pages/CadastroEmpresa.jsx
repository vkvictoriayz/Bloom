
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'
import { cadastrarEmpresa, salvarSessao } from '../services/auth'
import { destinoAposLogin } from '../services/destino'

function CadastroEmpresa() {
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit() {
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

    if (cnpj.replace(/\D/g, '').length !== 14) {
      setMensagem('Informe um CNPJ com 14 números.')
      return
    }

    // Cadastro real pela API (/api/auth/empresa/cadastro), que já devolve a
    // sessão da empresa.
    setCarregando(true)
    try {
      const sessao = await cadastrarEmpresa({ nome: nome.trim(), cnpj, email: email.trim(), senha, confirmarSenha })
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

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={carregando}>
        {carregando ? 'Criando conta…' : 'Criar conta empresarial'}
      </Botao>
    </TelaAcesso>
  )
}

export default CadastroEmpresa

