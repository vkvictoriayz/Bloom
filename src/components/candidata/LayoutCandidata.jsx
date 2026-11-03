import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import Icone from '../Icone'
import Logo from '../Logo'
import Avatar from '../comunidade/Avatar'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { useSessao } from '../../hooks/useSessao'
import { sair } from '../../services/auth'
import { EVENTO_PERFIL, lerPerfil } from '../../services/perfil'
import { cn } from '../../lib/cn'

// Layout exclusivo da área privada da candidata (/candidata/*, /vagas/:id,
// /comunidades/:id). Não é usado pela landing, login, cadastro nem empresa.

const MENU = [
  { rotulo: 'Feed', para: '/candidata/feed', icone: 'inicio' },
  { rotulo: 'Explorar', para: '/candidata/explorar', icone: 'busca' },
  { rotulo: 'Meu perfil', para: '/candidata/perfil', icone: 'perfil' },
  { rotulo: 'Vagas', para: '/candidata/vagas', icone: 'maleta', tambem: ['/vagas/'] },
  { rotulo: 'Vagas salvas', para: '/candidata/vagas-salvas', icone: 'coracao' },
  { rotulo: 'Minhas candidaturas', para: '/candidata/candidaturas', icone: 'candidaturas' },
  { rotulo: 'Meus projetos', para: '/candidata/projetos', icone: 'pasta' },
  { rotulo: 'Comunidades', para: '/candidata/comunidades', icone: 'grupo', tambem: ['/comunidades/'] },
  { rotulo: 'Mensagens', para: '/candidata/mensagens', icone: 'mensagem' },
  { rotulo: 'Notificações', para: '/candidata/notificacoes', icone: 'sino' },
  { rotulo: 'Configurações', para: '/candidata/configuracoes', icone: 'engrenagem' },
]

function ItemMenu({ item, aoNavegar }) {
  const { pathname } = useLocation()
  // Páginas fora do prefixo (ex.: /vagas/3) também acendem o item certo.
  const ativoExtra = item.tambem?.some((prefixo) => pathname.startsWith(prefixo))
  const estilo = (ativo) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors',
      ativo ? 'bg-blush font-semibold text-vinho' : 'text-tinta-2 hover:bg-papel-2 hover:text-tinta'
    )
  const conteudo = (
    <>
      <Icone nome={item.icone} tamanho={20} className="shrink-0" />
      {item.rotulo}
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
    <NavLink to={item.para} onClick={aoNavegar} className={({ isActive }) => estilo(isActive)}>
      {conteudo}
    </NavLink>
  )
}

function MenuConta({ usuario, foto, aoSair }) {
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
        className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-papel-2"
      >
        <Avatar nome={usuario?.nome} foto={foto} tamanho="sm" />
        <span className="sr-only">Abrir menu da conta</span>
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-linha bg-branco py-1 shadow-[0_8px_24px_rgba(31,26,28,0.08)]">
          <div className="border-b border-linha px-4 py-3">
            <p className="truncate text-sm font-semibold text-tinta">{usuario?.nome}</p>
            <p className="truncate text-xs text-suave">{usuario?.email}</p>
          </div>
          <Link role="menuitem" to="/candidata/perfil" className={item} onClick={() => setAberto(false)}>
            <Icone nome="perfil" /> Meu perfil
          </Link>
          <Link role="menuitem" to="/candidata/configuracoes" className={item} onClick={() => setAberto(false)}>
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

function LayoutCandidata() {
  const sessao = useSessao()
  const usuario = sessao?.usuario
  const perfil = useDadosLocais(() => lerPerfil(usuario), [EVENTO_PERFIL])
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [gaveta, setGaveta] = useState(false)

  // Fecha a gaveta ao trocar de página e leva o foco ao topo.
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
    const esc = (e) => e.key === 'Escape' && setGaveta(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [gaveta])

  function handleSair() {
    sair()
    navigate('/login', { replace: true })
  }

  const atalho = 'grid size-10 place-items-center rounded-full text-tinta-2 transition-colors hover:bg-papel-2 hover:text-tinta aria-[current=page]:bg-blush aria-[current=page]:text-vinho'

  const navegacao = (aoNavegar) => (
    <nav aria-label="Área da candidata" className="flex flex-col gap-0.5">
      {MENU.map((item) => (
        <ItemMenu key={item.para} item={item} aoNavegar={aoNavegar} />
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-papel">
      <a
        href="#conteudo"
        className="sr-only z-[70] rounded-md bg-vinho px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      {/* Menu lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-linha bg-branco lg:flex">
        <Link to="/candidata/feed" className="flex h-16 items-center px-6" aria-label="BLOOM, ir para o feed">
          <Logo />
        </Link>
        <div className="flex-1 overflow-y-auto px-3 py-4">{navegacao()}</div>
        <div className="border-t border-linha p-3">
          <button
            type="button"
            onClick={handleSair}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium text-tinta-2 hover:bg-papel-2 hover:text-tinta"
          >
            <Icone nome="sair" tamanho={20} /> Sair da conta
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-linha bg-branco/95 px-4 backdrop-blur-sm sm:px-6 lg:px-10">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md text-tinta hover:bg-papel-2 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={gaveta}
            aria-controls="gaveta-candidata"
            onClick={() => setGaveta(true)}
          >
            <Icone nome="menu" tamanho={22} />
          </button>
          <Link to="/candidata/feed" className="lg:hidden" aria-label="BLOOM, ir para o feed">
            <Logo tamanho={22} />
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <NavLink to="/candidata/mensagens" className={atalho} aria-label="Mensagens" title="Mensagens">
              <Icone nome="mensagem" tamanho={20} />
            </NavLink>
            <NavLink to="/candidata/notificacoes" className={atalho} aria-label="Notificações" title="Notificações">
              <Icone nome="sino" tamanho={20} />
            </NavLink>
            <MenuConta usuario={usuario} foto={perfil.foto} aoSair={handleSair} />
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-8 focus:outline-none sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>

      {/* Gaveta (celular e tablet) */}
      {gaveta && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="gaveta-candidata">
          <button type="button" className="absolute inset-0 bg-tinta/40" aria-label="Fechar menu" onClick={() => setGaveta(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-branco">
            <div className="flex h-16 items-center justify-between border-b border-linha px-4">
              <Logo tamanho={22} />
              <button type="button" className="grid size-10 place-items-center rounded-md hover:bg-papel-2" aria-label="Fechar menu" onClick={() => setGaveta(false)}>
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">{navegacao(() => setGaveta(false))}</div>
            <div className="border-t border-linha p-3">
              <button
                type="button"
                onClick={handleSair}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium text-tinta-2 hover:bg-papel-2"
              >
                <Icone nome="sair" tamanho={20} /> Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LayoutCandidata
