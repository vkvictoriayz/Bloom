import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import Icone from '../Icone'
import Logo, { Borboleta } from '../Logo'
import Avatar from '../comunidade/Avatar'
import { sair } from '../../services/auth'
import { contarMensagensNaoLidas, contarNaoLidas, EVENTO_MENSAGENS, EVENTO_NOTIFICACOES } from '../../services/recursos'
import { cn } from '../../lib/cn'

// Moldura das áreas logadas (candidata e empresa): menu lateral que expande
// (ícone + nome) ou recolhe (só ícones, com dica ao passar o mouse ou focar),
// gaveta em telas menores, barra superior com busca, mensagens,
// notificações e menu da conta. Cada área passa o próprio menu em "config".
//
// config = {
//   rotuloNav, inicio, chavePreferencia, idGaveta,
//   secoes: [{ itens } | { grupo, icone, itens } | { divisor: true }],
//   promo?: { titulo, texto, rotuloAcao, para },
//   busca: { placeholder, rotulo, para: (termo) => url },
//   mensagens, notificacoes, perfil, configuracoes, selo?, aoSair?,
// }
// "contexto" chega às páginas por useOutletContext(); "faixa" aparece acima
// do conteúdo de todas as páginas (ex.: aviso para confirmar o e-mail).
// Item: { rotulo, para, icone, tambem?: ['/prefixo/'] }

function lerRecolhido(chave) {
  try {
    return localStorage.getItem(chave) === '1'
  } catch {
    return false
  }
}

function usaPrefixo(item, pathname) {
  return item.tambem?.some((prefixo) => pathname.startsWith(prefixo))
}

// Nome da opção: some suavemente quando o menu recolhe, mas continua
// disponível para leitores de tela; no lugar, aparece a dica flutuante.
function Rotulo({ recolhido, children }) {
  return (
    <>
      <span
        className={cn(
          'min-w-0 truncate whitespace-nowrap transition-[opacity,max-width] duration-300 ease-out',
          recolhido ? 'sr-only' : 'max-w-[200px] opacity-100'
        )}
      >
        {children}
      </span>
      {recolhido && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-tinta px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-dica transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {children}
        </span>
      )}
    </>
  )
}

function ItemMenu({ item, recolhido, sub = false, aoNavegar }) {
  const { pathname } = useLocation()
  const ativoExtra = usaPrefixo(item, pathname)
  const estilo = (ativo) =>
    cn(
      'group relative flex items-center gap-3 rounded-lg font-medium transition-colors',
      recolhido ? 'h-11 justify-center px-0' : sub ? 'h-10 px-3 pl-11 text-sm' : 'h-11 px-3 text-[15px]',
      ativo ? 'bg-vinho text-white' : 'text-tinta-2 hover:bg-blush hover:text-vinho'
    )
  const conteudo = (
    <>
      <Icone nome={item.icone} tamanho={sub && !recolhido ? 18 : 20} className={cn('shrink-0', sub && !recolhido && 'absolute left-4')} />
      <Rotulo recolhido={recolhido}>{item.rotulo}</Rotulo>
    </>
  )

  if (ativoExtra) {
    return (
      <Link to={item.para} onClick={aoNavegar} className={estilo(true)} aria-current="page">
        {conteudo}
      </Link>
    )
  }
  return (
    <NavLink to={item.para} end={item.fim} onClick={aoNavegar} className={({ isActive }) => estilo(isActive)}>
      {conteudo}
    </NavLink>
  )
}

// Grupo que abre e fecha. Recolhido, mostra os itens como ícones.
function Grupo({ secao, recolhido, aoNavegar }) {
  const idLista = useId()
  const [aberto, setAberto] = useState(true)
  const { pathname } = useLocation()
  const contemAtivo = secao.itens.some((item) => pathname.startsWith(item.para) || usaPrefixo(item, pathname))

  if (recolhido) {
    return (
      <div className="flex flex-col gap-1 border-t border-linha pt-1">
        {secao.itens.map((item) => (
          <ItemMenu key={item.para} item={item} recolhido aoNavegar={aoNavegar} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((v) => !v)}
        className={cn(
          'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors hover:bg-blush hover:text-vinho',
          contemAtivo && !aberto ? 'text-vinho' : 'text-tinta-2'
        )}
      >
        <Icone nome={secao.icone} tamanho={20} className="shrink-0" />
        <span className="flex-1 text-left">{secao.grupo}</span>
        <svg viewBox="0 0 12 12" className={cn('size-3 transition-transform duration-200', aberto && 'rotate-180')} aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <div id={idLista} className={cn('grid transition-[grid-template-rows] duration-300 ease-out', aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="flex flex-col gap-0.5 overflow-hidden pt-0.5" inert={!aberto}>
          {secao.itens.map((item) => (
            <ItemMenu key={item.para} item={item} sub aoNavegar={aoNavegar} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ConteudoMenu({ config, recolhido, aoNavegar, aoSair }) {
  return (
    <>
      {/* Recolhido, sem rolagem: as dicas flutuantes não podem ser cortadas. */}
      <nav aria-label={config.rotuloNav} className={cn('flex flex-1 flex-col gap-1 py-4', recolhido ? 'overflow-visible px-3' : 'overflow-y-auto px-4')}>
        {config.secoes.map((secao, i) =>
          secao.divisor ? (
            <div key={i} className="my-2 border-t border-linha" role="presentation" />
          ) : secao.grupo ? (
            <Grupo key={secao.grupo} secao={secao} recolhido={recolhido} aoNavegar={aoNavegar} />
          ) : (
            secao.itens.map((item) => <ItemMenu key={item.para} item={item} recolhido={recolhido} aoNavegar={aoNavegar} />)
          )
        )}
      </nav>

      {!recolhido && config.promo && (
        <div className="mx-4 mb-3 rounded-xl bg-blush p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-vinho-escuro">
            <Icone nome="broto" tamanho={16} /> {config.promo.titulo}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-tinta-2">{config.promo.texto}</p>
          <Link
            to={config.promo.para}
            onClick={aoNavegar}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-vinho px-3 text-xs font-semibold text-white hover:bg-vinho-escuro"
          >
            {config.promo.rotuloAcao} <Icone nome="seta" tamanho={13} />
          </Link>
        </div>
      )}

      <div className={cn('border-t border-linha py-3', recolhido ? 'px-3' : 'px-4')}>
        <button
          type="button"
          onClick={aoSair}
          className={cn(
            'group relative flex h-11 w-full items-center gap-3 rounded-lg text-[15px] font-medium text-tinta-2 transition-colors hover:bg-blush hover:text-vinho',
            recolhido ? 'justify-center' : 'px-3'
          )}
        >
          <Icone nome="sair" tamanho={20} className="shrink-0" />
          <Rotulo recolhido={recolhido}>Sair da conta</Rotulo>
        </button>
      </div>
    </>
  )
}

function MenuConta({ usuario, foto, config, aoSair }) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e) => !caixa.current?.contains(e.target) && setAberto(false)
    const esc = (e) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const item = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-tinta-2 hover:bg-papel-2 hover:text-tinta'

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-papel-2 sm:pr-2"
      >
        <Avatar nome={usuario?.nome} foto={foto} tamanho="sm" />
        <svg viewBox="0 0 12 12" className={cn('hidden size-3 text-suave transition-transform sm:block', aberto && 'rotate-180')} aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="sr-only">Abrir menu da conta</span>
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-linha bg-branco py-1 shadow-menu">
          <div className="border-b border-linha px-4 py-3">
            <p className="truncate text-sm font-semibold text-tinta">{usuario?.nome}</p>
            <p className="truncate text-xs text-suave">{usuario?.email}</p>
          </div>
          <Link role="menuitem" to={config.perfil.para} className={item} onClick={() => setAberto(false)}>
            <Icone nome={config.perfil.icone ?? 'perfil'} /> {config.perfil.rotulo}
          </Link>
          <Link role="menuitem" to={config.configuracoes} className={item} onClick={() => setAberto(false)}>
            <Icone nome="engrenagem" /> Configurações
          </Link>
          <button role="menuitem" type="button" className={cn(item, 'border-t border-linha')} onClick={aoSair}>
            <Icone nome="sair" /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

// Busca da barra superior: leva à página de busca da área com o termo.
function BuscaGeral({ busca }) {
  const navigate = useNavigate()
  const [termo, setTermo] = useState('')

  function enviar(e) {
    e.preventDefault()
    navigate(busca.para(termo.trim()))
  }

  return (
    <form role="search" onSubmit={enviar} className="relative hidden w-full max-w-md sm:block">
      <Icone nome="busca" tamanho={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-suave" />
      <input
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder={busca.placeholder}
        aria-label={busca.rotulo}
        className="h-11 w-full rounded-full border border-transparent bg-papel-2 pr-4 pl-11 text-sm text-tinta placeholder:text-suave transition-colors hover:border-linha-forte focus:border-vinho focus:bg-branco focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
      />
    </form>
  )
}

// Quantas notificações (ou mensagens) não lidas: consulta ao trocar de
// página, a cada minuto (com a aba visível) e quando algo é marcado como lido.
function useNaoLidas(ativo = true, contar = contarNaoLidas, evento = EVENTO_NOTIFICACOES) {
  const { pathname } = useLocation()
  const [total, setTotal] = useState(0)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const atualizar = () => setVersao((v) => v + 1)
    const relogio = setInterval(() => document.visibilityState === 'visible' && atualizar(), 60000)
    window.addEventListener(evento, atualizar)
    return () => {
      clearInterval(relogio)
      window.removeEventListener(evento, atualizar)
    }
  }, [evento])

  useEffect(() => {
    if (!ativo) return
    let vivo = true
    contar()
      .then((n) => vivo && setTotal(n))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [pathname, versao, ativo, contar])

  return total
}

function LayoutPrivado({ config, usuario, foto, contexto, faixa }) {
  // A administração não tem mensagens nem notificações (config sem esses atalhos).
  const naoLidas = useNaoLidas(Boolean(config.notificacoes))
  const mensagensNaoLidas = useNaoLidas(Boolean(config.mensagens), contarMensagensNaoLidas, EVENTO_MENSAGENS)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [recolhido, setRecolhido] = useState(() => lerRecolhido(config.chavePreferencia))
  const [gaveta, setGaveta] = useState(false)
  const botaoFecharGaveta = useRef(null)

  // Fecha a gaveta ao trocar de página e leva a página ao topo.
  const [paginaAnterior, setPaginaAnterior] = useState(pathname)
  if (paginaAnterior !== pathname) {
    setPaginaAnterior(pathname)
    setGaveta(false)
  }
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!gaveta) return
    botaoFecharGaveta.current?.focus()
    const esc = (e) => e.key === 'Escape' && setGaveta(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [gaveta])

  function alternarMenu() {
    setRecolhido((v) => {
      try {
        localStorage.setItem(config.chavePreferencia, v ? '0' : '1')
      } catch {
        // a preferência só não fica lembrada
      }
      return !v
    })
  }

  function handleSair() {
    sair()
    navigate(config.aoSair ?? '/login', { replace: true })
  }

  const atalho =
    'grid size-10 place-items-center rounded-full text-tinta-2 transition-colors hover:bg-papel-2 hover:text-vinho aria-[current=page]:bg-blush aria-[current=page]:text-vinho'

  return (
    <div className="min-h-screen bg-papel">
      <a
        href="#conteudo"
        className="sr-only z-[70] rounded-md bg-vinho px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      {/* Menu lateral (desktop) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-linha bg-branco transition-[width] duration-300 ease-out lg:flex',
          recolhido ? 'w-[76px]' : 'w-64'
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center border-b border-linha', recolhido ? 'justify-center px-2' : 'justify-between pr-3 pl-6')}>
          {!recolhido && (
            <Link to={config.inicio} aria-label="BLOOM, ir para o início" className="flex items-center gap-2 rounded-sm">
              <Logo />
              {config.selo && <span className="rounded-full bg-blush px-2 py-0.5 text-[10px] font-bold tracking-wide text-vinho uppercase">{config.selo}</span>}
            </Link>
          )}
          <button
            type="button"
            onClick={alternarMenu}
            aria-expanded={!recolhido}
            aria-label={recolhido ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={recolhido ? 'Expandir menu' : 'Recolher menu'}
            className="grid size-10 place-items-center rounded-lg text-tinta-2 transition-colors hover:bg-blush hover:text-vinho"
          >
            {recolhido ? (
              <Borboleta tamanho={24} className="text-vinho" />
            ) : (
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="3.5" width="14" height="13" rx="2" />
                <path d="M8 3.5v13M13.5 8 11.5 10l2 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
        <ConteudoMenu config={config} recolhido={recolhido} aoSair={handleSair} />
      </aside>

      <div className={cn('transition-[padding] duration-300 ease-out', recolhido ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-linha bg-branco/95 px-4 backdrop-blur-sm sm:px-6 lg:px-10">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-tinta hover:bg-papel-2 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={gaveta}
            aria-controls={config.idGaveta}
            onClick={() => setGaveta(true)}
          >
            <Icone nome="menu" tamanho={22} />
          </button>
          <Link to={config.inicio} className="shrink-0 sm:hidden max-[359px]:[&_span]:hidden" aria-label="BLOOM, ir para o início">
            <Logo tamanho={22} />
          </Link>

          <BuscaGeral busca={config.busca} />

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            {config.mensagens && (
              <NavLink
                to={config.mensagens}
                className={cn(atalho, 'relative')}
                aria-label={mensagensNaoLidas ? `Mensagens: ${mensagensNaoLidas} não lidas` : 'Mensagens'}
                title="Mensagens"
              >
                <Icone nome="mensagem" tamanho={20} />
                {mensagensNaoLidas > 0 && (
                  <span aria-hidden="true" className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-vinho px-1 text-[10px] leading-none font-bold text-white">
                    {mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}
                  </span>
                )}
              </NavLink>
            )}
            {config.notificacoes && (
            <NavLink
              to={config.notificacoes}
              className={cn(atalho, 'relative')}
              aria-label={naoLidas ? `Notificações: ${naoLidas} não lidas` : 'Notificações'}
              title="Notificações"
            >
              <Icone nome="sino" tamanho={20} />
              {naoLidas > 0 && (
                <span aria-hidden="true" className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-vinho px-1 text-[10px] leading-none font-bold text-white">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </NavLink>
            )}
            <MenuConta usuario={usuario} foto={foto} config={config} aoSair={handleSair} />
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-8 focus:outline-none sm:px-6 lg:px-10 lg:py-10">
          {faixa}
          <Outlet context={contexto} />
        </main>
      </div>

      {/* Gaveta (celular e tablet): desliza da esquerda */}
      <div
        id={config.idGaveta}
        className={cn('fixed inset-0 z-[60] lg:hidden', gaveta ? 'visible' : 'invisible delay-300')}
        aria-hidden={!gaveta}
        inert={!gaveta}
      >
        <button
          type="button"
          tabIndex={-1}
          className={cn('absolute inset-0 bg-tinta/40 transition-opacity duration-300', gaveta ? 'opacity-100' : 'opacity-0')}
          aria-label="Fechar menu"
          onClick={() => setGaveta(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-branco shadow-gaveta transition-transform duration-300 ease-out',
            gaveta ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-linha pr-3 pl-6">
            <Logo tamanho={22} />
            <button
              ref={botaoFecharGaveta}
              type="button"
              className="grid size-10 place-items-center rounded-lg hover:bg-papel-2"
              aria-label="Fechar menu"
              onClick={() => setGaveta(false)}
            >
              <Icone nome="fechar" tamanho={20} />
            </button>
          </div>
          <ConteudoMenu config={config} recolhido={false} aoNavegar={() => setGaveta(false)} aoSair={handleSair} />
        </div>
      </div>
    </div>
  )
}

export default LayoutPrivado
