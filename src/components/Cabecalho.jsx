import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { obterSessao, sair } from '../services/auth'
import logoBloom from '../assets/logo-bloom.png'
import './Layout.css'

function IconeLupa() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// Barra de pesquisa de vagas: só aparece com a pessoa autenticada.
// Envia o termo para /vagas?busca=..., que filtra a lista de vagas.
function BuscaVagas({ aoBuscar, className = '' }) {
  const { pathname } = useLocation()
  const [parametros] = useSearchParams()
  const termoDaUrl = pathname === '/vagas' ? parametros.get('busca') || '' : ''

  const [termo, setTermo] = useState(termoDaUrl)

  // Mantém o campo igual à URL (ex.: ao limpar a pesquisa na página de vagas).
  useEffect(() => setTermo(termoDaUrl), [termoDaUrl])

  const navigate = useNavigate()

  function enviar(e) {
    e.preventDefault()
    const limpo = termo.trim()
    navigate(limpo ? `/vagas?busca=${encodeURIComponent(limpo)}` : '/vagas')
    aoBuscar?.()
  }

  function limpar() {
    setTermo('')
    if (pathname === '/vagas') navigate('/vagas')
  }

  return (
    <form className={`busca ${className}`} role="search" onSubmit={enviar}>
      <span className="busca-icone"><IconeLupa /></span>
      <input
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar cargo, tecnologia ou empresa"
        aria-label="Buscar vagas por cargo, tecnologia, empresa ou palavra-chave"
      />
      {termo && (
        <button type="button" className="busca-limpar" onClick={limpar} aria-label="Limpar pesquisa">
          ×
        </button>
      )}
    </form>
  )
}

function Cabecalho() {
  const { pathname } = useLocation()
  const [sessao, setSessao] = useState(obterSessao)
  const [menuAberto, setMenuAberto] = useState(false)
  const [rolou, setRolou] = useState(false)
  const autenticada = Boolean(sessao?.usuario)

  useEffect(() => {
    const atualizar = () => setSessao(obterSessao())
    window.addEventListener('storage', atualizar)
    window.addEventListener('bloom-sessao-atualizada', atualizar)
    return () => {
      window.removeEventListener('storage', atualizar)
      window.removeEventListener('bloom-sessao-atualizada', atualizar)
    }
  }, [])

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 4)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  // Fecha o menu ao trocar de página e com Esc.
  useEffect(() => setMenuAberto(false), [pathname])
  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (e) => e.key === 'Escape' && setMenuAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  function handleSair() {
    sair()
    setSessao(null)
  }

  const itens = [
    { rotulo: 'Início', para: '/', fim: true },
    { rotulo: 'Vagas', para: autenticada ? '/vagas' : '/login' },
    { rotulo: 'Empresas', para: '/#empresas' },
    { rotulo: 'Contato', para: '/#contato' },
  ]

  const navegacao = itens.map((item) => (
    <NavLink
      key={item.rotulo}
      to={item.para}
      end={item.fim}
      className={({ isActive }) =>
        isActive && !item.para.includes('#') && item.para !== '/login' ? 'ativo' : undefined
      }
    >
      {item.rotulo}
    </NavLink>
  ))

  return (
    <header className={`cabecalho${rolou ? ' cabecalho-rolado' : ''}`}>
      <div className="cabecalho-interno">
        <Link to="/" className="cabecalho-logo" aria-label="BLOOM, página inicial">
          <img src={logoBloom} alt="" />
          <span>BLOOM</span>
        </Link>

        <nav className="cabecalho-nav" aria-label="Navegação principal">
          {navegacao}
        </nav>

        {autenticada && <BuscaVagas className="cabecalho-busca" />}

        <div className="cabecalho-acoes">
          {autenticada ? (
            <>
              <Link to="/perfil" className="botao botao-contorno">Meu perfil</Link>
              <Link to="/" className="botao botao-texto" onClick={handleSair}>Sair</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="botao botao-contorno">Entrar</Link>
              <Link to="/cadastro" className="botao botao-primario">Cadastre-se</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="cabecalho-menu-botao"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          aria-controls="menu-mobile"
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>

      {menuAberto && (
        <div className="cabecalho-mobile" id="menu-mobile">
          {autenticada && <BuscaVagas aoBuscar={() => setMenuAberto(false)} />}
          <nav aria-label="Menu mobile">{navegacao}</nav>
          <div className="cabecalho-mobile-acoes">
            {autenticada ? (
              <>
                <Link to="/perfil" className="botao botao-contorno">Meu perfil</Link>
                <Link to="/" className="botao botao-primario" onClick={handleSair}>Sair</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="botao botao-contorno">Entrar</Link>
                <Link to="/cadastro" className="botao botao-primario">Cadastre-se</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Cabecalho
