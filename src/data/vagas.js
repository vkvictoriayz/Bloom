import { buscarEmpresa } from './empresas'

// Fonte única das vagas do front-end.
//
// A tabela VAGAS já existe no banco, mas o backend ainda não tem rotas para
// listá-la. Até lá, estas são as vagas de exemplo que já existiam no projeto
// (antes espalhadas em Home, Vagas, DetalhesVaga e Perfil). Quando a API
// existir, basta trocar listarVagas()/buscarVaga() por chamadas a ela.
//
// Só preenchemos os campos que existiam nos dados originais; os que faltam
// ficam null e a interface esconde a seção correspondente.

const vagas = [
  {
    id: 1,
    titulo: 'Engenheira de Software Pleno - JAVA',
    empresa: 'itau',
    area: 'Desenvolvimento',
    cidade: 'São Paulo',
    uf: 'SP',
    modalidade: 'Híbrido',
    contrato: 'CLT',
    nivel: 'Pleno',
    publicadaHaDias: 2,
    salario: 'A combinar',
    resumo: 'Desenvolva soluções e participe de projetos de tecnologia em equipe.',
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
    empresa: 'btg-pactual',
    area: 'Dados',
    cidade: 'Botucatu',
    uf: 'SP',
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sênior',
    publicadaHaDias: 3,
    salario: 'A combinar',
    resumo: 'Atue com dados, tecnologia e soluções para desafios de negócio.',
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
    competencias: ['SQL', 'Python', 'Dados', 'Governança'],
  },
  {
    id: 3,
    titulo: 'Analista de Inteligência de Dados Sênior',
    empresa: 'porto',
    area: 'Dados',
    cidade: 'Bragança Paulista',
    uf: 'SP',
    modalidade: 'Híbrido',
    contrato: 'CLT',
    nivel: 'Sênior',
    publicadaHaDias: 7,
    salario: 'A combinar',
    resumo: 'Transforme dados em informações úteis para decisões estratégicas.',
    descricao: 'Transforme dados em informações úteis para decisões estratégicas.',
    responsabilidades: null,
    requisitos: null,
    competencias: ['SQL', 'Power BI', 'Excel'],
  },
  {
    id: 4,
    titulo: 'Analista DevOps Júnior',
    empresa: 'banco-do-brasil',
    area: 'Infraestrutura',
    cidade: 'Mogi das Cruzes',
    uf: 'SP',
    modalidade: 'Remoto',
    contrato: 'CLT',
    nivel: 'Júnior',
    publicadaHaDias: 5,
    salario: null,
    resumo: 'Colabore na automação e manutenção de ambientes de tecnologia.',
    descricao: 'Colabore na automação e manutenção de ambientes de tecnologia.',
    responsabilidades: null,
    requisitos: null,
    competencias: ['Git', 'Linux', 'Cloud'],
  },
  {
    id: 5,
    titulo: 'Desenvolvedora Mobile',
    empresa: 'ipiranga',
    area: 'Desenvolvimento',
    cidade: 'Mauá',
    uf: 'SP',
    modalidade: 'Remoto',
    contrato: 'CLT',
    nivel: null,
    publicadaHaDias: 21,
    salario: null,
    resumo: 'Ajude a criar e aprimorar experiências em aplicativos móveis.',
    descricao: 'Ajude a criar e aprimorar experiências em aplicativos móveis.',
    responsabilidades: null,
    requisitos: null,
    competencias: ['React Native', 'JavaScript'],
  },
  {
    id: 6,
    titulo: 'Assistente de Tecnologia da Informação',
    empresa: 'unimed',
    area: 'Suporte',
    cidade: 'Campinas',
    uf: 'SP',
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Assistente',
    publicadaHaDias: 1,
    salario: null,
    resumo: 'Apoie a equipe na organização e resolução de demandas técnicas.',
    descricao: 'Apoie a equipe na organização e resolução de demandas técnicas.',
    responsabilidades: null,
    requisitos: null,
    competencias: ['Suporte', 'Redes', 'Sistemas'],
  },
]

// Níveis considerados porta de entrada na carreira.
const NIVEIS_INICIANTES = ['Estágio', 'Assistente', 'Júnior', 'Trainee']

export const ehIniciante = (vaga) => NIVEIS_INICIANTES.includes(vaga.nivel)

function completar(vaga) {
  return { ...vaga, dadosEmpresa: buscarEmpresa(vaga.empresa), local: `${vaga.cidade}, ${vaga.uf}` }
}

export function listarVagas() {
  return vagas.map(completar)
}

export function buscarVaga(id) {
  const vaga = vagas.find((item) => String(item.id) === String(id))
  return vaga ? completar(vaga) : null
}

export function vagasDaEmpresa(slug) {
  return listarVagas().filter((vaga) => vaga.empresa === slug)
}

export function formatarPublicacao(dias) {
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Há 1 dia'
  if (dias < 7) return `Há ${dias} dias`
  const semanas = Math.round(dias / 7)
  return semanas === 1 ? 'Há 1 semana' : `Há ${semanas} semanas`
}

// Opções dos filtros, sempre derivadas dos dados (nunca listas inventadas).
function unicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export const opcoesFiltro = {
  areas: unicos(vagas.map((v) => v.area)),
  modalidades: unicos(vagas.map((v) => v.modalidade)),
  niveis: unicos(vagas.map((v) => v.nivel)),
  locais: unicos(vagas.map((v) => `${v.cidade}, ${v.uf}`)),
  tecnologias: unicos(vagas.flatMap((v) => v.competencias)),
}

// Busca textual em cargo, empresa, área, local e tecnologias.
export function correspondeBusca(vaga, termo) {
  const alvo = termo.trim().toLowerCase()
  if (!alvo) return true
  return [
    vaga.titulo,
    vaga.dadosEmpresa?.nome,
    vaga.dadosEmpresa?.nomeCurto,
    vaga.area,
    vaga.local,
    vaga.nivel,
    ...vaga.competencias,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(alvo)
}
