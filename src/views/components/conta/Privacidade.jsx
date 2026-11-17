import { useEffect, useState } from 'react'

import { Aviso } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import Interruptor from '../ui/Interruptor'
import { lerPrivacidade, salvarPrivacidade } from '../../services/recursos'

const OPCOES = [
  {
    chave: 'perfilPublico',
    titulo: 'Perfil visível',
    descricao: 'Aparecer na busca de talentos das empresas, nas sugestões de pessoas e nas listas de participantes. Suas publicações continuam no feed.',
  },
  {
    chave: 'mostrarExperiencia',
    titulo: 'Mostrar perfil profissional às empresas',
    descricao: 'Empresas veem resumo, experiência, formação, competências e projetos no seu perfil, mesmo sem candidatura.',
  },
  {
    chave: 'mostrarContato',
    titulo: 'Mostrar meu e-mail às empresas',
    descricao: 'Empresas veem seu e-mail no seu perfil. O telefone nunca é mostrado.',
  },
]

function Privacidade() {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [salvando, setSalvando] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    lerPrivacidade()
      .then((p) => ativo && setEstado({ tipo: 'pronto', valores: p }))
      .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [])

  async function mudar(chave, valor) {
    const anterior = estado.valores
    setErro('')
    setSalvando(chave)
    setEstado({ tipo: 'pronto', valores: { ...anterior, [chave]: valor } })
    try {
      const p = await salvarPrivacidade({ [chave]: valor })
      setEstado({ tipo: 'pronto', valores: p })
    } catch (e) {
      setEstado({ tipo: 'pronto', valores: anterior })
      setErro(e.message)
    } finally {
      setSalvando('')
    }
  }

  if (estado.tipo === 'carregando') return <Esqueleto className="h-40 rounded-lg" />
  if (estado.tipo === 'erro') return <Aviso tipo="erro">Não foi possível carregar a privacidade: {estado.texto}</Aviso>

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-linha rounded-xl border border-linha">
        {OPCOES.map((o) => (
          <li key={o.chave} className="flex items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-tinta">{o.titulo}</p>
              <p className="mt-0.5 text-sm text-suave">{o.descricao}</p>
            </div>
            <Interruptor ligado={estado.valores[o.chave]} aoMudar={(v) => mudar(o.chave, v)} rotulo={o.titulo} desativado={salvando === o.chave} />
          </li>
        ))}
      </ul>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <p className="text-xs text-suave">
        Ao se candidatar, a empresa daquela vaga sempre recebe seu e-mail e o seu perfil profissional, independentemente destas opções.
      </p>
    </div>
  )
}

export default Privacidade
