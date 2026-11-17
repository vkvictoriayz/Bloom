import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import Avatar from '../comunidade/Avatar'
import Esqueleto from '../ui/Esqueleto'
import { Aviso } from '../ui/Campo'
import { apagarMensagemCandidata, enviarMensagem, enviarMensagemCandidata, lerConversa, lerConversaCandidata } from '../../services/recursos'
import { cn } from '../../lib/cn'

// Painel de uma conversa, no estilo dos apps de mensagem: balões agrupados
// por dia, "Visto", apagar a própria mensagem (entre candidatas), carregar as
// anteriores e novas mensagens chegando sozinhas (consulta a cada 5 s, só o
// que é novo). Serve para conversas entre candidatas e com empresas.

const LIMITE = 1000
const INTERVALO = 5000

const hora = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

// "Hoje", "Ontem", "segunda-feira" (última semana) ou "12 de março de 2026".
function rotuloDia(d) {
  const data = new Date(d)
  const hoje = new Date()
  const inicio = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dias = Math.round((inicio(hoje) - inicio(data)) / 86400000)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 7) return data.toLocaleDateString('pt-BR', { weekday: 'long' })
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const mesmoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

// Uma mensagem (balão). As da mesma pessoa em sequência ficam "coladas".
function Balao({ m, primeira, ultima, visto, podeApagar, aoApagar }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <li className={cn('group flex flex-col', m.minha ? 'items-end' : 'items-start', primeira ? 'mt-3' : 'mt-0.5')}>
      <div className={cn('flex max-w-[85%] items-center gap-1 sm:max-w-[70%]', m.minha && 'flex-row-reverse')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm',
            m.apagada
              ? 'border border-dashed border-linha-forte bg-transparent text-suave italic shadow-none'
              : m.minha
                ? 'bg-vinho text-white'
                : 'bg-branco text-tinta ring-1 ring-linha',
            m.minha ? (ultima ? 'rounded-br-md' : '') : ultima ? 'rounded-bl-md' : ''
          )}
        >
          {m.apagada ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Icone nome="fechar" tamanho={13} /> {m.minha ? 'Você apagou esta mensagem' : 'Mensagem apagada'}
            </span>
          ) : (
            <p className="break-words whitespace-pre-line">{m.texto}</p>
          )}
          <span className={cn('mt-0.5 block text-right text-[10px] tabular-nums', m.minha && !m.apagada ? 'text-white/70' : 'text-suave')}>
            <time dateTime={new Date(m.enviadaEm).toISOString()}>{hora(m.enviadaEm)}</time>
            {m.minha && !m.apagada && (
              <span className="ml-1" aria-label={m.lida ? 'lida' : 'enviada'}>
                {m.lida ? '✓✓' : '✓'}
              </span>
            )}
          </span>
        </div>
        {podeApagar && !m.apagada && !confirmando && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="grid size-7 shrink-0 place-items-center rounded-full text-suave opacity-0 transition-opacity group-hover:opacity-100 hover:bg-papel-2 hover:text-erro focus-visible:opacity-100"
            aria-label="Apagar mensagem"
            title="Apagar mensagem"
          >
            <Icone nome="lixeira" tamanho={14} />
          </button>
        )}
      </div>
      {confirmando && (
        <span className="mt-1 flex items-center gap-2 text-xs">
          <span className="text-tinta-2">Apagar para as duas?</span>
          <button
            type="button"
            className="font-semibold text-erro hover:underline"
            onClick={async () => {
              await aoApagar(m)
              setConfirmando(false)
            }}
          >
            Apagar
          </button>
          <button type="button" className="font-semibold text-tinta-2 hover:underline" onClick={() => setConfirmando(false)}>
            Cancelar
          </button>
        </span>
      )}
      {visto && <span className="mt-1 text-[11px] font-medium text-suave">Visto</span>}
    </li>
  )
}

// tipo: "candidatas" | "empresas". base: rota da lista (para o "voltar" no
// celular e para links). aoMudar: avisa a lista (prévia da última mensagem).
export function Chat({ tipo, id, base, aoMudar, className }) {
  const entreCandidatas = tipo === 'candidatas'
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [carregandoAntigas, setCarregandoAntigas] = useState(false)
  const rolagem = useRef(null)
  const campo = useRef(null)
  const colado = useRef(true) // a tela está no fim? (para rolar quando chega mensagem)
  const alturaAntes = useRef(null)

  const ler = useCallback((opcoes) => (entreCandidatas ? lerConversaCandidata(id, opcoes) : lerConversa(id, opcoes)), [entreCandidatas, id])

  // Carga inicial (cada conversa monta um Chat novo, pela "key" de quem usa).
  useEffect(() => {
    let ativo = true
    colado.current = true
    ler()
      .then((r) => ativo && setEstado({ tipo: 'pronto', conversa: r.conversa, mensagens: r.mensagens ?? [], temMais: Boolean(r.temMais), lidasAte: r.lidasAte ?? null }))
      .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [ler])

  // Novas mensagens: só o que veio depois da última que a tela tem.
  const ultimaId = estado.mensagens?.at(-1)?.id
  useEffect(() => {
    if (estado.tipo !== 'pronto') return
    const t = setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const r = await ler(ultimaId ? { depois: ultimaId } : {})
        setEstado((e) => {
          if (e.tipo !== 'pronto') return e
          const conhecidas = new Set(e.mensagens.map((m) => m.id))
          const novas = (r.mensagens ?? []).filter((m) => !conhecidas.has(m.id))
          const lidasAte = r.lidasAte ?? e.lidasAte
          // "Visto": marca como lidas as minhas até onde a outra pessoa leu.
          const mensagens = [...e.mensagens, ...novas].map((m) => (m.minha && lidasAte && m.id <= lidasAte ? { ...m, lida: true } : m))
          if (!novas.length && lidasAte === e.lidasAte) return e
          return { ...e, mensagens, lidasAte }
        })
        if (r.mensagens?.length) aoMudar?.()
      } catch {
        // sem conexão agora: tenta de novo no próximo intervalo
      }
    }, INTERVALO)
    return () => clearInterval(t)
  }, [estado.tipo, ultimaId, ler, aoMudar])

  // Rola para o fim quando chega mensagem (se a pessoa já estava no fim) e
  // mantém a posição quando as anteriores entram em cima.
  const total = estado.mensagens?.length ?? 0
  useLayoutEffect(() => {
    const caixa = rolagem.current
    if (!caixa) return
    if (alturaAntes.current !== null) {
      caixa.scrollTop = caixa.scrollHeight - alturaAntes.current
      alturaAntes.current = null
    } else if (colado.current) {
      caixa.scrollTop = caixa.scrollHeight
    }
  }, [total, estado.tipo])

  function aoRolar() {
    const caixa = rolagem.current
    colado.current = caixa.scrollHeight - caixa.scrollTop - caixa.clientHeight < 80
  }

  async function anteriores() {
    if (!estado.mensagens.length) return
    setCarregandoAntigas(true)
    try {
      const r = await ler({ antes: estado.mensagens[0].id })
      alturaAntes.current = rolagem.current?.scrollHeight ?? null
      setEstado((e) => ({ ...e, mensagens: [...r.mensagens, ...e.mensagens], temMais: Boolean(r.temMais) }))
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregandoAntigas(false)
    }
  }

  async function enviar(e) {
    e?.preventDefault()
    const limpo = texto.trim()
    if (!limpo || enviando) return
    if (limpo.length > LIMITE) return setErro(`Use até ${LIMITE} caracteres.`)
    setEnviando(true)
    setErro('')
    try {
      const r = entreCandidatas ? await enviarMensagemCandidata(id, limpo) : await enviarMensagem(id, limpo)
      colado.current = true
      setEstado((s) => ({ ...s, mensagens: [...s.mensagens.filter((m) => m.id !== r.mensagem.id), r.mensagem] }))
      setTexto('')
      aoMudar?.()
      campo.current?.focus()
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  async function apagar(m) {
    setErro('')
    try {
      const r = await apagarMensagemCandidata(id, m.id)
      setEstado((s) => ({ ...s, mensagens: s.mensagens.map((x) => (x.id === m.id ? r.mensagem : x)) }))
      aoMudar?.()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  // Enter envia; Shift+Enter quebra a linha.
  function teclas(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      enviar()
    }
  }

  if (estado.tipo === 'carregando') {
    return (
      <div className={cn('flex flex-col gap-3 p-5', className)}>
        <Esqueleto className="h-12 w-60 rounded-xl" />
        <Esqueleto className="h-10 w-2/3 rounded-2xl" />
        <Esqueleto className="ml-auto h-10 w-1/2 rounded-2xl" />
      </div>
    )
  }
  if (estado.tipo === 'erro') {
    return (
      <div className={cn('p-5', className)}>
        <Aviso tipo="erro">{estado.texto}</Aviso>
      </div>
    )
  }

  const { conversa, mensagens } = estado
  const pessoa = conversa.participante
  const ultimaMinha = [...mensagens].reverse().find((m) => m.minha && !m.apagada)
  const naEmpresa = base.startsWith('/empresa')
  const linkPerfil = entreCandidatas
    ? `/candidata/pessoas/${pessoa.id}`
    : naEmpresa
      ? conversa.candidaturaId && `/empresa/candidaturas/${conversa.candidaturaId}`
      : `/candidata/empresas/${pessoa.id}`
  const subtitulo = entreCandidatas ? pessoa.area || 'Integrante da Bloom' : conversa.vaga ? `Sobre a vaga ${conversa.vaga}` : 'Processo seletivo'

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 border-b border-linha bg-branco px-4 py-3">
        <Link to={!entreCandidatas && !naEmpresa ? `${base}?aba=empresas` : base} className="grid size-9 shrink-0 place-items-center rounded-full text-tinta-2 hover:bg-papel-2 lg:hidden" aria-label="Voltar para as conversas">
          <Icone nome="voltar" tamanho={18} />
        </Link>
        {linkPerfil ? (
          <Link to={linkPerfil} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl hover:text-vinho">
            <Avatar nome={pessoa.nome} foto={pessoa.foto} tamanho="md" />
            <span className="min-w-0">
              <span className="block truncate font-bold text-tinta">{pessoa.nome}</span>
              <span className="block truncate text-xs text-suave">{subtitulo}</span>
            </span>
          </Link>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar nome={pessoa.nome} foto={pessoa.foto} tamanho="md" />
            <span className="min-w-0">
              <span className="block truncate font-bold text-tinta">{pessoa.nome}</span>
              <span className="block truncate text-xs text-suave">{subtitulo}</span>
            </span>
          </span>
        )}
        {linkPerfil && (
          <Link to={linkPerfil} className="hidden shrink-0 rounded-full border border-linha-forte px-3 py-1.5 text-xs font-semibold text-tinta-2 hover:border-vinho hover:text-vinho sm:inline-flex">
            {entreCandidatas ? 'Ver perfil' : naEmpresa ? 'Ver candidatura' : 'Ver empresa'}
          </Link>
        )}
      </header>

      {/* Mensagens */}
      <div ref={rolagem} onScroll={aoRolar} className="min-h-0 flex-1 overflow-y-auto bg-papel px-4 py-4 sm:px-6" aria-live="polite">
        {estado.temMais && (
          <div className="mb-3 flex justify-center">
            <button type="button" onClick={anteriores} disabled={carregandoAntigas} className="rounded-full bg-branco px-4 py-1.5 text-xs font-semibold text-tinta-2 ring-1 ring-linha hover:text-vinho disabled:opacity-60">
              {carregandoAntigas ? 'Carregando…' : 'Carregar mensagens anteriores'}
            </button>
          </div>
        )}
        {mensagens.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <Avatar nome={pessoa.nome} foto={pessoa.foto} tamanho="lg" />
            <p className="font-semibold text-tinta">{pessoa.nome}</p>
            <p className="max-w-xs text-sm text-suave">{entreCandidatas ? 'Diga oi! Conversas entre integrantes ficam só entre vocês duas.' : 'Nenhuma mensagem ainda. Escreva a primeira.'}</p>
          </div>
        ) : (
          <ol className="flex flex-col">
            {mensagens.map((m, i) => {
              const anterior = mensagens[i - 1]
              const proxima = mensagens[i + 1]
              const novoDia = !anterior || !mesmoDia(anterior.enviadaEm, m.enviadaEm)
              const primeira = novoDia || anterior.minha !== m.minha
              const ultima = !proxima || proxima.minha !== m.minha || !mesmoDia(proxima.enviadaEm, m.enviadaEm)
              return (
                <FragmentoDia key={m.id} dia={novoDia ? rotuloDia(m.enviadaEm) : null}>
                  <Balao
                    m={m}
                    primeira={primeira}
                    ultima={ultima}
                    visto={m.id === ultimaMinha?.id && m.lida}
                    podeApagar={entreCandidatas && m.minha}
                    aoApagar={apagar}
                  />
                </FragmentoDia>
              )
            })}
          </ol>
        )}
      </div>

      {/* Escrever */}
      <form onSubmit={enviar} className="border-t border-linha bg-branco p-3">
        {erro && (
          <Aviso tipo="erro" className="mb-2">
            {erro}
          </Aviso>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor={`mensagem-${tipo}-${id}`} className="sr-only">
            Escreva uma mensagem para {pessoa.nome}
          </label>
          <textarea
            ref={campo}
            id={`mensagem-${tipo}-${id}`}
            rows={1}
            maxLength={LIMITE}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
            }}
            onKeyDown={teclas}
            placeholder="Escreva uma mensagem…"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-transparent bg-papel-2 px-4 py-2.5 text-[15px] text-tinta placeholder:text-suave focus:border-vinho focus:bg-branco focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-vinho text-white transition-colors hover:bg-vinho-escuro disabled:opacity-40"
            aria-label="Enviar mensagem"
          >
            <Icone nome="seta" tamanho={18} className="-rotate-45" />
          </button>
        </div>
        <p className="mt-1 flex justify-between px-2 text-[11px] text-suave">
          <span className="max-sm:hidden">Enter envia · Shift+Enter quebra a linha</span>
          {texto.length > LIMITE * 0.8 && (
            <span className="tabular-nums">
              {texto.length}/{LIMITE}
            </span>
          )}
        </p>
      </form>
    </div>
  )
}

// Separador "Hoje", "Ontem"… antes da primeira mensagem de cada dia.
function FragmentoDia({ dia, children }) {
  return (
    <>
      {dia && (
        <li className="my-3 flex justify-center" aria-label={dia}>
          <span className="rounded-full bg-branco px-3 py-1 text-[11px] font-semibold text-tinta-2 capitalize ring-1 ring-linha">{dia}</span>
        </li>
      )}
      {children}
    </>
  )
}

export default Chat
