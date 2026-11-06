// Empresas exibidas na Bloom.
//
// Enquanto o backend não expõe PERFIL_EMPRESA (logo, descrição, localização,
// site), estes registros trazem apenas informações públicas e institucionais.
// "perfilGerenciado: false" indica que a própria empresa ainda não assumiu o
// perfil na plataforma — a interface deixa isso claro e não sugere parceria.
//
// Campos que só a empresa pode informar (cultura, benefícios, canais de
// contato) ficam vazios até chegarem pelo backend; a interface mostra
// estados vazios para eles.

export const empresas = [
  {
    slug: 'itau',
    nome: 'Itaú Unibanco',
    nomeCurto: 'Itaú',
    sigla: 'itaú',
    segmento: 'Serviços financeiros',
    sede: 'São Paulo, SP',
    site: 'https://www.itau.com.br',
    descricao:
      'Banco brasileiro com atuação em varejo, atacado e investimentos, com grandes equipes de tecnologia dedicadas a canais digitais e plataformas financeiras.',
    cor: '#ec7000',
    corTexto: '#ffffff',
    logo: null,
    cultura: null,
    perfilGerenciado: false,
  },
  {
    slug: 'btg-pactual',
    nome: 'BTG Pactual',
    nomeCurto: 'BTG Pactual',
    sigla: 'btg',
    segmento: 'Banco de investimentos',
    sede: 'São Paulo, SP',
    site: 'https://www.btgpactual.com',
    descricao:
      'Banco de investimentos com atuação em mercado de capitais, gestão de recursos e banco digital, apoiado por times de engenharia e dados.',
    cor: '#0b2551',
    corTexto: '#ffffff',
    logo: null,
    cultura: null,
    perfilGerenciado: false,
  },
  {
    slug: 'porto',
    nome: 'Porto Seguro',
    nomeCurto: 'Porto Seguro',
    sigla: 'porto',
    segmento: 'Seguros e serviços',
    sede: 'São Paulo, SP',
    site: 'https://www.portoseguro.com.br',
    descricao:
      'Empresa reconhecida por suas soluções em seguros, serviços e atendimento, com áreas de tecnologia e inteligência de dados.',
    cor: '#0046c0',
    corTexto: '#ffffff',
    logo: null,
    cultura: null,
    perfilGerenciado: false,
  },
  {
    slug: 'banco-do-brasil',
    nome: 'Banco do Brasil',
    nomeCurto: 'Banco do Brasil',
    sigla: 'bb',
    segmento: 'Serviços financeiros',
    sede: 'Brasília, DF',
    site: 'https://www.bb.com.br',
    descricao:
      'Uma das principais instituições financeiras do país, com uma trajetória de inovação e tecnologia.',
    cor: '#fcfc30',
    corTexto: '#1f3c94',
    logo: null,
    cultura: null,
    perfilGerenciado: false,
  },
  {
    slug: 'ipiranga',
    nome: 'Ipiranga',
    nomeCurto: 'Ipiranga',
    sigla: 'ipiranga',
    segmento: 'Combustíveis e conveniência',
    sede: 'Rio de Janeiro, RJ',
    site: 'https://www.ipiranga.com.br',
    descricao:
      'Rede de distribuição de combustíveis e lojas de conveniência, com produtos digitais e aplicativos voltados ao consumidor.',
    cor: '#f6c400',
    corTexto: '#00305c',
    logo: null,
    cultura: null,
    perfilGerenciado: false,
  },
  {
    slug: 'unimed',
    nome: 'Unimed',
    nomeCurto: 'Unimed',
    sigla: 'unimed',
    segmento: 'Saúde suplementar',
    sede: 'Atuação nacional',
    site: 'https://www.unimed.coop.br',
    descricao:
      'Sistema de cooperativas médicas com atuação em todo o país, com equipes de tecnologia em sistemas de saúde e atendimento.',
    cor: '#00995d',
    corTexto: '#ffffff',
    logo: null,
    cultura: null,
    perfilGerenciado: false,
  },
  {
    slug: 'sebrae',
    nome: 'Sebrae',
    nomeCurto: 'Sebrae',
    sigla: 'sebrae',
    segmento: 'Apoio ao empreendedorismo',
    sede: 'Brasília, DF',
    site: 'https://sebrae.com.br',
    descricao:
      'Instituição que apoia o empreendedorismo e o desenvolvimento de pequenos negócios.',
    cor: '#005eb8',
    corTexto: '#ffffff',
    logo: null,
    cultura: null,
    perfilGerenciado: false,
  },
]

export function buscarEmpresa(slug) {
  return empresas.find((empresa) => empresa.slug === slug) ?? null
}

// As vagas antigas guardam o nome curto ("Itaú"); aceitamos os dois.
export function empresaPorNome(nome = '') {
  const alvo = nome.trim().toLowerCase()
  return (
    empresas.find(
      (empresa) =>
        empresa.nome.toLowerCase() === alvo || empresa.nomeCurto.toLowerCase() === alvo
    ) ?? null
  )
}

export const segmentos = [...new Set(empresas.map((empresa) => empresa.segmento))].sort()
