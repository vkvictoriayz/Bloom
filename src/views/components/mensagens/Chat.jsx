import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import Avatar from '../comunidade/Avatar'
import { FormularioDenuncia } from '../conta/Denunciar'
import Esqueleto from '../ui/Esqueleto'
import { Aviso } from '../ui/Campo'
import { urlImagem } from '../../services/api'
import { ACEITAR_IMAGEM, prepararImagem } from '../../services/imagemPublicacao'
import {
  apagarMensagemCandidata,
  apagarMensagemEmpresa,
  bloquearConversa,
  desbloquearConversa,
  enviarMensagem,
  enviarMensagemCandidata,
  lerConversa,
  lerConversaCandidata,
} from '../../services/recursos'
import { cn } from '../../lib/cn'

const LIMITE = 1000
const INTERVALO = 5000

const hora = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

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

function linkDaPublicacao(p, base) {
  const naEmpresa = base.startsWith('/empresa')
  if (p.origem === 'empresa') return naEmpresa ? null : `/candidata/empresas/${p.autor.id}`
  return naEmpresa ? `/empresa/talentos/${p.autor.id}` : `/candidata/publicacoes/${p.id}`
}

function CartaoCompartilhado({ p, minha, base }) {
  if (p.indisponivel) {
    return (
      <span className={cn('mb-1 flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs italic', minha ? 'border-white/40 text-white/80' : 'border-linha-forte text-suave')}>
        <Icone nome="info" tamanho={13} /> Esta publicação não está mais disponível.
      </span>
    )
  }
  const para = linkDaPublicacao(p, base)
  const corpo = (
    <>
      <span className="flex items-center gap-2 px-3 pt-2.5">
        <Avatar nome={p.autor.nome} foto={p.autor.foto} tamanho="sm" className={cn('size-7 text-[10px]', p.origem === 'empresa' && 'rounded-lg')} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-tinta">{p.autor.nome}</span>
          <span className="block text-[10px] text-suave">Publicação na Bloom</span>
        </span>
      </span>
      {p.texto && <span className="line-clamp-4 px-3 pt-2 text-[13px] leading-snug whitespace-pre-line text-tinta-2">{p.texto}</span>}
      {p.imagem && (
        <img src={urlImagem(p.imagem.url)} alt="" className="mt-2 max-h-40 w-full object-cover" loading="lazy" />
      )}
      <span className="mt-2 flex items-center justify-between gap-2 border-t border-linha px-3 py-1.5 text-[11px] font-semibold text-vinho">
        {para ? (p.origem === 'empresa' ? 'Ver empresa' : base.startsWith('/empresa') ? 'Ver perfil da autora' : 'Abrir publicação') : 'Publicação da empresa'}
        {para && <Icone nome="seta" tamanho={12} />}
      </span>
    </>
  )
  const estilo = 'mb-1.5 block w-64 max-w-full overflow-hidden rounded-xl bg-branco text-left ring-1 ring-linha transition-transform hover:-translate-y-0.5'
  return para ? (
    <Link to={para} className={estilo}>
      {corpo}
    </Link>
  ) : (
    <span className={estilo}>{corpo}</span>
  )
}

function Balao({ m, primeira, ultima, visto, podeApagar, aoApagar, base = '' }) {
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
            <>
              {m.imagem && (
                <a href={urlImagem(`/imagens/${m.imagem.chave}`)} target="_blank" rel="noreferrer" className="-mx-1.5 -mt-0.5 mb-1 block overflow-hidden rounded-xl" aria-label="Abrir a imagem em tamanho real">
                  <img
                    src={urlImagem(`/imagens/${m.imagem.chave}`)}
                    alt="Imagem enviada na conversa"
                    width={m.imagem.largura ?? undefined}
                    height={m.imagem.altura ?? undefined}
                    className="max-h-72 w-full max-w-xs object-cover"
                    loading="lazy"
                  />
                </a>
              )}
              {m.publicacao && <CartaoCompartilhado p={m.publicacao} minha={m.minha} base={base} />}
              {m.texto && <p className="break-words whitespace-pre-line">{m.texto}</p>}
            </>
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

const EMOJIS = ['😊', '👋', '🙏', '👏', '🎉', '💜', '🌸', '✨', '👍', '🚀', '💡', '📅']

function ajustarAltura(el) {
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight + 2, 160)}px`
  el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden'
}

function respostasRapidas({ entreCandidatas, naEmpresa, nome }) {
  if (entreCandidatas) return ['Oi! Tudo bem? 😊', 'Adorei sua publicação!', 'Quer trocar uma ideia sobre a área?', 'Obrigada pela ajuda! 💜']
  if (naEmpresa)
    return [
      `Olá, ${nome}! Obrigada pela sua candidatura.`,
      'Podemos agendar uma conversa esta semana?',
      'Você poderia enviar seu portfólio ou GitHub?',
      'Você avançou para a próxima etapa! 🎉',
      'Qual a sua disponibilidade de horário?',
    ]
  return ['Olá! Obrigada pelo retorno.', 'Tenho disponibilidade esta semana.', 'Segue o link do meu portfólio:', 'Fico à disposição para qualquer dúvida.']
}

const COR_ETAPA = {
  Recebida: 'bg-papel-2 text-tinta-2',
  'Em análise': 'bg-alerta-claro text-alerta',
  'Em entrevista': 'bg-blush text-vinho',
  Aprovada: 'bg-sucesso-claro text-sucesso',
  Reprovada: 'bg-erro-claro text-erro',
}

export function Chat({ tipo, id, base, aoMudar, className }) {
  const entreCandidatas = tipo === 'candidatas'
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [carregandoAntigas, setCarregandoAntigas] = useState(false)
  const [anexo, setAnexo] = useState(null)
  const [menu, setMenu] = useState(false)
  const [denunciando, setDenunciando] = useState(false)
  const [emojis, setEmojis] = useState(false)
  const rolagem = useRef(null)
  const campo = useRef(null)
  const arquivo = useRef(null)
  const colado = useRef(true)
  const alturaAntes = useRef(null)

  const ler = useCallback((opcoes) => (entreCandidatas ? lerConversaCandidata(id, opcoes) : lerConversa(id, opcoes)), [entreCandidatas, id])

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
          const mensagens = [...e.mensagens, ...novas].map((m) => (m.minha && lidasAte && m.id <= lidasAte ? { ...m, lida: true } : m))
          const bloqueio = r.conversa?.bloqueio ?? e.conversa.bloqueio ?? null
          if (!novas.length && lidasAte === e.lidasAte && bloqueio === (e.conversa.bloqueio ?? null)) return e
          return { ...e, mensagens, lidasAte, conversa: { ...e.conversa, bloqueio } }
        })
        if (r.mensagens?.length) aoMudar?.()
      } catch {
      }
    }, INTERVALO)
    return () => clearInterval(t)
  }, [estado.tipo, ultimaId, ler, aoMudar])

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
    if ((!limpo && !anexo) || enviando) return
    if (limpo.length > LIMITE) return setErro(`Use até ${LIMITE} caracteres.`)
    setEnviando(true)
    setErro('')
    try {
      const corpo = { texto: limpo, ...(anexo ? { imagem: anexo.dataUrl, largura: anexo.largura, altura: anexo.altura } : {}) }
      const r = entreCandidatas ? await enviarMensagemCandidata(id, corpo) : await enviarMensagem(id, corpo)
      colado.current = true
      setEstado((s) => ({ ...s, mensagens: [...s.mensagens.filter((m) => m.id !== r.mensagem.id), r.mensagem] }))
      setTexto('')
      if (campo.current) campo.current.style.height = ''
      setAnexo(null)
      aoMudar?.()
      campo.current?.focus()
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  async function escolherImagem(evento) {
    const escolhido = evento.target.files?.[0]
    evento.target.value = ''
    if (!escolhido) return
    setErro('')
    try {
      setAnexo(await prepararImagem(escolhido))
      campo.current?.focus()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function alternarBloqueio() {
    setMenu(false)
    setErro('')
    try {
      const r = estado.conversa.bloqueio === 'eu' ? await desbloquearConversa(id) : await bloquearConversa(id)
      setEstado((s) => ({ ...s, conversa: { ...s.conversa, bloqueio: r.bloqueio } }))
      aoMudar?.()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function apagar(m) {
    setErro('')
    try {
      const r = entreCandidatas ? await apagarMensagemCandidata(id, m.id) : await apagarMensagemEmpresa(id, m.id)
      setEstado((s) => ({ ...s, mensagens: s.mensagens.map((x) => (x.id === m.id ? r.mensagem : x)) }))
      aoMudar?.()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function inserir(trecho, substituir = false) {
    const el = campo.current
    const inicio = el?.selectionStart ?? texto.length
    const fim = el?.selectionEnd ?? texto.length
    const novo = substituir ? trecho : texto.slice(0, inicio) + trecho + texto.slice(fim)
    setTexto(novo.slice(0, LIMITE))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = substituir ? novo.length : inicio + trecho.length
      el.setSelectionRange(pos, pos)
      ajustarAltura(el)
    })
  }

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
  const sugestoes = respostasRapidas({ entreCandidatas, naEmpresa, nome: pessoa.nome.split(' ')[0] })
  const etapa = !entreCandidatas && conversa.etapa ? (
    <span className={cn('hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex', COR_ETAPA[conversa.etapa] ?? 'bg-papel-2 text-tinta-2')} title="Etapa da candidatura">
      {conversa.etapa}
    </span>
  ) : null

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
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
        {etapa}
        {linkPerfil && (
          <Link to={linkPerfil} className="hidden shrink-0 rounded-full border border-linha-forte px-3 py-1.5 text-xs font-semibold text-tinta-2 hover:border-vinho hover:text-vinho sm:inline-flex">
            {entreCandidatas ? 'Ver perfil' : naEmpresa ? 'Ver candidatura' : 'Ver empresa'}
          </Link>
        )}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menu}
            aria-label="Mais opções da conversa"
            className="grid size-9 place-items-center rounded-full text-tinta-2 hover:bg-papel-2"
          >
            <Icone nome="mais_opcoes" tamanho={20} />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-linha bg-branco py-1 shadow-menu">
              {linkPerfil && (
                <Link role="menuitem" to={linkPerfil} className="flex items-center gap-2 px-4 py-2.5 text-sm text-tinta-2 hover:bg-papel">
                  <Icone nome="perfil" tamanho={16} /> {entreCandidatas ? 'Ver perfil' : naEmpresa ? 'Ver candidatura' : 'Ver empresa'}
                </Link>
              )}
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenu(false)
                  setDenunciando(true)
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-tinta-2 hover:bg-papel"
              >
                <Icone nome="info" tamanho={16} /> {entreCandidatas || naEmpresa ? 'Denunciar perfil' : 'Denunciar empresa'}
              </button>
              {entreCandidatas && conversa.bloqueio !== 'ela' && (
                <button role="menuitem" type="button" onClick={alternarBloqueio} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-erro hover:bg-erro-claro">
                  <Icone nome="cadeado" tamanho={16} /> {conversa.bloqueio === 'eu' ? `Desbloquear ${pessoa.nome.split(' ')[0]}` : `Bloquear ${pessoa.nome.split(' ')[0]}`}
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      {denunciando && (
        <div className="border-b border-linha bg-branco p-3">
          <FormularioDenuncia alvoTipo={entreCandidatas || naEmpresa ? 'perfil' : 'empresa'} alvoId={pessoa.id} aoFechar={() => setDenunciando(false)} />
        </div>
      )}

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
            <span className="relative">
              <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-blush" />
              <Avatar nome={pessoa.nome} foto={pessoa.foto} tamanho="lg" className="relative ring-4 ring-branco" />
            </span>
            <p className="mt-2 font-display text-xl text-tinta">{pessoa.nome}</p>
            <p className="max-w-xs text-sm text-suave">{entreCandidatas ? 'Diga oi! Conversas entre integrantes ficam só entre vocês duas.' : 'Nenhuma mensagem ainda. Comece com uma das sugestões abaixo ou escreva a sua.'}</p>
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
                    podeApagar={m.minha}
                    base={base}
                    aoApagar={apagar}
                  />
                </FragmentoDia>
              )
            })}
          </ol>
        )}
      </div>

      {conversa.bloqueio ? (
        <div className="border-t border-linha bg-branco p-4 text-center text-sm text-tinta-2">
          {erro && (
            <Aviso tipo="erro" className="mb-2 text-left">
              {erro}
            </Aviso>
          )}
          {conversa.bloqueio === 'eu' ? (
            <>
              Você bloqueou {pessoa.nome.split(' ')[0]}. Ela não consegue te enviar mensagens.{' '}
              <button type="button" onClick={alternarBloqueio} className="font-semibold text-vinho hover:underline">
                Desbloquear
              </button>
            </>
          ) : (
            'Não é possível enviar mensagens nesta conversa.'
          )}
        </div>
      ) : (
        <form onSubmit={enviar} className="border-t border-linha bg-branco p-3">
          {erro && (
            <Aviso tipo="erro" className="mb-2">
              {erro}
            </Aviso>
          )}
          {anexo && (
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-papel-2 p-2">
              <img src={anexo.dataUrl} alt="Prévia da imagem escolhida" className="size-14 rounded-lg object-cover" />
              <span className="flex-1 text-xs text-tinta-2">Imagem pronta para enviar{texto.trim() ? ' com a mensagem' : ''}.</span>
              <button type="button" onClick={() => setAnexo(null)} className="grid size-8 place-items-center rounded-full text-suave hover:bg-branco hover:text-erro" aria-label="Tirar a imagem">
                <Icone nome="fechar" tamanho={16} />
              </button>
            </div>
          )}
          {!texto && !anexo && (
            <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" aria-label="Respostas rápidas">
              {sugestoes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => inserir(s, true)}
                  className="shrink-0 rounded-full border border-linha bg-papel px-3 py-1.5 text-xs font-semibold text-tinta-2 transition-colors hover:border-vinho/40 hover:bg-blush hover:text-vinho"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {emojis && (
            <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-linha bg-papel p-2" role="group" aria-label="Emojis">
              {EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => inserir(em)} className="grid size-9 place-items-center rounded-lg text-lg hover:bg-blush" aria-label={`Inserir ${em}`}>
                  {em}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setEmojis((v) => !v)}
              aria-pressed={emojis}
              className={cn('grid size-11 shrink-0 place-items-center rounded-full text-lg transition-colors hover:bg-papel-2', emojis && 'bg-blush')}
              aria-label="Emojis"
              title="Emojis"
            >
              <span aria-hidden="true">😊</span>
            </button>
            <input ref={arquivo} type="file" accept={ACEITAR_IMAGEM} hidden onChange={escolherImagem} />
            <button
              type="button"
              onClick={() => arquivo.current?.click()}
              disabled={enviando}
              className="grid size-11 shrink-0 place-items-center rounded-full text-tinta-2 transition-colors hover:bg-papel-2 hover:text-vinho disabled:opacity-40"
              aria-label="Enviar uma imagem"
              title="Enviar uma imagem"
            >
              <Icone nome="imagem" tamanho={20} />
            </button>
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
                ajustarAltura(e.target)
              }}
              onKeyDown={teclas}
              placeholder="Escreva uma mensagem…"
              className="max-h-40 min-h-11 flex-1 resize-none overflow-y-hidden rounded-2xl border border-transparent bg-papel-2 px-4 py-2.5 text-[15px] text-tinta placeholder:text-suave focus:border-vinho focus:bg-branco focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
            />
            <button
              type="submit"
              disabled={enviando || (!texto.trim() && !anexo)}
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
      )}
    </div>
  )
}

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
