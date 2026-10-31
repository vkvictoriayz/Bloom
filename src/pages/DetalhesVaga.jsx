
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './Auth.css'
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
    descricao: 'Oportunidade para atuar no desenvolvimento de soluções de software.',
    responsabilidades: [
      'Desenvolver e manter aplicações.',
      'Trabalhar em conjunto com a equipe de tecnologia.',
      'Contribuir para a qualidade do código.',
    ],
    requisitos: [
      'Conhecimentos em programação.',
      'Interesse em desenvolvimento de software.',
      'Boa comunicação e trabalho em equipe.',
    ],
    competencias: ['Java', 'Programação', 'Desenvolvimento'],
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
    descricao: 'Oportunidade para trabalhar com dados e soluções tecnológicas.',
    responsabilidades: ['Atuar com dados e informações.', 'Colaborar com equipes técnicas.'],
    requisitos: ['Experiência na área de dados.', 'Conhecimentos em tecnologia.'],
    competencias: ['Dados', 'Análise', 'Tecnologia'],
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
    descricao: 'Atuação com análise de dados e geração de informações para o negócio.',
    responsabilidades: ['Analisar dados.', 'Apoiar decisões com informações.'],
    requisitos: ['Conhecimentos em análise de dados.', 'Raciocínio analítico.'],
    competencias: ['SQL', 'Dados', 'Análise'],
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
    descricao: 'Oportunidade para iniciar ou desenvolver a carreira em DevOps.',
    responsabilidades: ['Apoiar processos de implantação.', 'Colaborar com a equipe de infraestrutura.'],
    requisitos: ['Conhecimentos básicos em tecnologia.', 'Interesse em DevOps.'],
    competencias: ['DevOps', 'Git', 'Infraestrutura'],
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
    descricao: 'Desenvolvimento e manutenção de aplicações para dispositivos móveis.',
    responsabilidades: ['Desenvolver funcionalidades mobile.', 'Corrigir e testar aplicações.'],
    requisitos: ['Conhecimentos em programação.', 'Interesse em desenvolvimento mobile.'],
    competencias: ['Mobile', 'Programação', 'Aplicativos'],
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
    descricao: 'Apoio às atividades de tecnologia da informação e suporte técnico.',
    responsabilidades: ['Apoiar usuários.', 'Auxiliar na resolução de problemas técnicos.'],
    requisitos: ['Conhecimentos básicos em informática.', 'Organização e comunicação.'],
    competencias: ['Suporte', 'Informática', 'Tecnologia'],
  },
]

function lerCandidaturas() {
  try {
    const dados = JSON.parse(
      localStorage.getItem('bloom-candidaturas') || '[]',
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
    (item) => Number(item.vagaId) === Number(id),
  )

  function candidatar() {
    if (!vaga) {
      setMensagem('Não foi possível encontrar esta vaga.')
      return
    }

    const candidaturasAtuais = lerCandidaturas()

    if (
      candidaturasAtuais.some(
        (item) => Number(item.vagaId) === vaga.id,
      )
    ) {
      setCandidaturas(candidaturasAtuais)
      setMensagem('Você já se candidatou a esta vaga. Consulte seu perfil.')
      return
    }

    const novaCandidatura = {
      id: `${vaga.id}-${Date.now()}`,
      vagaId: vaga.id,
      cargo: vaga.titulo,
      empresa: vaga.empresa,
      local: vaga.local,
      modalidade: vaga.modalidade,
      data: new Date().toLocaleDateString('pt-BR'),
      status: 'Em análise',
    }

    const atualizadas = [...candidaturasAtuais, novaCandidatura]

    try {
      localStorage.setItem(
        'bloom-candidaturas',
        JSON.stringify(atualizadas),
      )

      setCandidaturas(atualizadas)
      setMensagem(
        'Candidatura registrada com sucesso! Você já pode acompanhá-la no seu perfil.',
      )

      window.dispatchEvent(new Event('bloom-candidaturas-atualizadas'))
    } catch {
      setMensagem(
        'Não foi possível salvar sua candidatura. Verifique o armazenamento do navegador.',
      )
    }
  }

  if (!vaga) {
    return (
      <main className="detalhes-vaga-page">
        <h1>Vaga não encontrada</h1>
        <p>Não encontramos uma vaga com esse endereço.</p>
        <Link to="/vagas">Voltar para vagas</Link>
      </main>
    )
  }

  return (
    <main className="detalhes-vaga-page">
      <Link to="/vagas">← Voltar para vagas</Link>

      <section className="detalhes-vaga-card">
        <p>{vaga.empresa}</p>
        <h1>{vaga.titulo}</h1>

        <p>
          {vaga.local} · {vaga.modalidade} · {vaga.tipo}
        </p>

        <p>Área: {vaga.area}</p>
        <p>Salário: {vaga.salario}</p>

        <h2>Sobre a vaga</h2>
        <p>{vaga.descricao}</p>

        <h2>Responsabilidades</h2>
        <ul>
          {vaga.responsabilidades.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Requisitos</h2>
        <ul>
          {vaga.requisitos.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Competências</h2>
        <ul>
          {vaga.competencias.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        {mensagem && (
          <p role="status" className="mensagem-candidatura">
            {mensagem}
          </p>
        )}

        <button
          type="button"
          onClick={candidatar}
          disabled={jaCandidatou}
        >
          {jaCandidatou ? 'Você já se candidatou' : 'Candidatar-se'}
        </button>

        {jaCandidatou && (
          <p>
            <Link to="/perfil">Acompanhar candidatura no meu perfil</Link>
          </p>
        )}

        <button type="button" onClick={() => navigate('/perfil')}>
          Ir para meu perfil
        </button>
      </section>
    </main>
  )
}

export default DetalhesVaga
