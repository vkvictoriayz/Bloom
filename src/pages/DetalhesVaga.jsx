import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Cabecalho from '../components/Cabecalho'
import Rodape from '../components/Rodape'
import './Vagas.css'
import './DetalhesVaga.css'

const vagasExemplo = [
  {
    id: 1,
    titulo: 'Engenheira de Software Pleno - JAVA',
    empresa: 'Itaú',
    local: 'São Paulo, SP',
    modalidade: 'Híbrido',
    tipo: 'CLT',
    area: 'Desenvolvimento',
    salario: 'A combinar',
    descricao:
      'Oportunidade para atuar no desenvolvimento de soluções de software inovadoras e escaláveis para o setor financeiro.',
    responsabilidades: [
      'Desenvolver e manter microsserviços em Java e Spring Boot.',
      'Trabalhar em conjunto com a equipe multidisciplinar de tecnologia e produto.',
      'Contribuir para a qualidade do código por meio de testes automatizados e code review.',
    ],
    requisitos: [
      'Experiência consolidada em desenvolvimento backend com Java.',
      'Conhecimento em bancos de dados relacionais e SQL.',
      'Boa comunicação, colaboração e vontade de crescer.',
    ],
    competencias: ['Java', 'Spring Boot', 'SQL', 'Microsserviços'],
  },
  {
    id: 2,
    titulo: 'Engenheira de Software Sênior - Data Owner',
    empresa: 'BTG Pactual',
    local: 'Botucatu, SP',
    modalidade: 'Presencial',
    tipo: 'CLT',
    area: 'Dados',
    salario: 'A combinar',
    descricao:
      'Liderança técnica em governança e arquitetura de dados para produtos de alta criticidade.',
    responsabilidades: [
      'Garantir a integridade, governança e disponibilidade dos pipelines de dados.',
      'Colaborar com times de engenharia e ciência de dados para estruturar bases analíticas.',
      'Propor melhorias contínuas na arquitetura de dados da instituição.',
    ],
    requisitos: [
      'Forte experiência na área de engenharia de dados e governança.',
      'Domínio de SQL, Python e ecossistemas de Big Data.',
      'Capacidade de liderar iniciativas técnicas e orientar desenvolvedoras mais jovens.',
    ],
    competencias: ['Dados', 'SQL', 'Python', 'Governança'],
  },
  {
    id: 3,
    titulo: 'Analista de Inteligência de Dados Sênior',
    empresa: 'Porto Seguro',
    local: 'Bragança Paulista, SP',
    modalidade: 'Híbrido',
    tipo: 'CLT',
    area: 'Dados',
    salario: 'A combinar',
    descricao:
      'Atuação analítica transformando grandes volumes de dados em insights estratégicos para seguros e serviços.',
    responsabilidades: [
      'Construir dashboards gerenciais, relatórios e modelos de BI.',
      'Apoiar áreas de negócio na tomada de decisões com embasamento estatístico.',
      'Monitorar indicadores de desempenho e KPIs estratégicos.',
    ],
    requisitos: [
      'Experiência em ferramentas de visualização (Power BI, Tableau ou similar).',
      'Conhecimento avançado em SQL e manipulação de bases.',
      'Raciocínio lógico, analítico e visão de negócios.',
    ],
    competencias: ['Power BI', 'SQL', 'BI', 'Análise de Dados'],
  },
  {
    id: 4,
    titulo: 'Analista DevOps Júnior',
    empresa: 'Banco do Brasil',
    local: 'Mogi das Cruzes, SP',
    modalidade: 'Remoto',
    tipo: 'CLT',
    area: 'Infraestrutura',
    salario: 'A combinar',
    descricao:
      'Oportunidade para iniciar carreira em DevOps, apoiando automação de esteiras e sustentação em nuvem.',
    responsabilidades: [
      'Apoiar a criação e manutenção de pipelines de CI/CD.',
      'Auxiliar na monitoração de aplicações e servidores em nuvem.',
      'Contribuir na automação de processos operacionais e deploys.',
    ],
    requisitos: [
      'Conhecimentos básicos em Linux, Git e conceitos de nuvem.',
      'Interesse genuíno em cultura DevOps e automação.',
      'Disposição para aprender e trabalhar em equipe.',
    ],
    competencias: ['DevOps', 'Git', 'Linux', 'Cloud'],
  },
  {
    id: 5,
    titulo: 'Desenvolvedora Mobile',
    empresa: 'Ipiranga',
    local: 'Mauá, SP',
    modalidade: 'Remoto',
    tipo: 'CLT',
    area: 'Desenvolvimento',
    salario: 'A combinar',
    descricao:
      'Criação de soluções digitais móveis que facilitam o dia a dia de milhões de clientes em todo o Brasil.',
    responsabilidades: [
      'Desenvolver novos recursos em aplicativos React Native / Flutter.',
      'Garantir a melhor experiência de uso, performance e fluidez nas interfaces.',
      'Trabalhar alinhada com times de design e produto.',
    ],
    requisitos: [
      'Experiência com desenvolvimento mobile (iOS / Android).',
      'Bons fundamentos de JavaScript, TypeScript e arquitetura mobile.',
      'Atenção aos detalhes de usabilidade e interface.',
    ],
    competencias: ['React Native', 'Mobile', 'JavaScript', 'TypeScript'],
  },
  {
    id: 6,
    titulo: 'Assistente de Tecnologia da Informação',
    empresa: 'Unimed',
    local: 'Campinas, SP',
    modalidade: 'Presencial',
    tipo: 'CLT',
    area: 'Suporte',
    salario: 'A combinar',
    descricao:
      'Suporte técnico a colaboradores, equipamentos, rede e sistemas corporativos de saúde.',
    responsabilidades: [
      'Prestar suporte presencial e remoto às usuárias e usuários internos.',
      'Configurar estações de trabalho, softwares e periféricos.',
      'Acompanhar chamados e manter o parque tecnológico funcionando com qualidade.',
    ],
    requisitos: [
      'Conhecimentos gerais em hardware, sistemas operacionais e redes.',
      'Boa comunicação, empatia e proatividade no atendimento.',
      'Organização e foco na resolução ágil de chamados.',
    ],
    competencias: ['Suporte', 'Hardware', 'Redes', 'Atendimento'],
  },
]

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

function DetalhesVaga() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vaga = vagasExemplo.find((item) => item.id === Number(id))

  const [candidaturas, setCandidaturas] = useState(lerCandidaturas)
  const [mensagem, setMensagem] = useState('')

  const jaCandidatou = candidaturas.some(
    (item) => Number(item.vagaId) === Number(id)
  )

  const candidatar = useCallback(() => {
    if (!vaga) {
      setMensagem('Não foi possível encontrar esta vaga.')
      return
    }

    const candidaturasAtuais = lerCandidaturas()

    if (
      candidaturasAtuais.some(
        (item) => Number(item.vagaId) === vaga.id
      )
    ) {
      setCandidaturas(candidaturasAtuais)
      setMensagem('Você já se candidatou a esta vaga. Consulte seu perfil.')
      return
    }

    const agora = Date.now()
    const dataFormatada = new Date(agora).toLocaleDateString('pt-BR')

    const novaCandidatura = {
      id: `${vaga.id}-${agora}`,
      vagaId: vaga.id,
      cargo: vaga.titulo,
      empresa: vaga.empresa,
      local: vaga.local,
      modalidade: vaga.modalidade,
      data: dataFormatada,
      status: 'Em análise',
    }

    const atualizadas = [...candidaturasAtuais, novaCandidatura]

    try {
      localStorage.setItem('bloom-candidaturas', JSON.stringify(atualizadas))
      setCandidaturas(atualizadas)
      setMensagem(
        'Candidatura registrada com sucesso! Você já pode acompanhá-la no seu perfil.'
      )
      window.dispatchEvent(new Event('bloom-candidaturas-atualizadas'))
    } catch {
      setMensagem(
        'Não foi possível salvar sua candidatura. Verifique o armazenamento do navegador.'
      )
    }
  }, [vaga])

  return (
    <div className="vagas-page">
      <Cabecalho />

      <main className="detalhes-container">
        <button
          type="button"
          className="detalhes-voltar"
          onClick={() => navigate('/vagas')}
        >
          ← Voltar para vagas
        </button>

        {!vaga ? (
          <section className="detalhes-cabecalho">
            <div className="detalhes-titulo">
              <h1>Vaga não encontrada</h1>
              <p>Não encontramos uma oportunidade com este identificador.</p>
              <Link to="/vagas" className="detalhes-candidatar" style={{ display: 'inline-block', marginTop: '16px' }}>
                Ver todas as vagas
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="detalhes-cabecalho">
              <div className="detalhes-logo-empresa">
                {vaga.empresa.slice(0, 2).toUpperCase()}
              </div>

              <div className="detalhes-titulo">
                <span className="detalhes-area">{vaga.area}</span>
                <h1>{vaga.titulo}</h1>
                <p className="detalhes-empresa">{vaga.empresa}</p>
                <p className="detalhes-local">
                  {vaga.local} · {vaga.modalidade} · {vaga.tipo}
                </p>
              </div>

              <button
                type="button"
                className="detalhes-candidatar"
                onClick={candidatar}
                disabled={jaCandidatou}
              >
                {jaCandidatou ? 'Candidatura enviada' : 'Candidatar-se'}
              </button>
            </section>

            <div className="detalhes-informacoes">
              <div className="detalhes-info-item">
                <span>Modalidade</span>
                <strong>{vaga.modalidade}</strong>
              </div>
              <div className="detalhes-info-item">
                <span>Contrato</span>
                <strong>{vaga.tipo}</strong>
              </div>
              <div className="detalhes-info-item">
                <span>Remuneração</span>
                <strong>{vaga.salario}</strong>
              </div>
            </div>

            <section className="detalhes-conteudo">
              {mensagem && (
                <div
                  className="detalhes-secao"
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#faf2f5',
                    border: '1px solid #eadde2',
                    color: '#873c57',
                    fontWeight: 600,
                  }}
                  role="status"
                >
                  <p style={{ margin: 0 }}>{mensagem}</p>
                  {jaCandidatou && (
                    <Link
                      to="/perfil"
                      style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        color: '#94104d',
                        textDecoration: 'underline',
                      }}
                    >
                      Ver no meu perfil →
                    </Link>
                  )}
                </div>
              )}

              <div className="detalhes-secao">
                <h2>Sobre a vaga</h2>
                <p>{vaga.descricao}</p>
              </div>

              <div className="detalhes-secao">
                <h2>Responsabilidades e atribuições</h2>
                <ul>
                  {vaga.responsabilidades.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="detalhes-secao">
                <h2>Requisitos e qualificações</h2>
                <ul>
                  {vaga.requisitos.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="detalhes-secao">
                <h2>Competências valorizadas</h2>
                <ul>
                  {vaga.competencias.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="detalhes-final">
                <div>
                  <h2>Pronta para dar esse passo?</h2>
                  <p>Envie sua candidatura e acompanhe o processo no seu perfil.</p>
                </div>
                <button
                  type="button"
                  className="detalhes-candidatar"
                  onClick={candidatar}
                  disabled={jaCandidatou}
                >
                  {jaCandidatou ? 'Candidatura enviada' : 'Candidatar-se agora'}
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <Rodape />
    </div>
  )
}

export default DetalhesVaga
