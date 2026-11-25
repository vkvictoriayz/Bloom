import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import Avatar from '../../components/comunidade/Avatar'
import Chat from '../../components/mensagens/Chat'
import { Aviso, Entrada } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { lerPerfis, tempoRelativo } from '../../services/comunidade'
import { abrirConversa, abrirConversaCandidata, EVENTO_MENSAGENS, listarConversas, listarConversasCandidatas } from '../../services/recursos'
import { listarCandidaturasEmpresa } from '../../services/empresa'
import { cn } from '../../lib/cn'

const INTERVALO_LISTA = 15000

function ItemConversa({ c, para, ativa }) {
  return (
    <li>
      <Link
        to={para}
        aria-current={ativa ? 'page' : undefined}
        className={cn('flex items-center gap-3 px-4 py-3 transition-colors', ativa ? 'bg-blush' : 'hover:bg-papel')}
      >
        <Avatar nome={c.participante.nome} foto={c.participante.foto} tamanho="md" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate', c.naoLidas ? 'font-bold text-tinta' : 'font-semibold text-tinta')}>{c.participante.nome}</span>
            <span className={cn('shrink-0 text-[11px] tabular-nums', c.naoLidas ? 'font-bold text-vinho' : 'text-suave')}>{tempoRelativo(c.ultimaEm ?? c.atualizadaEm)}</span>
          </span>
          {c.vaga && <span className="block truncate text-xs font-medium text-vinho">{c.vaga}</span>}
          <span className="flex items-center gap-2">
            <span className={cn('min-w-0 flex-1 truncate text-sm', c.naoLidas ? 'font-semibold text-tinta' : 'text-suave')}>
              {c.ultimaMinha && (
                <span className={cn('mr-1 text-xs', c.ultimaLida ? 'text-vinho' : 'text-suave')} aria-label={c.ultimaLida ? 'lida' : 'enviada'}>
                  {c.ultimaLida ? '✓✓' : '✓'}
                </span>
              )}
              {c.ultimaMensagem}
            </span>
            {c.bloqueada && <span className="shrink-0 rounded-full bg-papel-2 px-2 text-[10px] font-bold text-suave uppercase">Bloqueada</span>}
            {c.naoLidas > 0 && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-vinho px-1.5 text-[11px] font-bold text-white" aria-label={`${c.naoLidas} não lidas`}>
                {c.naoLidas}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  )
}

function NovaConversa({ aoFechar }) {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [pessoas, setPessoas] = useState(null)
  const [erro, setErro] = useState('')
  const [abrindo, setAbrindo] = useState(null)

  useEffect(() => {
    let ativo = true
    const espera = setTimeout(
      () =>
        lerPerfis({ busca })
          .then((r) => ativo && setPessoas(r.perfis))
          .catch((e) => ativo && setErro(e.message)),
      busca ? 250 : 0
    )
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [busca])

  async function abrir(pessoa) {
    setAbrindo(pessoa.id)
    setErro('')
    try {
      const r = await abrirConversaCandidata(pessoa.id)
      aoFechar()
      navigate(`/candidata/mensagens/candidatas/${r.conversa.id}`)
    } catch (e) {
      setErro(e.message)
      setAbrindo(null)
    }
  }

  const lista = (pessoas ?? []).slice().sort((a, b) => Number(b.seguindo) - Number(a.seguindo)).slice(0, 20)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-linha px-4 py-3">
        <button type="button" onClick={aoFechar} className="grid size-9 place-items-center rounded-full text-tinta-2 hover:bg-papel-2" aria-label="Voltar para as conversas">
          <Icone nome="voltar" tamanho={18} />
        </button>
        <h2 className="font-display text-lg text-tinta">Nova conversa</h2>
      </div>
      <div className="p-3">
        <Entrada type="search" autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, área ou interesse" aria-label="Buscar candidata" className="h-10 rounded-full" />
      </div>
      {erro && (
        <Aviso tipo="erro" className="mx-3 mb-2">
          {erro}
        </Aviso>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {pessoas === null && !erro ? (
          <p className="px-4 py-3 text-sm text-suave">Carregando…</p>
        ) : lista.length === 0 ? (
          <p className="px-4 py-3 text-sm text-suave">{busca ? 'Nenhuma candidata encontrada.' : 'Ainda não há outras candidatas com perfil público.'}</p>
        ) : (
          <ul>
            {lista.map((p) => (
              <li key={p.id}>
                <button type="button" disabled={abrindo !== null} onClick={() => abrir(p)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-papel disabled:opacity-60">
                  <Avatar nome={p.nome} foto={p.foto} tamanho="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                    <span className="block truncate text-xs text-suave">{[p.area, p.seguindo && 'você segue'].filter(Boolean).join(' · ') || 'Área não informada'}</span>
                  </span>
                  <span className="text-xs font-semibold text-vinho">{abrindo === p.id ? 'Abrindo…' : 'Conversar'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function usePessoasNaBusca(busca, daCandidata) {
  const [estado, setEstado] = useState({ termo: '', pessoas: [], carregando: false, erro: '' })
  const [candidaturas, setCandidaturas] = useState(null)
  const termo = busca.trim()

  useEffect(() => {
    if (daCandidata || !termo || candidaturas) return undefined
    let ativo = true
    listarCandidaturasEmpresa()
      .then((r) => ativo && setCandidaturas(r.candidaturas ?? []))
      .catch((e) => ativo && setEstado((s) => ({ ...s, erro: e.message })))
    return () => {
      ativo = false
    }
  }, [daCandidata, termo, candidaturas])

  useEffect(() => {
    if (!daCandidata || termo.length < 2) return undefined
    let ativo = true
    const espera = setTimeout(() => {
      setEstado((s) => ({ ...s, carregando: true }))
      lerPerfis({ busca: termo })
        .then((r) => ativo && setEstado({ termo, carregando: false, erro: '', pessoas: (r.perfis ?? []).slice(0, 8).map((p) => ({ chave: `u${p.id}`, id: p.id, nome: p.nome, foto: p.foto, detalhe: p.area || 'Integrante da Bloom' })) }))
        .catch((e) => ativo && setEstado({ termo, carregando: false, erro: e.message, pessoas: [] }))
    }, 300)
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [daCandidata, termo])

  if (!termo || (daCandidata && termo.length < 2)) return { pessoas: [], carregando: false, erro: '' }
  if (daCandidata) return { ...estado, carregando: estado.carregando || estado.termo !== termo }
  const alvo = termo.toLowerCase()
  const pessoas = (candidaturas ?? [])
    .filter((c) => c.candidata.nome.toLowerCase().includes(alvo) || c.vaga.titulo.toLowerCase().includes(alvo))
    .slice(0, 8)
    .map((c) => ({ chave: `c${c.id}`, candidaturaId: c.id, nome: c.candidata.nome, foto: c.candidata.foto, detalhe: `${c.vaga.titulo} · ${c.status}` }))
  return { pessoas, carregando: candidaturas === null && !estado.erro, erro: estado.erro }
}

function ResultadosPessoas({ termo, daCandidata, base, conversas }) {
  const navigate = useNavigate()
  const { pessoas, carregando, erro } = usePessoasNaBusca(termo, daCandidata)
  const [abrindo, setAbrindo] = useState(null)
  const [falha, setFalha] = useState('')
  if (!termo.trim()) return null
  if (daCandidata && termo.trim().length < 2) return null

  async function abrir(p) {
    setAbrindo(p.chave)
    setFalha('')
    try {
      if (p.candidaturaId) {
        const r = await abrirConversa(p.candidaturaId)
        navigate(`${base}/${r.conversa.id}`)
      } else {
        const r = await abrirConversaCandidata(p.id)
        navigate(`${base}/candidatas/${r.conversa.id}`)
      }
    } catch (e) {
      setFalha(e.message)
    } finally {
      setAbrindo(null)
    }
  }

  const jaConversa = (p) => (p.candidaturaId ? conversas.empresas?.some((c) => c.candidaturaId === p.candidaturaId) : conversas.candidatas?.some((c) => c.participante.id === p.id))

  return (
    <div className="border-t border-linha">
      <p className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-suave uppercase">{daCandidata ? 'Pessoas na Bloom' : 'Candidatas das suas vagas'}</p>
      {(erro || falha) && (
        <Aviso tipo="erro" className="mx-3 my-2">
          {falha || erro}
        </Aviso>
      )}
      {carregando ? (
        <p className="px-4 py-3 text-sm text-suave">Buscando…</p>
      ) : pessoas.length === 0 ? (
        <p className="px-4 py-3 text-sm text-suave">{daCandidata ? 'Nenhuma integrante encontrada.' : 'Nenhuma candidata das suas vagas com esse nome.'}</p>
      ) : (
        <ul>
          {pessoas.map((p) => (
            <li key={p.chave}>
              <button type="button" disabled={abrindo !== null} onClick={() => abrir(p)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-papel disabled:opacity-60">
                <Avatar nome={p.nome} foto={p.foto} tamanho="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                  <span className="block truncate text-xs text-suave">{p.detalhe}</span>
                </span>
                <span className="shrink-0 rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-vinho">{abrindo === p.chave ? 'Abrindo…' : jaConversa(p) ? 'Abrir' : 'Conversar'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SemConversa({ podeIniciar, aoIniciar }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-papel p-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-blush text-vinho">
        <Icone nome="mensagem" tamanho={28} />
      </span>
      <h2 className="font-display text-xl text-tinta">Suas mensagens</h2>
      <p className="max-w-sm text-sm text-tinta-2">
        {podeIniciar
          ? 'Escolha uma conversa ao lado ou comece uma nova com outra integrante da Bloom.'
          : 'Escolha uma conversa ao lado. Uma conversa começa pela página de uma candidatura.'}
      </p>
      {podeIniciar && (
        <button type="button" onClick={aoIniciar} className="mt-1 inline-flex items-center gap-2 rounded-full bg-vinho px-5 py-2.5 text-sm font-semibold text-white hover:bg-vinho-escuro">
          <Icone nome="mais" tamanho={16} /> Nova conversa
        </button>
      )}
    </div>
  )
}

function useAlturaDisponivel() {
  const ref = useRef(null)
  const [altura, setAltura] = useState(null)
  useLayoutEffect(() => {
    const medir = () => {
      if (!ref.current) return
      const topo = ref.current.getBoundingClientRect().top + window.scrollY
      const principal = ref.current.closest('main') ?? ref.current.parentElement
      const folga = parseFloat(getComputedStyle(principal).paddingBottom) || 0
      setAltura(Math.max(420, Math.floor(window.innerHeight - topo - folga)))
    }
    medir()
    window.addEventListener('resize', medir)
    const observador = new ResizeObserver(medir)
    const principal = ref.current?.closest('main') ?? ref.current?.parentElement
    if (principal) observador.observe(principal)
    return () => {
      window.removeEventListener('resize', medir)
      observador.disconnect()
    }
  }, [])
  return [ref, altura]
}

export function Mensagens({ base = '/candidata/mensagens', selecionada = null }) {
  const { id } = useParams()
  const [parametros, setParametros] = useSearchParams()
  const daCandidata = base === '/candidata/mensagens'
  const aberta = selecionada && id ? { tipo: selecionada, id } : null
  const aba = !daCandidata ? 'empresas' : aberta ? aberta.tipo : parametros.get('aba') === 'empresas' ? 'empresas' : 'candidatas'
  const [listas, setListas] = useState({ candidatas: null, empresas: null })
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [novaConversa, setNovaConversa] = useState(false)
  const [caixa, altura] = useAlturaDisponivel()

  const recarregar = useCallback(async () => {
    try {
      const [candidatas, empresas] = await Promise.all([daCandidata ? listarConversasCandidatas() : Promise.resolve({ conversas: [] }), listarConversas()])
      setListas({ candidatas: candidatas.conversas ?? [], empresas: empresas.conversas ?? [] })
      setErro('')
      window.dispatchEvent(new Event(EVENTO_MENSAGENS))
    } catch (e) {
      setErro(e.message)
    }
  }, [daCandidata])

  useEffect(() => {
    recarregar()
    const t = setInterval(() => document.visibilityState === 'visible' && recarregar(), INTERVALO_LISTA)
    return () => clearInterval(t)
  }, [recarregar])

  useEffect(() => {
    if (!aberta) return
    const t = setTimeout(recarregar, 800)
    return () => clearTimeout(t)
  }, [aberta?.tipo, aberta?.id])

  useEffect(() => {
    document.title = 'Mensagens · BLOOM'
  }, [])

  const conversas = listas[aba]
  const alvo = busca.trim().toLowerCase()
  const filtradas = (conversas ?? []).filter((c) => !alvo || c.participante.nome.toLowerCase().includes(alvo) || (c.vaga ?? '').toLowerCase().includes(alvo))
  const naoLidas = (lista) => (lista ?? []).reduce((t, c) => t + c.naoLidas, 0)
  const rota = (c) => (aba === 'candidatas' ? `${base}/candidatas/${c.id}` : `${base}/${c.id}`)

  const abas = [
    { id: 'candidatas', rotulo: 'Candidatas', icone: 'grupo', total: naoLidas(listas.candidatas) },
    { id: 'empresas', rotulo: 'Empresas', icone: 'predio', total: naoLidas(listas.empresas) },
  ]

  return (
    <div
      ref={caixa}
      style={altura ? { height: altura } : undefined}
      className="-mx-4 flex h-[calc(100dvh-9rem)] overflow-hidden border-y border-linha bg-branco sm:-mx-6 lg:mx-0 lg:rounded-2xl lg:border"
    >
      <h1 className="sr-only">Mensagens</h1>

      <section className={cn('flex min-h-0 w-full flex-col border-linha lg:w-[340px] lg:shrink-0 lg:border-r', aberta && 'max-lg:hidden')} aria-label="Conversas">
        {novaConversa ? (
          <NovaConversa aoFechar={() => setNovaConversa(false)} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-4 pt-4">
              <h2 className="font-display text-2xl text-tinta">Mensagens</h2>
              {daCandidata && (
                <button
                  type="button"
                  onClick={() => setNovaConversa(true)}
                  className="grid size-10 place-items-center rounded-full bg-blush text-vinho transition-colors hover:bg-vinho hover:text-white"
                  aria-label="Nova conversa"
                  title="Nova conversa"
                >
                  <Icone nome="editar" tamanho={18} />
                </button>
              )}
            </div>
            <div className="px-3 pt-3">
              <Entrada type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={daCandidata ? 'Buscar conversa ou pessoa' : 'Buscar conversa ou candidata'} aria-label="Buscar conversa ou pessoa" className="h-10 rounded-full" />
            </div>
            {daCandidata && (
              <div role="tablist" aria-label="Tipo de conversa" className="mt-3 flex border-b border-linha px-2">
                {abas.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="tab"
                    aria-selected={aba === a.id}
                    onClick={() => setParametros(a.id === 'candidatas' ? {} : { aba: a.id }, { replace: true })}
                    className={cn(
                      'inline-flex h-11 flex-1 items-center justify-center gap-1.5 border-b-2 text-sm font-semibold transition-colors',
                      aba === a.id ? 'border-vinho text-vinho' : 'border-transparent text-tinta-2 hover:text-tinta'
                    )}
                  >
                    <Icone nome={a.icone} tamanho={15} /> {a.rotulo}
                    {a.total > 0 && <span className="rounded-full bg-vinho px-1.5 text-[11px] font-bold text-white tabular-nums">{a.total}</span>}
                  </button>
                ))}
              </div>
            )}
            {erro && (
              <Aviso tipo="erro" className="m-3">
                {erro}
              </Aviso>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversas === null ? (
                <div className="flex flex-col gap-2 p-3">
                  {[0, 1, 2].map((i) => (
                    <Esqueleto key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : filtradas.length === 0 ? (
                <p className={cn('px-5 text-center text-sm text-suave', busca ? 'py-3' : 'py-6')}>
                  {busca
                    ? 'Nenhuma conversa com esse nome.'
                    : aba === 'candidatas'
                      ? 'Nenhuma conversa ainda. Toque no lápis para começar uma, ou use "Mensagem" no perfil de outra integrante.'
                      : daCandidata
                        ? 'Uma conversa com empresa começa pela página de uma candidatura, com o botão de mensagem.'
                        : 'Uma conversa começa pela página de uma candidatura, com o botão de mensagem.'}
                </p>
              ) : (
                <ul className="divide-y divide-linha">
                  {filtradas.map((c) => (
                    <ItemConversa key={`${aba}-${c.id}`} c={c} para={rota(c)} ativa={aberta?.tipo === aba && String(aberta.id) === String(c.id)} />
                  ))}
                </ul>
              )}
              {conversas !== null && <ResultadosPessoas termo={busca} daCandidata={daCandidata} base={base} conversas={listas} />}
            </div>
          </>
        )}
      </section>

      <section className={cn('min-h-0 min-w-0 flex-1', !aberta && 'max-lg:hidden')} aria-label="Conversa">
        {aberta ? (
          <Chat key={`${aberta.tipo}-${aberta.id}`} tipo={aberta.tipo} id={aberta.id} base={base} aoMudar={recarregar} className="h-full" />
        ) : (
          <SemConversa podeIniciar={daCandidata} aoIniciar={() => setNovaConversa(true)} />
        )}
      </section>
    </div>
  )
}

export default Mensagens
