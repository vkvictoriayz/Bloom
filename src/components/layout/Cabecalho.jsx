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

// Duas navegações com objetivos diferentes:
//  - visitante: conhecer a Bloom e criar conta;
//  - usuária autenticada: trabalhar — vagas, candidaturas, empresas, contatos.
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
  { rotulo: 'Contatos', para: '/contatos' },
]

function ItemNav({ item, mobile }) {
  // Âncoras (/#...) não ficam "ativas": são atalhos dentro da home.
  const ancora = item.para.includes('#')
  const Componente = ancora ? Link : NavLink

  return (
    <Componente
      to={item.para}
      end={ancora ? undefined : item.fim}
      className={
        mobile
          ? 'block rounded-md px-3 py-3 text-base font-medium text-tinta-2 hover:bg-papel-2 hover:text-tinta aria-[current=page]:bg-blush aria-[current=page]:text-vinho'
          : 'relative z-10 rounded-full px-3.5 py-2 text-[14px] font-medium text-tinta-2 transition-colors hover:text-vinho focus-visible:outline-offset-0 aria-[current=page]:font-semibold aria-[current=page]:text-vinho'
      }
    >
      {item.rotulo}
    </Componente>
  )
}

// Menu da conta (avatar). Fecha com Esc e com clique fora.
function MenuConta({ usuario, aoSair }) {
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
          <Link role="menuitem" to="/perfil" className={itemMenu} onClick={() => setAberto(false)}>
            <Icone nome="perfil" /> Meu perfil
          </Link>
          <Link role="menuitem" to="/vagas-salvas" className={itemMenu} onClick={() => setAberto(false)}>
            <Icone nome="coracao" /> Vagas salvas
          </Link>
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
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [rolou, setRolou] = useState(false)

  // Fecha o menu mobile ao trocar de página.
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
    navigate('/')
  }

  const itens = autenticada ? NAV_PRIVADA : NAV_PUBLICA

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b bg-branco/95 backdrop-blur-sm transition-[border-color,box-shadow] duration-200',
        rolou ? 'border-linha shadow-[0_1px_0_rgba(31,26,28,0.03)]' : 'border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Link to="/" aria-label="BLOOM, página inicial" className="shrink-0 rounded-sm">
          <Logo />
        </Link>

        <NavSpotlight rotulo="Navegação principal" className={cn('hidden gap-1 lg:flex', autenticada ? 'ml-4' : 'mx-auto')}>
          {itens.map((item) => (
            <ItemNav key={item.rotulo} item={item} />
          ))}
        </NavSpotlight>

        <div className={cn('hidden items-center gap-3 lg:flex', autenticada && 'ml-auto')}>
          {autenticada ? (
            <>
              <BuscaVagas className="w-56 xl:w-72" />
              <MenuConta usuario={sessao.usuario} aoSair={handleSair} />
            </>
          ) : (
            <>
              <Botao as={Link} to="/login" variante="fantasma">
                Entrar
              </Botao>
              <Botao as={Link} to="/cadastro">
                Criar conta
              </Botao>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto grid size-10 place-items-center rounded-md text-tinta hover:bg-papel-2 lg:hidden"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          aria-controls="menu-mobile"
          onClick={() => setMenuAberto((v) => !v)}
        >
          <Icone nome={menuAberto ? 'fechar' : 'menu'} tamanho={22} />
        </button>
      </div>

      {menuAberto && (
        <div id="menu-mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-linha bg-papel px-4 pt-4 pb-6 sm:px-6 lg:hidden">
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
              <BuscaVagas className="mb-3" aoBuscar={() => setMenuAberto(false)} />
            </>
          )}

          <nav aria-label="Menu" className="flex flex-col">
            {itens.map((item) => (
              <ItemNav key={item.rotulo} item={item} mobile />
            ))}
            {autenticada && (
              <>
                <ItemNav item={{ rotulo: 'Meu perfil', para: '/perfil' }} mobile />
                <ItemNav item={{ rotulo: 'Vagas salvas', para: '/vagas-salvas' }} mobile />
              </>
            )}
          </nav>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-linha pt-5">
            {autenticada ? (
              <Botao variante="secundario" className="col-span-2" onClick={handleSair}>
                <Icone nome="sair" /> Sair
              </Botao>
            ) : (
              <>
                <Botao as={Link} to="/login" variante="secundario">
                  Entrar
                </Botao>
                <Botao as={Link} to="/cadastro">
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
