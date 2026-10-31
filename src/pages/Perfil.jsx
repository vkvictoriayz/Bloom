
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Cabecalho from '../components/Cabecalho'
import Rodape from '../components/Rodape'
import './Perfil.css'

const perfilInicial = {
  nome: 'Juliana Silva',
  cargo: 'Desenvolvedora Front-end',
  local: 'São Paulo, SP',
  email: 'juliana.silva@email.com',
  telefone: '(11) 99999-8888',
  sobre:
    'Desenvolvedora Front-end apaixonada por criar experiências digitais acessíveis e intuitivas. Busco oportunidades para aprender, colaborar e crescer em projetos desafiadores.',
  objetivo:
    'Atuar como desenvolvedora em um ambiente colaborativo, aprimorando minhas habilidades e contribuindo para soluções inovadoras.',
}

const vagasDisponiveis = [
  {
    id: 1,
    cargo: 'Engenheira de Software Pleno - JAVA',
    empresa: 'Itaú',
    local: 'São Paulo, SP',
    modalidade: 'Híbrido',
  },
  {
    id: 2,
    cargo: 'Engenheira de Software Sênior - Data Owner',
    empresa: 'BTG Pactual',
    local: 'Botucatu, SP',
    modalidade: 'Presencial',
  },
  {
    id: 3,
    cargo: 'Analista de Inteligência de Dados Sênior',
    empresa: 'Porto Seguro',
    local: 'Bragança Paulista, SP',
    modalidade: 'Híbrido',
  },
  {
    id: 4,
    cargo: 'Analista DevOps Júnior',
    empresa: 'Banco do Brasil',
    local: 'Mogi das Cruzes, SP',
    modalidade: 'Remoto',
  },
  {
    id: 5,
    cargo: 'Desenvolvedora Mobile',
    empresa: 'Ipiranga',
    local: 'Mauá, SP',
    modalidade: 'Remoto',
  },
  {
    id: 6,
    cargo: 'Assistente de Tecnologia da Informação',
    empresa: 'Unimed',
    local: 'Campinas, SP',
    modalidade: 'Presencial',
  },
]

function lerVagasSalvas() {
  try {
    const dados = JSON.parse(
      localStorage.getItem('bloom-vagas-salvas') || '[]'
    )

    return Array.isArray(dados) ? dados : []
  } catch {
    return []
  }
}


function lerCandidaturas() {
  try {
    const dados = JSON.parse(
      localStorage.getItem('bloom-candidaturas') || '[]'
    )

    return Array.isArray(dados) ? dados : []
  } catch {
    return []
  }
}


function Perfil() {
  const [candidaturas, setCandidaturas] = useState(lerCandidaturas)
  const [perfil, setPerfil] = useState(() => {

    try {
      const dados = JSON.parse(
        localStorage.getItem('bloom-perfil') || 'null'
      )

      return dados && typeof dados === 'object'
        ? { ...perfilInicial, ...dados }
        : perfilInicial
    } catch {
      return perfilInicial
    }
  })

  const [formulario, setFormulario] = useState(perfil)
  const [editando, setEditando] = useState(false)
  const [curriculo, setCurriculo] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [vagasSalvas, setVagasSalvas] = useState(lerVagasSalvas)

  const arquivoRef = useRef(null)

  useEffect(() => {
    function atualizarVagasSalvas() {
      setVagasSalvas(lerVagasSalvas())
    }

    function atualizarCandidaturas() {
      setCandidaturas(lerCandidaturas())
    }

    window.addEventListener('storage', atualizarVagasSalvas)
    window.addEventListener('storage', atualizarCandidaturas)
    window.addEventListener('bloom-candidaturas-atualizadas', atualizarCandidaturas)

    return () => {
      window.removeEventListener('storage', atualizarVagasSalvas)
      window.removeEventListener('storage', atualizarCandidaturas)
      window.removeEventListener('bloom-candidaturas-atualizadas', atualizarCandidaturas)
    }
  }, [])

  function abrirEdicao() {
    setFormulario({ ...perfil })
    setMensagem('')
    setEditando(true)
  }

  function atualizarCampo(event) {
    const { name, value } = event.target

    setFormulario((atual) => ({
      ...atual,
      [name]: value,
    }))
  }

  function salvarPerfil(event) {
    event.preventDefault()

    try {
      localStorage.setItem('bloom-perfil', JSON.stringify(formulario))
      setPerfil({ ...formulario })
      setEditando(false)
      setMensagem('Perfil atualizado com sucesso!')
    } catch {
      setMensagem('Não foi possível salvar o perfil no navegador.')
    }
  }

  function cancelarEdicao() {
    setFormulario({ ...perfil })
    setEditando(false)
    setMensagem('')
  }

  function selecionarCurriculo(event) {
    const arquivo = event.target.files?.[0]

    if (!arquivo) return

    const extensaoValida = /\.(pdf|doc|docx)$/i.test(arquivo.name)

    if (!extensaoValida) {
      setMensagem('Selecione um arquivo PDF, DOC ou DOCX.')
      event.target.value = ''
      return
    }

    setCurriculo(arquivo)
    setMensagem('Currículo selecionado nesta sessão.')
  }

  function removerVaga(id) {
    const novasVagas = vagasSalvas.filter(
      (vagaId) => vagaId !== id
    )

    try {
      localStorage.setItem(
        'bloom-vagas-salvas',
        JSON.stringify(novasVagas)
      )

      setVagasSalvas(novasVagas)
      setMensagem('Vaga removida das favoritas.')
    } catch {
      setMensagem('Não foi possível atualizar as vagas salvas.')
    }
  }

  const vagasSalvasDetalhes = vagasDisponiveis.filter(
    (vaga) => vagasSalvas.includes(vaga.id)
  )

  return (
    <div className="perfil-page">
      <Cabecalho />

      <div className="perfil-layout">
        <aside className="perfil-sidebar">
          <a className="perfil-menu-item ativo" href="#meu-perfil">
            <span>♙</span> Meu perfil
          </a>

          <a className="perfil-menu-item" href="#candidaturas">
            <span>▣</span> Minhas candidaturas
          </a>

          <a className="perfil-menu-item" href="#competencias">
            <span>✧</span> Competências
          </a>

          <a className="perfil-menu-item" href="#curriculo">
            <span>♧</span> Currículo
          </a>

          <a className="perfil-menu-item" href="#vagas-salvas">
            <span>♡</span> Vagas salvas
          </a>
        </aside>

        <main className="perfil-conteudo">
          <div className="perfil-titulo-linha">
            <div>
              <span className="perfil-subtitulo">
                SUA JORNADA PROFISSIONAL
              </span>

              <h1>MEU PERFIL</h1>

              <p>
                Apresente sua trajetória e seus objetivos profissionais.
              </p>
            </div>

            {!editando && (
              <button
                className="perfil-botao-editar"
                type="button"
                onClick={abrirEdicao}
              >
                Editar perfil
              </button>
            )}
          </div>

          {mensagem && (
            <p className="perfil-mensagem" role="status">
              {mensagem}
            </p>
          )}

          {editando && (
            <section className="perfil-card perfil-formulario-card">
              <h2>Editar informações</h2>
              <p>Atualize seus dados profissionais abaixo.</p>

              <form
                onSubmit={salvarPerfil}
                className="perfil-formulario"
              >
                <label>
                  Nome completo
                  <input
                    name="nome"
                    value={formulario.nome}
                    onChange={atualizarCampo}
                    required
                    maxLength={100}
                  />
                </label>

                <label>
                  Cargo ou área profissional
                  <input
                    name="cargo"
                    value={formulario.cargo}
                    onChange={atualizarCampo}
                    required
                    maxLength={100}
                  />
                </label>

                <label>
                  Localização
                  <input
                    name="local"
                    value={formulario.local}
                    onChange={atualizarCampo}
                    maxLength={100}
                  />
                </label>

                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    value={formulario.email}
                    onChange={atualizarCampo}
                    required
                  />
                </label>

                <label>
                  Telefone
                  <input
                    name="telefone"
                    type="tel"
                    value={formulario.telefone}
                    onChange={atualizarCampo}
                  />
                </label>

                <label className="perfil-campo-completo">
                  Sobre mim
                  <textarea
                    name="sobre"
                    value={formulario.sobre}
                    onChange={atualizarCampo}
                    rows={4}
                    maxLength={1000}
                  />
                </label>

                <label className="perfil-campo-completo">
                  Objetivo profissional
                  <textarea
                    name="objetivo"
                    value={formulario.objetivo}
                    onChange={atualizarCampo}
                    rows={3}
                    maxLength={1000}
                  />
                </label>

                <div className="perfil-formulario-acoes perfil-campo-completo">
                  <button className="perfil-botao" type="submit">
                    Salvar alterações
                  </button>

                  <button
                    className="perfil-botao-cancelar"
                    type="button"
                    onClick={cancelarEdicao}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          )}

          <section
            className="perfil-card identificacao"
            id="meu-perfil"
          >
            <div className="perfil-avatar">
              {perfil.nome
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((parte) => parte.charAt(0).toUpperCase())
                .join('')}
            </div>

            <div className="perfil-dados">
              <h2>{perfil.nome}</h2>
              <p className="perfil-cargo">{perfil.cargo}</p>
              <p>{perfil.local} · {perfil.email}</p>
              <p>
                Telefone: {perfil.telefone || 'Não informado'}
              </p>
            </div>

            {!editando && (
              <button
                className="perfil-botao-editar"
                type="button"
                onClick={abrirEdicao}
              >
                Editar
              </button>
            )}
          </section>

          <section className="perfil-card" id="sobre-mim">
            <h3>Sobre mim</h3>
            <p>
              {perfil.sobre || 'Adicione uma apresentação profissional.'}
            </p>

            <h3>Objetivo de carreira</h3>
            <p>
              {perfil.objetivo || 'Adicione seu objetivo profissional.'}
            </p>
          </section>

          <div className="perfil-duas-colunas">
            <section className="perfil-card">
              <h3>Formação acadêmica</h3>
              <h4>Análise e Desenvolvimento de Sistemas</h4>
              <p>Instituição de ensino</p>
              <span className="perfil-etiqueta">Cursando</span>
            </section>

            <section className="perfil-card">
              <h3>Experiência profissional</h3>
              <h4>Estagiária Front-end</h4>
              <p>Empresa de tecnologia</p>
              <p>
                Desenvolvimento de interfaces e manutenção de aplicações.
              </p>
            </section>
          </div>

          <section className="perfil-card" id="competencias">
            <h3>Competências</h3>

            <div className="perfil-habilidades">
              <span>HTML</span>
              <span>CSS</span>
              <span>JavaScript</span>
              <span>React</span>
              <span>Git</span>
              <span>Figma</span>
              <span>Trabalho em equipe</span>
              <span>Comunicação</span>
            </div>
          </section>

          <section className="perfil-card" id="curriculo">
            <h3>Currículo</h3>

            <p>
              {curriculo
                ? `Arquivo selecionado: ${curriculo.name}`
                : 'Você ainda não selecionou um currículo.'}
            </p>

            <input
              ref={arquivoRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={selecionarCurriculo}
              hidden
            />

            <button
              type="button"
              className="perfil-botao"
              onClick={() => arquivoRef.current?.click()}
            >
              {curriculo ? 'Trocar currículo' : 'Adicionar currículo'}
            </button>

            {curriculo && (
              <button
                type="button"
                className="perfil-botao-cancelar"
                onClick={() => {
                  setCurriculo(null)

                  if (arquivoRef.current) {
                    arquivoRef.current.value = ''
                  }

                  setMensagem('Currículo removido desta sessão.')
                }}
              >
                Remover arquivo
              </button>
            )}
          </section>

          <section className="perfil-card" id="candidaturas">
            <div className="vagas-salvas-cabecalho">
              <div>
                <h3>Minhas candidaturas</h3>
                <p>Acompanhe o status dos seus processos seletivos.</p>
              </div>
              <span className="perfil-contador-vagas">
                {candidaturas.length}
              </span>
            </div>

            {candidaturas.length > 0 ? (
              <div className="perfil-vagas-salvas-lista">
                {candidaturas.map((c) => (
                  <article className="perfil-vaga-salva" key={c.id}>
                    <div className="perfil-vaga-salva-info">
                      <span>{c.empresa} · {c.data || 'Recente'}</span>
                      <h4>{c.cargo}</h4>
                      <p>
                        {c.local} · {c.modalidade}
                      </p>
                    </div>

                    <div className="perfil-vaga-salva-acoes">
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#f3e8ee',
                          color: '#85243d',
                        }}
                      >
                        {c.status || 'Em análise'}
                      </span>
                      {c.vagaId && (
                        <Link
                          to={`/vagas/${c.vagaId}`}
                          className="perfil-link-vagas"
                        >
                          Ver detalhes
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="perfil-vagas-vazio">
                <span className="perfil-vagas-coracao">♧</span>
                <h4>Você ainda não se candidatou a nenhuma vaga</h4>
                <p>
                  Explore as vagas disponíveis e encontre a oportunidade ideal para o seu momento.
                </p>
                <Link to="/vagas" className="perfil-link-vagas">
                  Buscar vagas
                </Link>
              </div>
            )}
          </section>

          <section className="perfil-card" id="vagas-salvas">
            <div className="vagas-salvas-cabecalho">
              <div>
                <h3>Vagas salvas</h3>
                <p>
                  Suas oportunidades favoritas ficam reunidas aqui.
                </p>
              </div>

              <span className="vagas-salvas-contador">
                {vagasSalvasDetalhes.length}
              </span>
            </div>

            {vagasSalvasDetalhes.length > 0 ? (
              <div className="perfil-vagas-salvas-lista">
                {vagasSalvasDetalhes.map((vaga) => (
                  <article
                    className="perfil-vaga-salva"
                    key={vaga.id}
                  >
                    <div className="perfil-vaga-salva-info">
                      <span>{vaga.empresa}</span>
                      <h4>{vaga.cargo}</h4>
                      <p>
                        {vaga.local} · {vaga.modalidade}
                      </p>
                    </div>

                    <div className="perfil-vaga-salva-acoes">
                      <Link
                        to={`/vagas/${vaga.id}`}
                        className="perfil-link-vagas"
                      >
                        Ver detalhes
                      </Link>

                      <button
                        type="button"
                        className="perfil-remover-vaga"
                        onClick={() => removerVaga(vaga.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="perfil-vagas-vazio">
                <span className="perfil-vagas-coracao">♡</span>
                <h4>Você ainda não salvou nenhuma vaga</h4>
                <p>
                  Explore as oportunidades e guarde as que combinam
                  com seus objetivos profissionais.
                </p>

                <Link to="/vagas" className="perfil-link-vagas">
                  Explorar vagas
                </Link>
              </div>
            )}
          </section>
        </main>
      </div>

      <Rodape />
    </div>
  )
}

export default Perfil
