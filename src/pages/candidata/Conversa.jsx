import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { tempoRelativo } from '../../services/comunidade'
import { DISPONIVEL, enviarMensagem, lerConversa } from '../../services/recursos'
import { cn } from '../../lib/cn'

const LIMITE = 1000

// Uma conversa. Não simula tempo real: as mensagens novas aparecem ao
// enviar ou ao recarregar a página.
function Conversa() {
  const { id } = useParams()
  const r = useRecurso(DISPONIVEL.mensagens, () => lerConversa(id), [id])
  const [enviadas, setEnviadas] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  if (r.estado === 'indisponivel') {
    return (
      <>
        <TituloPagina titulo="Conversa" voltar={{ para: '/candidata/mensagens', rotulo: 'Mensagens' }} />
        <RecursoIndisponivel icone="mensagem" titulo="Mensagens ainda não disponíveis" descricao="Esta conversa não pode ser aberta porque a API de mensagens ainda não existe.">
          <Botao as={Link} to="/candidata/feed">
            Ir para o feed
          </Botao>
        </RecursoIndisponivel>
      </>
    )
  }
  if (r.estado === 'carregando') return <Esqueleto className="h-96 rounded-xl" />
  if (r.estado === 'erro') return <Aviso tipo="erro">{r.erro}</Aviso>

  const { conversa, mensagens = [] } = r.dados
  const todas = [...mensagens, ...enviadas]

  async function enviar(e) {
    e.preventDefault()
    const limpo = texto.trim()
    if (!limpo) return setErro('Escreva uma mensagem.')
    if (limpo.length > LIMITE) return setErro(`Use até ${LIMITE} caracteres.`)
    setEnviando(true)
    setErro('')
    try {
      const resposta = await enviarMensagem(id, limpo)
      setEnviadas((l) => [...l, resposta.mensagem])
      setTexto('')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <TituloPagina titulo={conversa.participante.nome} voltar={{ para: '/candidata/mensagens', rotulo: 'Mensagens' }} />
      <div className="flex flex-col rounded-xl border border-linha bg-branco">
        <ol className="flex flex-col gap-3 p-5">
          {todas.map((m) => (
            <li key={m.id} className={cn('max-w-[80%] rounded-lg px-4 py-2.5 text-sm', m.minha ? 'self-end bg-vinho text-white' : 'self-start bg-papel-2 text-tinta')}>
              <p className="whitespace-pre-line">{m.texto}</p>
              <p className={cn('mt-1 text-[11px]', m.minha ? 'text-white/70' : 'text-suave')}>{tempoRelativo(m.enviadaEm)}</p>
            </li>
          ))}
          {todas.length === 0 && <li className="text-center text-sm text-suave">Nenhuma mensagem ainda.</li>}
        </ol>
        <form onSubmit={enviar} className="flex flex-col gap-2 border-t border-linha p-4">
          <label htmlFor="nova-mensagem" className="sr-only">
            Escreva uma mensagem
          </label>
          <AreaTexto id="nova-mensagem" rows={2} maxLength={LIMITE} value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-20" />
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao type="submit" className="self-end" disabled={enviando || !texto.trim()}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </Botao>
        </form>
      </div>
    </>
  )
}

export default Conversa
