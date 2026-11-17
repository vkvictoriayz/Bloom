import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import CampoSenha from '../../components/CampoSenha'
import TelaAcesso from '../../components/TelaAcesso'
import Botao from '../../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../../components/ui/Campo'
import { useSessao } from '../../hooks/useSessao'
import { confirmarCodigo, entrarAdmin } from '../../services/admin'

// Entrada da equipe da Bloom. Não há cadastro: contas de administração são
// criadas pelo terminal (npm run admin:criar) ou por quem tem acesso total.
// Com a verificação em duas etapas ligada, depois da senha vem o código do app.
function LoginAdmin() {
  const navigate = useNavigate()
  const sessao = useSessao()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [desafio, setDesafio] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sessao?.usuario?.tipo === 'admin') return <Navigate to={sessao.usuario.deveTrocarSenha ? '/admin/conta' : '/admin'} replace />

  async function entrar() {
    setErro('')
    if (!desafio && (!usuario.trim() || !senha)) return setErro('Preencha o usuário e a senha.')
    if (desafio && !codigo.trim()) return setErro('Digite o código do app autenticador.')
    setEnviando(true)
    try {
      const r = desafio ? await confirmarCodigo(desafio, codigo.trim()) : await entrarAdmin(usuario.trim(), senha)
      if (r.precisaCodigo) {
        setDesafio(r.desafio)
        setSenha('')
        setEnviando(false)
        return
      }
      navigate(r.usuario.deveTrocarSenha ? '/admin/conta' : '/admin', { replace: true })
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
      // Desafio vencido (5 min): volta para a senha.
      if (/Entre de novo|acabou/.test(e.message)) setDesafio(null)
    }
  }

  return (
    <TelaAcesso
      etiqueta="Administração"
      titulo="Equipe Bloom"
      subtitulo={desafio ? 'Digite o código de 6 dígitos do seu app autenticador.' : 'Acesso restrito à equipe que administra a plataforma.'}
      aoEnviar={entrar}
      visual={{ ilustracao: 'conexoes', frase: 'Cuidar da comunidade é parte do produto.' }}
      rodape={<p>Não tem acesso? Peça a um administrador com acesso total.</p>}
    >
      {desafio ? (
        <>
          <Campo rotulo="Código de verificação" ajuda="Sem o celular? Use um dos códigos de recuperação (formato ABCD-EFGH).">
            {(props) => (
              <Entrada
                {...props}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                autoComplete="one-time-code"
                inputMode="text"
                maxLength={9}
                autoFocus
                className="text-center text-xl tracking-[0.3em] tabular-nums"
              />
            )}
          </Campo>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={enviando}>
            {enviando ? 'Conferindo…' : 'Entrar no painel'}
          </Botao>
          <Botao
            type="button"
            variante="fantasma"
            className="w-full"
            onClick={() => {
              setDesafio(null)
              setCodigo('')
              setErro('')
            }}
          >
            Voltar
          </Botao>
        </>
      ) : (
        <>
          <Campo rotulo="Usuário ou e-mail">
            {(props) => <Entrada {...props} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />}
          </Campo>
          <CampoSenha rotulo="Senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Continuar'}
          </Botao>
        </>
      )}
    </TelaAcesso>
  )
}

export default LoginAdmin
