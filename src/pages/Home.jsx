import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import CarrosselAreas from '../components/CarrosselAreas'
import { obterSessao, sair } from '../services/auth'

import bannerBloom from '../assets/banner-bloom.png'
import logoBloom from '../assets/logo-bloom.png'

import '../App.css'

const vagas = [
  {
    id: 1,
    empresa: 'Itaú',
    logo: 'itaú',
    titulo: 'Engenheira de Software Pleno - JAVA',
    local: 'São Paulo - SP',
    modalidade: 'Híbrido',
    tempo: 'Há 2 dias',
  },
  {
    id: 2,
    empresa: 'BTG Pactual',
    logo: 'btg',
    titulo: 'Engenheira de Software Sênior - Data Owner',
    local: 'Botucatu - SP',
    modalidade: 'Presencial',
    tempo: 'Há 1 semana',
  },
  {
    id: 3,
    empresa: 'Porto Seguro',
    logo: 'porto',
    titulo: 'Analista de Inteligência de Dados Sênior',
    local: 'Santos - SP',
    modalidade: 'Híbrido',
    tempo: 'Há 3 dias',
  },
  {
    id: 4,
    empresa: 'Banco do Brasil',
    logo: 'bb',
    titulo: 'Analista DevOps - Júnior',
    local: 'São Paulo - SP',
    modalidade: 'Remoto',
    tempo: 'Há 5 dias',
  },
]

const empresas = [
  {
    nome: 'Banco do Brasil',
    logo: 'bb',
    descricao:
      'Uma das principais instituições financeiras do país, com uma trajetória de inovação e tecnologia.',
  },
  {
    nome: 'Porto Seguro',
    logo: 'porto',
    descricao:
      'Uma empresa reconhecida por suas soluções em seguros, tecnologia e atendimento.',
  },
  {
    nome: 'Sebrae',
    logo: 'sebrae',
    descricao:
      'Instituição que apoia o empreendedorismo e o desenvolvimento de pequenos negócios.',
  },
]

// Áreas de T.I. do carrossel. "filtro" é o valor do filtro de área da página
// de vagas (só as áreas que já existem lá levam o filtro; as demais abrem todas).
const areasTI = [
  {
    nome: 'Desenvolvimento',
    descricao: 'Front-end, back-end, mobile e full stack.',
    filtro: 'Desenvolvimento',
  },
  {
    nome: 'Dados',
    descricao: 'Análise de dados, engenharia de dados, BI e ciência de dados.',
    filtro: 'Dados',
  },
  {
    nome: 'DevOps / Cloud',
    descricao: 'Automação, infraestrutura como código e computação em nuvem.',
    filtro: 'Infraestrutura',
  },
  {
    nome: 'UX / UI Design',
    descricao: 'Pesquisa com usuárias, design de interfaces e experiência digital.',
  },
  {
    nome: 'Segurança da Informação',
    descricao: 'Proteção de dados, redes, sistemas e conformidade.',
  },
  {
    nome: 'QA / Testes',
    descricao: 'Qualidade de software, testes manuais e automação de testes.',
  },
  {
    nome: 'Infraestrutura e Redes',
    descricao: 'Servidores, redes e sustentação de ambientes de tecnologia.',
    filtro: 'Infraestrutura',
  },
  {
    nome: 'Suporte Técnico',
    descricao: 'Atendimento, help desk e suporte a sistemas e usuários.',
    filtro: 'Suporte',
  },
  {
    nome: 'Inteligência Artificial',
    descricao: 'Machine learning, IA generativa e automação inteligente.',
  },
  {
    nome: 'Produto e Agilidade',
    descricao: 'Gestão de produto, Scrum e coordenação de projetos de tecnologia.',
  },
]

function Home() {
  const { hash } = useLocation()
  const navigate = useNavigate()

  const [sessao, setSessao] = useState(obterSessao)
  const estaAutenticada = Boolean(sessao?.usuario)

  const [salvas, setSalvas] = useState(() => {
    try {
      const salvasLocais = JSON.parse(
        localStorage.getItem('bloom-vagas-salvas') || '[]'
      )
      return Array.isArray(salvasLocais) ? salvasLocais : []
    } catch {
      return []
    }
  })

  const [busca, setBusca] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const searchRef = useRef(null)

  // Sincroniza estado de autenticação em tempo real
  useEffect(() => {
    function atualizarSessao() {
      setSessao(obterSessao())
    }

    window.addEventListener('storage', atualizarSessao)
    window.addEventListener('bloom-sessao-atualizada', atualizarSessao)

    return () => {
      window.removeEventListener('storage', atualizarSessao)
      window.removeEventListener('bloom-sessao-atualizada', atualizarSessao)
    }
  }, [])

  // Links como /#contato ou /#empresas rolam até a seção.
  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hash])

  function handleSair(e) {
    e.preventDefault()
    sair()
    setSessao(null)
  }

  function handleBusca(e) {
    e.preventDefault()
    if (busca.trim()) {
      navigate(`/vagas?busca=${encodeURIComponent(busca.trim())}`)
    } else {
      navigate('/vagas')
    }
  }

  function alternarSalva(id) {
    if (!estaAutenticada) {
      navigate('/login')
      return
    }

    setSalvas((atuais) => {
      const novas = atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]

      try {
        localStorage.setItem('bloom-vagas-salvas', JSON.stringify(novas))
        window.dispatchEvent(new Event('storage'))
      } catch {
        // Mantém em memória durante a sessão
      }

      return novas
    })
  }

  return (
    <main className="bloom-home">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="home-header">
        <Link to="/" className="home-logo" aria-label="BLOOM — página inicial">
          <img src={logoBloom} alt="BLOOM" />
        </Link>

        <nav className="home-nav" aria-label="Navegação principal">
          <Link to="/" className="home-nav-ativo">Home</Link>
          <Link to={estaAutenticada ? '/vagas' : '/login'}>Vagas</Link>
          <a href="#empresas">Empresas</a>
          <a href="#contato">Contato</a>
        </nav>

        {/* Barra de pesquisa — visível apenas quando autenticada */}
        {estaAutenticada && (
          <form
            className="home-busca"
            onSubmit={handleBusca}
            role="search"
            aria-label="Buscar vagas"
          >
            <svg
              className="home-busca-icone"
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              className="home-busca-input"
              placeholder="Buscar vagas, empresas…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar vagas"
            />
          </form>
        )}

        <div className="home-header-acoes">
          {estaAutenticada ? (
            <>
              <Link
                to="/perfil"
                className="home-perfil"
                aria-label="Meu perfil"
                title={sessao?.usuario?.nome || 'Meu perfil'}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </Link>
              <button
                type="button"
                className="home-login"
                onClick={handleSair}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="home-login">Entrar</Link>
              <Link to="/cadastro" className="home-cadastro">Cadastre-se</Link>
            </>
          )}

          {/* Botão hamburger para mobile */}
          <button
            type="button"
            className="home-hamburger"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="home-nav-mobile" role="dialog" aria-label="Menu de navegação">
          <nav>
            <Link to="/" onClick={() => setMenuAberto(false)}>Home</Link>
            <Link to={estaAutenticada ? '/vagas' : '/login'} onClick={() => setMenuAberto(false)}>Vagas</Link>
            <a href="#empresas" onClick={() => setMenuAberto(false)}>Empresas</a>
            <a href="#contato" onClick={() => setMenuAberto(false)}>Contato</a>
          </nav>
          {estaAutenticada && (
            <form className="home-busca home-busca-mobile" onSubmit={(e) => { handleBusca(e); setMenuAberto(false) }}>
              <svg className="home-busca-icone" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                className="home-busca-input"
                placeholder="Buscar vagas…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </form>
          )}
        </div>
      )}

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="home-hero">
        <img
          src={bannerBloom}
          alt="Mulheres colaborando em um ambiente de tecnologia"
          className="home-banner"
        />

        <div className="home-hero-conteudo">
          <span className="home-etiqueta">
            CARREIRAS · TECNOLOGIA · OPORTUNIDADES
          </span>

          <h1>
            Conectando mulheres da tecnologia a{' '}
            <span>oportunidades reais.</span>
          </h1>

          <p>
            O BLOOM conecta talentos a oportunidades profissionais
            e empresas que valorizam o potencial das mulheres na tecnologia.
          </p>

          <Link
            to={estaAutenticada ? '/vagas' : '/login'}
            className="home-botao-principal"
          >
            Buscar vagas <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {/* ── CARROSSEL ──────────────────────────────────────── */}
      <section className="home-categorias" id="areas">
        <p className="home-legenda">EXPLORE SUAS POSSIBILIDADES</p>
        <h2>Vagas em todas as áreas de T.I.</h2>

        <CarrosselAreas areas={areasTI} estaAutenticada={estaAutenticada} />
      </section>

      {/* ── VAGAS RECOMENDADAS ─────────────────────────────── */}
      <section className="home-vagas">
        <div className="home-titulo-secao">
          <div>
            <p className="home-legenda">OPORTUNIDADES PARA VOCÊ</p>
            <h2>Vagas recomendadas</h2>
          </div>

          <Link
            to={estaAutenticada ? '/vagas' : '/login'}
            className="home-ver-todas"
          >
            Ver todas as vagas <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="home-vagas-grade">
          {vagas.map((vaga) => {
            const favoritada = salvas.includes(vaga.id)

            return (
              <article className="home-vaga-card" key={vaga.id}>
                <div className="home-vaga-empresa">
                  <div className={`home-empresa-logo ${vaga.logo}`}>
                    {vaga.logo}
                  </div>
                  <span>{vaga.empresa}</span>
                  <button
                    type="button"
                    className="home-salvar"
                    title={favoritada ? 'Remover dos favoritos' : 'Salvar vaga'}
                    aria-label="Salvar vaga"
                    onClick={() => alternarSalva(vaga.id)}
                  >
                    {favoritada ? '♥' : '♡'}
                  </button>
                </div>

                <h3>{vaga.titulo}</h3>
                <p className="home-local">{vaga.local}</p>

                <div className="home-vaga-info">
                  <span className="home-badge">{vaga.modalidade}</span>
                  <span className="home-tempo">{vaga.tempo}</span>
                </div>

                <div className="home-vaga-acoes">
                  <Link
                    to={estaAutenticada ? `/vagas/${vaga.id}` : '/login'}
                    className="home-detalhes"
                  >
                    Detalhes
                  </Link>
                  <Link
                    to={estaAutenticada ? `/vagas/${vaga.id}` : '/login'}
                    className="home-candidatar"
                  >
                    Candidatar-se
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── EMPRESAS ───────────────────────────────────────── */}
      <section className="home-empresas" id="empresas">
        <div className="home-titulo-secao">
          <div>
            <p className="home-legenda">CONEXÕES QUE IMPULSIONAM</p>
            <h2>
              Empresas alinhadas <span>ao seu futuro.</span>
            </h2>
          </div>
        </div>

        <div className="home-empresas-lista">
          {empresas.map((empresa) => (
            <article className="home-empresa-card" key={empresa.nome}>
              <div
                className={`home-empresa-logo home-logo-${empresa.logo}`}
              >
                {empresa.logo}
              </div>

              <div className="home-empresa-texto">
                <h3>{empresa.nome}</h3>
                <p>{empresa.descricao}</p>
              </div>

              <Link
                to={estaAutenticada ? '/vagas' : '/login'}
                className="home-conhecer"
              >
                Conhecer
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="home-chamada">
        <div className="home-chamada-orb home-chamada-orb-1" aria-hidden="true" />
        <div className="home-chamada-orb home-chamada-orb-2" aria-hidden="true" />

        <div className="home-chamada-conteudo">
          <p className="home-legenda">SEU PRÓXIMO PASSO COMEÇA AQUI</p>
          <h2>Seu talento merece espaço para florescer.</h2>
          <p>
            Descubra oportunidades e construa seu próximo capítulo
            na área de tecnologia.
          </p>
        </div>

        <Link
          to={estaAutenticada ? '/vagas' : '/login'}
          className="home-botao-claro"
        >
          Ver vagas <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="home-footer" id="contato">
        <div className="home-footer-topo">
          <div className="home-footer-marca">
            <Link to="/" className="home-footer-logo" aria-label="BLOOM — página inicial">
              <img src={logoBloom} alt="BLOOM" />
            </Link>
            <p>
              Uma plataforma que conecta mulheres a oportunidades,
              empresas e novos caminhos na tecnologia.
            </p>

            {/* Redes sociais decorativas */}
            <div className="home-footer-redes" aria-label="Redes sociais">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="home-footer-rede">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="home-footer-rede">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.7"/><path d="M8 10v6M8 7v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M12 16v-3a2 2 0 0 1 4 0v3M12 10v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </a>
              <a href="mailto:contato@bloom.com.br" aria-label="E-mail" className="home-footer-rede">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </a>
            </div>
          </div>

          <div className="home-footer-coluna">
            <h3>Navegue</h3>
            <Link to="/">Home</Link>
            <Link to={estaAutenticada ? '/vagas' : '/login'}>Vagas</Link>
            <Link to={estaAutenticada ? '/perfil' : '/login'}>Meu perfil</Link>
            <Link to={estaAutenticada ? '/vagas-salvas' : '/login'}>Vagas salvas</Link>
          </div>

          <div className="home-footer-coluna">
            <h3>Empresas</h3>
            <Link to="/empresa/login">Área da empresa</Link>
            <Link to="/empresa/cadastro">Cadastrar empresa</Link>
          </div>

          <div className="home-footer-coluna">
            <h3>Contato</h3>
            <a href="mailto:contato@bloom.com.br">Fale com o BLOOM</a>
            <a href="#contato">Central de ajuda</a>
          </div>
        </div>

        <div className="home-footer-final">
          <span>© 2026 BLOOM · Florescendo oportunidades na tecnologia.</span>
          <button
            type="button"
            className="home-footer-topo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Voltar ao topo"
          >
            ↑ Topo
          </button>
        </div>
      </footer>
    </main>
  )
}

export default Home
