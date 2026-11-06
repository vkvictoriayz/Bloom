import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { DISPONIVEL, enviarMensagem, enviarMensagemCandidata, lerConversa, lerConversaCandidata } from '../../services/recursos'
import { cn } from '../../lib/cn'

const LIMITE = 1000

// Uma conversa. As mensagens novas chegam por consulta a cada 15 segundos
// (sem tempo real), e as enviadas aparecem assim que o servidor confirma.
const INTERVALO = 15000

// "14:32" (hoje), "ontem, 14:32" ou "05 nov, 14:32".
function horario(data) {
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return ''
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const hoje = new Date()
  const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1)
  if (d.toDateString() === hoje.toDateString()) return hora
  if (d.toDateString() === ontem.toDateString()) return `ontem, ${hora}`
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}, ${hora}`
}

// tipo "candidatas": conversa entre integrantes; "empresas": com empresa
// (ligada a uma candidatura). "base" é a rota da lista de mensagens.
export function Conversa({ base = '/candidata/mensagens', tipo = 'empresas' }) {
  const { id } = useParams()
  const [versao, setVersao] = useState(0)
  const entreCandidatas = tipo === 'candidatas'
  const r = useRecurso(DISPONIVEL.mensagens, () => (entreCandidatas ? lerConversaCandidata(id) : lerConversa(id)), [id, versao, tipo])
  const voltar = { para: base === '/candidata/mensagens' && !entreCandidatas ? `${base}?aba=empresas` : base, rotulo: 'Mensagens' }
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
        <TituloPagina titulo="Conversa" voltar={voltar} />
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
      const resposta = entreCandidatas ? await enviarMensagemCandidata(id, limpo) : await enviarMensagem(id, limpo)
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
      <TituloPagina
        titulo={conversa.participante.nome}
        descricao={conversa.vaga ? `Sobre a vaga ${conversa.vaga}` : entreCandidatas ? 'Conversa entre integrantes da Bloom' : undefined}
        voltar={voltar}
        acoes={
          entreCandidatas && (
            <Botao as={Link} to={`/candidata/pessoas/${conversa.participante.id}`} variante="secundario" tamanho="sm">
              Ver perfil
            </Botao>
          )
        }
      />
      <div className="flex flex-col rounded-xl border border-linha bg-branco">
        <ol className="flex flex-col gap-3 p-5">
          {todas.map((m, i) => (
            <li key={m.id} className={cn('max-w-[85%] rounded-lg px-4 py-2.5 text-sm sm:max-w-[75%]', m.minha ? 'self-end bg-vinho text-white' : 'self-start bg-papel-2 text-tinta')}>
              <p className="break-words whitespace-pre-line">{m.texto}</p>
              <p className={cn('mt-1 text-[11px]', m.minha ? 'text-white/75' : 'text-suave')}>
                <time dateTime={new Date(m.enviadaEm).toISOString()}>{horario(m.enviadaEm)}</time>
                {m.minha && i === todas.length - 1 && m.lida && ' · vista'}
              </p>
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
