import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import TelaAcesso from '../components/TelaAcesso'
import { Aviso } from '../components/ui/Campo'
import { buscarSessaoAtual, salvarSessao } from '../services/auth'
import { destinoAposLogin } from '../services/destino'

// Recebe o login do Google/GitHub (#token=…), salva a sessão e leva para a área da conta.
function EntrarSocial() {
  const navigate = useNavigate()
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'))
  const [erro, setErro] = useState(token ? '' : 'Não recebemos os dados do login. Tente entrar de novo.')

  useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname)
    if (!token) return
    buscarSessaoAtual(token)
      .then(({ usuario }) => {
        const sessao = { token, usuario }
        salvarSessao(sessao)
        navigate(destinoAposLogin(sessao), { replace: true })
      })
      .catch((e) => setErro(e.message))
  }, [navigate, token])

  return (
    <TelaAcesso titulo={erro ? 'Não foi possível entrar' : 'Entrando…'} subtitulo={erro ? undefined : 'Só um instante.'} semFormulario>
      {erro && (
        <>
          <Aviso tipo="erro">{erro}</Aviso>
          <Link to="/login" className="font-semibold text-vinho hover:underline">
            Voltar para o login
          </Link>
        </>
      )}
    </TelaAcesso>
  )
}

export default EntrarSocial
