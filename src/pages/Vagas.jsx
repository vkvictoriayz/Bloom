
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { sair } from '../services/auth'
import logoBloom from '../assets/logo-bloom.png'
import './Vagas.css'

const CHAVE_FAVORITOS = 'bloom-vagas-salvas'
const CHAVE_CANDIDATURAS = 'bloom-candidaturas'

const vagasExemplo = [
  {
    id: 1,
    cargo: 'Engenheira de Software Pleno - JAVA',
    empresa: 'Itaú',
    local: 'São Paulo, SP',
    modalidade: 'Híbrido',
    tipo: 'CLT',
    area: 'Desenvolvimento',
    publicada: 'Há 2 dias',
    descricao:
      'Desenvolva soluções e participe de projetos de tecnologia em equipe.',
    competencias: ['Java', 'Spring', 'SQL'],
  },
  {
    id: 2,
    cargo: 'Engenheira de Software Sênior - Data Owner',
    empresa: 'BTG Pactual',
    local: 'Botucatu, SP',
    modalidade: 'Presencial',
    tipo: 'CLT',
    area: 'Dados',
    publicada: 'Há 3 dias',
    descricao:
      'Atue com dados, tecnologia e soluções para desafios de negócio.',
    competencias: ['SQL', 'Dados', 'Python'],
  },
  {
    id: 3,
    cargo: 'Analista de Inteligência de Dados Sênior',
    empresa: 'Porto Seguro',
    local: 'Bragança Paulista, SP',
    modalidade: 'Híbrido',
    tipo: 'CLT',
    area: 'Dados',
    publicada: 'Há 1 semana',
    descricao:
      'Transforme dados em informações úteis para decisões estratégicas.',
    competencias: ['SQL', 'Power BI', 'Excel'],
  },
  {
    id: 4,
    cargo: 'Analista DevOps Júnior',
    empresa: 'Banco do Brasil',
    local: 'Mogi das Cruzes, SP',
    modalidade: 'Remoto',
    tipo: 'CLT',
    area: 'Infraestrutura',
    publicada: 'Há 5 dias',
    descricao:
      'Colabore na automação e manutenção de ambientes de tecnologia.',
    competencias: ['Git', 'Linux', 'Cloud'],
  },
  {
    id: 5,
    cargo: 'Desenvolvedora Mobile',
    empresa: 'Ipiranga',
    local: 'Mauá, SP',
    modalidade: 'Remoto',
    tipo: 'CLT',
    area: 'Desenvolvimento',
    publicada: 'Há 3 semanas',
    descricao:
      'Ajude a criar e aprimorar experiências em aplicativos móveis.',
    competencias: ['React Native', 'JavaScript'],
  },
  {
    id: 6,
    cargo: 'Assistente de Tecnologia da Informação',
    empresa: 'Unimed',
    local: 'Campinas, SP',
    modalidade: 'Presencial',
    tipo: 'CLT',
    area: 'Suporte',
    publicada: 'Há 1 dia',
    descricao:
      'Apoie a equipe na organização e resolução de demandas técnicas.',
    competencias: ['Suporte', 'Redes', 'Sistemas'],
  },
]

function lerLista(chave) {
  try {
    const dados = JSON.parse(localStorage.getItem(chave) || '[]')
    return Array.isArray(dados) ? dados : []
  } catch {
    return []
  }
}

const AREAS = ['Desenvolvimento', 'Dados', 'Infraestrutura', 'Suporte']

function Vagas() {
  // O carrossel da Home abre esta página com /vagas?area=Dados
  const [parametros] = useSearchParams()
  const areaDaUrl = parametros.get('area')

  const [busca, setBusca] = useState('')
  const [modalidade, setModalidade] = useState('')
  const [area, setArea] = useState(AREAS.includes(areaDaUrl) ? areaDaUrl : '')

  const [salvas, setSalvas] = useState(() =>
    lerLista(CHAVE_FAVORITOS)
  )

  const [candidaturas, setCandidaturas] = useState(() =>
    lerLista(CHAVE_CANDIDATURAS)
  )

  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(salvas))
    } catch {
      // Os favoritos continuam disponíveis durante esta sessão.
    }
  }, [salvas])

  useEffect(() => {
    function atualizarCandidaturas() {
      setCandidaturas(lerLista(CHAVE_CANDIDATURAS))
    }

    window.addEventListener(
      'bloom-candidaturas-atualizadas',
      atualizarCandidaturas
    )

    window.addEventListener('storage', atualizarCandidaturas)

    return () => {
      window.removeEventListener(
        'bloom-candidaturas-atualizadas',
        atualizarCandidaturas
      )

      window.removeEventListener('storage', atualizarCandidaturas)
    }
  }, [])

  const vagasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return vagasExemplo.filter((vaga) => {
      const correspondeBusca =
        !termo ||
        [
          vaga.cargo,
          vaga.empresa,
          vaga.local,
          vaga.area,
          ...vaga.competencias,
        ]
          .join(' ')
          .toLowerCase()
          .includes(termo)

      const correspondeModalidade =
        !modalidade || vaga.modalidade === modalidade

      const correspondeArea = !area || vaga.area === area

      return (
        correspondeBusca &&
        correspondeModalidade &&
        correspondeArea
      )
    })
  }, [busca, modalidade, area])

  function alternarSalva(id) {
    setSalvas((atuais) => {
      const jaSalva = atuais.some(
        (item) => String(item) === String(id)
      )

      return jaSalva
        ? atuais.filter((item) => String(item) !== String(id))
        : [...atuais, id]
    })
  }

  function jaCandidatou(id) {
    return candidaturas.some(
      (item) => String(item.vagaId) === String(id)
    )
  }

  function candidatar(vaga) {
    // Lemos novamente para evitar usar uma lista desatualizada.
    const atuais = lerLista(CHAVE_CANDIDATURAS)

    const candidaturaExistente = atuais.some(
      (item) => String(item.vagaId) === String(vaga.id)
    )

    if (candidaturaExistente) {
      setCandidaturas(atuais)
      setMensagem(`Você já se candidatou à vaga da ${vaga.empresa}.`)
      return
    }

    const novaCandidatura = {
      id: `${vaga.id}-${Date.now()}`,
      vagaId: vaga.id,
      cargo: vaga.cargo,
      empresa: vaga.empresa,
      local: vaga.local,
      modalidade: vaga.modalidade,
      data: new Date().toLocaleDateString('pt-BR'),
      status: 'Em análise',
    }

    const listaAtualizada = [...atuais, novaCandidatura]

    try {
      localStorage.setItem(
        CHAVE_CANDIDATURAS,
        JSON.stringify(listaAtualizada)
      )

      setCandidaturas(listaAtualizada)
      setMensagem(
        `Candidatura para ${vaga.cargo} registrada! Acesse Meu perfil para acompanhá-la.`
      )

      window.dispatchEvent(
        new Event('bloom-candidaturas-atualizadas')
      )
    } catch {
      setMensagem(
        'Não foi possível salvar a candidatura neste navegador.'
      )
    }
  }

  return (
    <div className="vagas-page">
      <header className="vagas-header">
        <Link to="/" className="vagas-logo">
          <img src={logoBloom} alt="BLOOM" />
        </Link>

        <nav className="vagas-nav">
          <Link to="/">Início</Link>
          <Link to="/vagas" className="active">
            Vagas
          </Link>
          <Link to="/#contato">Contatos</Link>
        </nav>

        <div className="vagas-acoes">
          <Link to="/perfil" className="vagas-profile-link">
            Meu perfil
          </Link>

          <Link to="/" className="vagas-profile-link" onClick={sair}>
            Sair
          </Link>
        </div>
      </header>

      <main className="vagas-content">
        <div className="vagas-heading">
          <h1>VAGAS</h1>
        </div>

        <section className="vagas-search">
          <label htmlFor="buscar-vaga">
            Encontre as melhores vagas do mercado
          </label>

          <div className="vagas-search-row">
            <input
              id="buscar-vaga"
              type="search"
              placeholder="Cargo, empresa ou competência"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setBusca(busca.trim())}
            >
              Buscar
            </button>
          </div>
        </section>

        {mensagem && (
          <div className="detalhes-mensagem" role="status">
            {mensagem}
            <button
              type="button"
              onClick={() => setMensagem('')}
              aria-label="Fechar mensagem"
            >
              ×
            </button>
          </div>
        )}

        <div className="vagas-layout">
          <aside className="vagas-sidebar">
            <h2>Filtros</h2>

            <label htmlFor="filtro-modalidade">
              Modalidade
            </label>

            <select
              id="filtro-modalidade"
              value={modalidade}
              onChange={(e) => setModalidade(e.target.value)}
            >
              <option value="">Qualquer modalidade</option>
              <option value="Remoto">Remoto</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Presencial">Presencial</option>
            </select>

            <label htmlFor="filtro-area">Área</label>

            <select
              id="filtro-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Todas as áreas</option>
              <option value="Desenvolvimento">
                Desenvolvimento
              </option>
              <option value="Dados">Dados</option>
              <option value="Infraestrutura">Infraestrutura</option>
              <option value="Suporte">Suporte</option>
            </select>

            <button
              type="button"
              className="vaga-save-button"
              onClick={() => {
                setBusca('')
                setModalidade('')
                setArea('')
                setMensagem('')
              }}
            >
              Limpar filtros
            </button>
          </aside>

          <section className="vagas-results">
            <div className="vagas-list-heading">
              <h2>Oportunidades</h2>
              <span>
                {vagasFiltradas.length} vagas encontradas
              </span>
            </div>

            {vagasFiltradas.length > 0 ? (
              <div className="vagas-list">
                {vagasFiltradas.map((vaga) => {
                  const favorita = salvas.some(
                    (item) => String(item) === String(vaga.id)
                  )

                  const candidaturaEnviada = jaCandidatou(vaga.id)

                  return (
                    <article
                      className="vaga-card"
                      key={vaga.id}
                    >
                      <div className="vaga-card-top">
                        <div className="vaga-company-icon">
                          {vaga.empresa.charAt(0)}
                        </div>

                        <div className="vaga-title-group">
                          <p>{vaga.empresa}</p>
                          <h3>{vaga.cargo}</h3>
                        </div>

                        <button
                          type="button"
                          className="vaga-save-button"
                          aria-label={
                            favorita
                              ? 'Remover vaga das salvas'
                              : 'Salvar vaga'
                          }
                          aria-pressed={favorita}
                          onClick={() => alternarSalva(vaga.id)}
                        >
                          {favorita ? '♥' : '♡'}
                        </button>
                      </div>

                      <p className="vaga-description">
                        {vaga.local} · {vaga.modalidade}
                      </p>

                      <p className="vaga-description">
                        {vaga.publicada}
                      </p>

                      <div className="vaga-card-bottom">
                        <Link
                          className="vaga-save-button"
                          to={`/vagas/${vaga.id}`}
                        >
                          Detalhes
                        </Link>

                        <button
                          type="button"
                          className="vaga-apply-button"
                          onClick={() => candidatar(vaga)}
                          disabled={candidaturaEnviada}
                        >
                          {candidaturaEnviada
                            ? 'Já se candidatou'
                            : 'Candidatar-se'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="vagas-empty">
                Nenhuma vaga encontrada. Tente mudar a pesquisa ou
                os filtros.
              </p>
            )}
          </section>
        </div>
      </main>

      <footer className="vagas-footer" id="contato">
        <p>
          BLOOM — Conectando mulheres a oportunidades em tecnologia.
        </p>
      </footer>
    </div>
  )
}

export default Vagas
