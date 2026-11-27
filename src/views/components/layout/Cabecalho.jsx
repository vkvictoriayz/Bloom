import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import BuscaVagas from './BuscaVagas'
import Icone from '../Icone'
import Logo from '../Logo'
import Botao from '../ui/Botao'
import NavSpotlight from '../ui/NavSpotlight'
import { iniciais, primeiroNome, useSessao } from '../../hooks/useSessao'
import { sair } from '../../services/auth'
import { cn } from '../../lib/cn'

const NAV_PUBLICA = [
  { rotulo: 'Oportunidades', para: '/#areas' },
  { rotulo: 'Empresas', para: '/empresas' },
  { rotulo: 'Como funciona', para: '/#como-funciona' },
  { rotulo: 'Para empresas', para: '/empresa/login' },
]

const NAV_PRIVADA = [
  { rotulo: 'Início', para: '/', fim: true },
  { rotulo: 'Vagas', para: '/vagas' },
  { rotulo: 'Candidaturas', para: '/minhas-candidaturas' },
  { rotulo: 'Empresas', para: '/empresas' },
  { rotulo: 'Comunidade', para: '/comunidade' },
  { rotulo: 'Mensagens', para: '/candidata/mensagens' },
]

const NAV_EMPRESA = [
  { rotulo: 'Feed', para: '/empresa/feed' },
  { rotulo: 'Vagas', para: '/empresa/vagas' },
  { rotulo: 'Candidaturas', para: '/empresa/candidaturas' },
  { rotulo: 'Talentos', para: '/empresa/explorar' },
  { rotulo: 'Empresas', para: '/empresas' },
]

const CONTA = {
  usuaria: [
    { rotulo: 'Meu perfil', para: '/perfil', icone: 'perfil' },
    { rotulo: 'Vagas salvas', para: '/vagas-salvas', icone: 'coracao' },
  ],
  empresa: [
    { rotulo: 'Perfil da empresa', para: '/empresa/perfil', icone: 'predio' },
    { rotulo: 'Configurações', para: '/empresa/configuracoes', icone: 'engrenagem' },
  ],
}

function ItemNav({ item, mobile }) {
  const ancora = item.para.includes('#')
  const Componente = ancora ? Link : NavLink

  return (
    <Componente
      to={item.para}
      end={ancora ? undefined : item.fim}
      className={
        mobile
          ? 'group flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-medium tracking-[0.01em] text-tinta-2 transition-colors duration-200 hover:bg-blush/60 hover:text-vinho-escuro aria-[current=page]:bg-blush aria-[current=page]:text-vinho'
          : 'relative z-10 rounded-full px-4 py-2 text-[14px] font-medium tracking-[0.01em] text-tinta-2 transition-colors duration-300 hover:text-vinho-escuro focus-visible:outline-offset-0 aria-[current=page]:font-semibold aria-[current=page]:text-vinho'
      }
    >
      {item.rotulo}
      {mobile && (
        <span aria-hidden="true" className="text-rosa/60 transition-transform duration-200 group-hover:translate-x-1">→</span>
      )}
    </Componente>
  )
}

function MenuConta({ usuario, atalhos, aoSair }) {
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

  const itemMenu = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-tinta-2 hover:bg-papel-2 hover:text-tinta'

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-papel-2"
      >
        <span className="grid size-8 place-items-center rounded-full bg-vinho text-xs font-bold text-white">
          {iniciais(usuario?.nome) || <Icone nome="perfil" tamanho={16} />}
        </span>
        <span className="hidden text-sm font-semibold text-tinta xl:inline">{primeiroNome(usuario?.nome)}</span>
        <svg viewBox="0 0 12 12" className={cn('size-3 text-suave transition-transform', aberto && 'rotate-180')} aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="sr-only">Abrir menu da conta</span>
      </button>

      {aberto && (
        <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-linha bg-branco py-1 shadow-menu">
          <div className="border-b border-linha px-4 py-3">
            <p className="truncate text-sm font-semibold text-tinta">{usuario?.nome}</p>
            <p className="truncate text-xs text-suave">{usuario?.email}</p>
          </div>
          {atalhos.map((a) => (
            <Link key={a.para} role="menuitem" to={a.para} className={itemMenu} onClick={() => setAberto(false)}>
              <Icone nome={a.icone} /> {a.rotulo}
            </Link>
          ))}
          <button role="menuitem" type="button" className={cn(itemMenu, 'border-t border-linha')} onClick={aoSair}>
            <Icone nome="sair" /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

function Cabecalho() {
  const sessao = useSessao()
  const autenticada = Boolean(sessao?.usuario)
  const empresa = sessao?.usuario?.tipo === 'empresa'
  const atalhos = CONTA[empresa ? 'empresa' : 'usuaria']
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [rolou, setRolou] = useState(false)

  const [paginaAnterior, setPaginaAnterior] = useState(pathname)
  if (paginaAnterior !== pathname) {
    setPaginaAnterior(pathname)
    setMenuAberto(false)
  }

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  useEffect(() => {
    if (!menuAberto) return
    const esc = (e) => e.key === 'Escape' && setMenuAberto(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [menuAberto])

  function handleSair() {
    sair()
    navigate(empresa ? '/empresa/login' : '/')
  }

  const itens = !autenticada ? NAV_PUBLICA : empresa ? NAV_EMPRESA : NAV_PRIVADA

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-md backdrop-saturate-150 transition-[border-color,box-shadow,background-color] duration-300',
        rolou || menuAberto
          ? 'border-rosa/10 bg-papel/90 shadow-[0_10px_30px_-22px_rgba(94,26,50,0.35)]'
          : 'border-transparent bg-papel/70'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Link to="/" aria-label="BLOOM, página inicial" className="shrink-0 rounded-sm">
          <Logo />
        </Link>

        <NavSpotlight rotulo="Navegação principal" className={cn('hidden gap-0.5 rounded-full border border-rosa/10 bg-white/60 p-1 lg:flex', autenticada ? 'ml-4' : 'mx-auto')}>
          {itens.map((item) => (
            <ItemNav key={item.rotulo} item={item} />
          ))}
        </NavSpotlight>

        <div className={cn('hidden items-center gap-2 lg:flex', autenticada && 'ml-auto')}>
          {autenticada ? (
            <>
              {!empresa && <BuscaVagas className="w-56 xl:w-72" />}
              <MenuConta usuario={sessao.usuario} atalhos={atalhos} aoSair={handleSair} />
            </>
          ) : (
            <>
              <Botao
                as={Link}
                to="/login"
                variante="fantasma"
                className="px-4 text-[14px] text-tinta-2 transition-colors duration-300 hover:bg-transparent hover:text-vinho-escuro"
              >
                Entrar
              </Botao>
              <Botao
                as={Link}
                to="/cadastro"
                className="bg-rosa px-5 text-[14px] shadow-[0_8px_20px_-10px_rgba(156,74,99,0.8)] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-px hover:bg-vinho hover:shadow-[0_12px_24px_-10px_rgba(133,36,61,0.75)]"
              >
                Criar conta <Icone nome="seta" tamanho={15} />
              </Botao>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto grid size-10 place-items-center rounded-full border border-rosa/15 bg-white/70 text-vinho-escuro transition-colors duration-200 hover:bg-blush lg:hidden"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          aria-controls="menu-mobile"
          onClick={() => setMenuAberto((v) => !v)}
        >
          <Icone nome={menuAberto ? 'fechar' : 'menu'} tamanho={22} />
        </button>
      </div>

      {menuAberto && (
        <div id="menu-mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-rosa/10 px-4 pt-3 pb-6 motion-safe:animate-[entrar_0.25s_ease_both] sm:px-6 lg:hidden">
          {autenticada && (
            <>
              <div className="mb-4 flex items-center gap-3 border-b border-linha pb-4">
                <span className="grid size-10 place-items-center rounded-full bg-vinho text-sm font-bold text-white">
                  {iniciais(sessao.usuario.nome)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{sessao.usuario.nome}</p>
                  <p className="truncate text-sm text-suave">{sessao.usuario.email}</p>
                </div>
              </div>
              {!empresa && <BuscaVagas className="mb-3" aoBuscar={() => setMenuAberto(false)} />}
            </>
          )}

          <nav aria-label="Menu" className="flex flex-col gap-0.5">
            {itens.map((item) => (
              <ItemNav key={item.rotulo} item={item} mobile />
            ))}
            {autenticada && atalhos.map((a) => <ItemNav key={a.para} item={a} mobile />)}
          </nav>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-rosa/10 pt-5">
            {autenticada ? (
              <Botao variante="secundario" className="col-span-2" onClick={handleSair}>
                <Icone nome="sair" /> Sair
              </Botao>
            ) : (
              <>
                <Botao as={Link} to="/login" variante="secundario" tamanho="lg" className="border-rosa/25 text-vinho-escuro hover:border-rosa/50 hover:bg-blush/50">
                  Entrar
                </Botao>
                <Botao as={Link} to="/cadastro" tamanho="lg" className="bg-rosa shadow-[0_8px_20px_-10px_rgba(156,74,99,0.8)] hover:bg-vinho">
                  Criar conta
                </Botao>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Cabecalho
