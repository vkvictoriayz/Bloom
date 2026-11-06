import { useEffect, useState } from 'react'

import { Aviso } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import Interruptor from '../ui/Interruptor'
import { lerPreferenciasNotificacao, salvarPreferenciasNotificacao } from '../../services/recursos'

// Rótulos de cada categoria (a API devolve só as que valem para a conta).
const TEXTOS = {
  vagasCompativeis: ['Novas vagas compatíveis', 'Quando uma empresa publica uma vaga que combina com suas competências ou áreas de interesse.'],
  candidaturas: ['Candidaturas', null],
  mensagens: ['Mensagens', null],
  convites: ['Convites para processos seletivos', 'Quando uma empresa convida você para uma vaga.'],
  comunidade: ['Comunidade', 'Novas seguidoras, curtidas e comentários nas suas publicações.'],
  plataforma: ['Atualizações da Bloom', 'Avisos importantes da plataforma e da sua assinatura.'],
}
const TEXTO_CONTA = {
  usuaria: { candidaturas: 'Mudanças de etapa nas suas candidaturas.', mensagens: 'Mensagens recebidas de empresas.' },
  empresa: { candidaturas: 'Novas candidaturas nas suas vagas.', mensagens: 'Mensagens recebidas de candidatas.' },
}

// Preferências de notificação (API /api/notificacoes/preferencias). Cada
// interruptor salva na hora; se o servidor recusar, volta como estava.
function PreferenciasNotificacao({ tipoConta = 'usuaria' }) {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [salvando, setSalvando] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    lerPreferenciasNotificacao()
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
      setEstado({ tipo: 'pronto', valores: await salvarPreferenciasNotificacao({ [chave]: valor }) })
    } catch (e) {
      setEstado({ tipo: 'pronto', valores: anterior })
      setErro(e.message)
    } finally {
      setSalvando('')
    }
  }

  if (estado.tipo === 'carregando') return <Esqueleto className="h-48 rounded-lg" />
  if (estado.tipo === 'erro') return <Aviso tipo="erro">Não foi possível carregar as preferências: {estado.texto}</Aviso>

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-linha rounded-xl border border-linha">
        {Object.keys(estado.valores).map((chave) => {
          const [titulo, descricao] = TEXTOS[chave] ?? [chave, null]
          return (
            <li key={chave} className="flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tinta">{titulo}</p>
                <p className="mt-0.5 text-sm text-suave">{descricao ?? TEXTO_CONTA[tipoConta]?.[chave]}</p>
              </div>
              <Interruptor ligado={estado.valores[chave]} aoMudar={(v) => mudar(chave, v)} rotulo={titulo} desativado={salvando === chave} />
            </li>
          )
        })}
      </ul>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <p className="text-xs text-suave">Os avisos aparecem em Notificações, no sino do topo. Aviso por e-mail ainda não está disponível.</p>
    </div>
  )
}

export default PreferenciasNotificacao
