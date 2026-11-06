import { useEffect, useRef, useState } from 'react'
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

// Uma conversa. As mensagens novas chegam por consulta a cada 15 segundos
// (sem tempo real), e as enviadas aparecem assim que o servidor confirma.
const INTERVALO = 15000

export function Conversa({ base = '/candidata/mensagens' }) {
  const { id } = useParams()
  const [versao, setVersao] = useState(0)
  const r = useRecurso(DISPONIVEL.mensagens, () => lerConversa(id), [id, versao])
  const [enviadas, setEnviadas] = useState([])
  const fim = useRef(null)

  // Recarrega de tempos em tempos enquanto a página está aberta e visível.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setVersao((v) => v + 1)
    }, INTERVALO)
    return () => clearInterval(t)
  }, [])

  // Mensagens já recarregadas do servidor saem da lista local.
  const total = r.estado === 'pronto' ? r.dados.mensagens?.length : 0
  useEffect(() => {
    if (total) fim.current?.scrollIntoView({ block: 'nearest' })
  }, [total])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  if (r.estado === 'indisponivel') {
    return (
      <>
        <TituloPagina titulo="Conversa" voltar={{ para: base, rotulo: 'Mensagens' }} />
        <RecursoIndisponivel icone="mensagem" titulo="Mensagens ainda não disponíveis" descricao="Esta conversa não pode ser aberta porque a API de mensagens ainda não existe.">
          <Botao as={Link} to="/candidata/feed">
            Ir para o feed
          </Botao>
        </RecursoIndisponivel>
      </>
    )
  }
  // Ao recarregar, mantém o que já estava na tela em vez do esqueleto.
  if (r.estado === 'carregando' && !r.anterior) return <Esqueleto className="h-96 rounded-xl" />
  if (r.estado === 'erro') return <Aviso tipo="erro">{r.erro}</Aviso>

  const dados = r.estado === 'pronto' ? r.dados : r.anterior
  const { conversa, mensagens = [] } = dados
  const ids = new Set(mensagens.map((m) => m.id))
  const todas = [...mensagens, ...enviadas.filter((m) => !ids.has(m.id))]

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
      <TituloPagina titulo={conversa.participante.nome} descricao={conversa.vaga ? `Sobre a vaga ${conversa.vaga}` : undefined} voltar={{ para: base, rotulo: 'Mensagens' }} />
      <div className="flex flex-col rounded-xl border border-linha bg-branco">
        <ol className="flex flex-col gap-3 p-5">
          {todas.map((m) => (
            <li key={m.id} className={cn('max-w-[80%] rounded-lg px-4 py-2.5 text-sm', m.minha ? 'self-end bg-vinho text-white' : 'self-start bg-papel-2 text-tinta')}>
              <p className="whitespace-pre-line">{m.texto}</p>
              <p className={cn('mt-1 text-[11px]', m.minha ? 'text-white/70' : 'text-suave')}>{tempoRelativo(m.enviadaEm)}</p>
            </li>
          ))}
          {todas.length === 0 && <li className="text-center text-sm text-suave">Nenhuma mensagem ainda. Escreva a primeira.</li>}
          <li ref={fim} aria-hidden="true" />
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
