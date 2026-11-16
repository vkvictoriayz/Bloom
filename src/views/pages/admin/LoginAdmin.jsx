import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import CampoSenha from '../../components/CampoSenha'
import TelaAcesso from '../../components/TelaAcesso'
import Botao from '../../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../../components/ui/Campo'
import { useSessao } from '../../hooks/useSessao'
import { entrarAdmin } from '../../services/admin'

// Entrada da equipe da Bloom. Não há cadastro: contas de administração são
// criadas pelo terminal (npm run admin:criar) ou por quem tem acesso total.
function LoginAdmin() {
  const navigate = useNavigate()
  const sessao = useSessao()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  if (sessao?.usuario?.tipo === 'admin') return <Navigate to="/admin" replace />

  async function entrar() {
    setErro('')
    if (!usuario.trim() || !senha) return setErro('Preencha o usuário e a senha.')
    setEntrando(true)
    try {
      await entrarAdmin(usuario.trim(), senha)
      navigate('/admin', { replace: true })
    } catch (e) {
      setErro(e.message)
      setEntrando(false)
    }
  }

  return (
    <TelaAcesso
      etiqueta="Administração"
      titulo="Equipe Bloom"
      subtitulo="Acesso restrito à equipe que administra a plataforma."
      aoEnviar={entrar}
      visual={{ ilustracao: 'conexoes', frase: 'Cuidar da comunidade é parte do produto.' }}
      rodape={<p>Não tem acesso? Peça a um administrador com acesso total.</p>}
    >
      <Campo rotulo="Usuário ou e-mail">
        {(props) => <Entrada {...props} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />}
      </Campo>
      <CampoSenha rotulo="Senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={entrando}>
        {entrando ? 'Entrando…' : 'Entrar no painel'}
      </Botao>
    </TelaAcesso>
  )
}

export default LoginAdmin
