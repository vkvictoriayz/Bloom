import { randomBytes, randomInt } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";

const DOMINIO = "demo.bloom.test";
const imagem = (nome) => `data:image/webp;base64,${readFileSync(new URL(`./demo-imagens/${nome}.webp`, import.meta.url)).toString("base64")}`;
const POST_LARGURA = 1200;
const POST_ALTURA = 675;
const ARQUIVO = new URL("../contas-demonstracao.md", import.meta.url);

Object.assign(process.env, { RESEND_API_KEY: "", EMAIL_REMETENTE: "", MP_ACCESS_TOKEN: "", SERPRO_CPF_CONSUMER_KEY: "", NODE_ENV: "development" });

const { sequelize } = await import("../src/config/database.js");
const comando = process.argv[2];

async function remover() {
  const { excluirEmpresa, excluirUsuaria } = await import("../src/services/exclusaoConta.js");
  const [usuarias] = await sequelize.query("SELECT id_usuario AS id, email FROM CADASTRO_USUARIA WHERE email LIKE ?", { replacements: [`%${DOMINIO}`] });
  const [empresas] = await sequelize.query("SELECT id_empresa AS id, email FROM CADASTRO_EMPRESA WHERE email LIKE ?", { replacements: [`%${DOMINIO}`] });
  for (const e of empresas) await excluirEmpresa(e.id);
  for (const u of usuarias) await excluirUsuaria(u.id);
  console.log(`Removidas ${usuarias.length} candidatas e ${empresas.length} empresas de demonstração.`);
}

if (comando === "remover") {
  await remover();
  await sequelize.close();
  process.exit(0);
}

if (comando === "senhas") {
  const senha = process.argv[3] ?? "";
  if (senha.length < 8) {
    console.log("Uso: npm run demo:senhas -- <senha com 8 ou mais caracteres>");
    process.exit(1);
  }
  const { createRequire } = await import("node:module");
  const bcrypt = createRequire(import.meta.url)("bcrypt");
  const hash = await bcrypt.hash(senha, 10);
  const [u] = await sequelize.query("UPDATE CADASTRO_USUARIA SET senha_hash = ? WHERE email LIKE ?", { replacements: [hash, `%${DOMINIO}`] });
  const [e] = await sequelize.query("UPDATE CADASTRO_EMPRESA SET senha_hash = ? WHERE email LIKE ?", { replacements: [hash, `%${DOMINIO}`] });
  const [usuarias] = await sequelize.query("SELECT nome, email FROM CADASTRO_USUARIA WHERE email LIKE ? ORDER BY id_usuario", { replacements: [`%${DOMINIO}`] });
  const [empresas] = await sequelize.query("SELECT nome, email FROM CADASTRO_EMPRESA WHERE email LIKE ? ORDER BY id_empresa", { replacements: [`%${DOMINIO}`] });
  writeFileSync(
    ARQUIVO,
    [
      "# Contas de demonstração da Bloom",
      "",
      `Todas as contas abaixo usam a mesma senha: \`${senha}\``,
      "",
      "| Tipo | Nome | E-mail (login) | Onde entrar |",
      "| --- | --- | --- | --- |",
      ...usuarias.map((c) => `| Candidata | ${c.nome} | ${c.email} | http://localhost:3006/login |`),
      ...empresas.map((c) => `| Empresa | ${c.nome} | ${c.email} | http://localhost:3006/empresa/login |`),
      "",
    ].join("\n")
  );
  console.log(`Senha trocada em ${u.affectedRows} candidatas e ${e.affectedRows} empresas. Logins em contas-demonstracao.md`);
  await sequelize.close();
  process.exit(0);
}
if (comando !== "criar") {
  console.log("Uso: npm run demo:criar | npm run demo:remover");
  process.exit(1);
}

const [[{ total }]] = await sequelize.query(
  "SELECT (SELECT COUNT(*) FROM CADASTRO_USUARIA WHERE email LIKE ?) + (SELECT COUNT(*) FROM CADASTRO_EMPRESA WHERE email LIKE ?) AS total",
  { replacements: [`%${DOMINIO}`, `%${DOMINIO}`] }
);
if (Number(total) > 0) {
  console.log("Já existem contas de demonstração. Rode `npm run demo:remover` antes de criar de novo.");
  await sequelize.close();
  process.exit(1);
}

function digitosCpf(base) {
  const dv = (nums) => {
    const soma = nums.reduce((s, n, i) => s + n * (nums.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base);
  return [...base, d1, dv([...base, d1])];
}
const novoCpf = () => digitosCpf(Array.from({ length: 9 }, () => randomInt(10))).join("");
function novoCnpj() {
  const base = [...Array.from({ length: 8 }, () => randomInt(10)), 0, 0, 0, 1];
  const dv = (nums, pesos) => {
    const r = nums.reduce((s, n, i) => s + n * pesos[i], 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dv([...base, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...base, d1, d2].join("");
}
const novaSenha = () => `Bloom-${randomBytes(6).toString("base64url")}-${randomInt(10, 99)}`;

const CANDIDATAS = [
  {
    chave: "ana", nome: "Ana Luíza Moreira", nascimento: "1999-04-12", icone: "icone:codigo:vinho",
    area: "Desenvolvedora front-end", cargo: "Desenvolvedora Front-end Júnior", local: "São Paulo, SP",
    bio: "Front-end com React e TypeScript. Apaixonada por acessibilidade e interfaces que funcionam para todo mundo.",
    interesses: ["React", "Acessibilidade", "TypeScript"],
    sobre: "Desenvolvedora front-end júnior com experiência em React, TypeScript e testes de interface. Gosto de transformar protótipos em produtos acessíveis e bem documentados.",
    objetivo: "Crescer como desenvolvedora front-end em um time que valorize acessibilidade e boas práticas.",
    tecnicas: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Testing Library", "Git"],
    comportamentais: ["Comunicação", "Trabalho em equipe", "Curiosidade"],
    experiencias: [{ cargo: "Desenvolvedora Front-end Júnior", empresa: "Agência Pixel Norte", descricao: "Interfaces em React para sites institucionais e painéis internos.", inicio: "2024-03", fim: "" }],
    formacoes: [{ curso: "Análise e Desenvolvimento de Sistemas", instituicao: "Fatec", nivel: "Tecnólogo", inicio: "2021-02", conclusao: "2023-12" }],
    preferencias: { modalidades: ["Remoto", "Híbrido"], areas: ["Desenvolvimento"], disponibilidade: "Imediata" },
  },
  {
    chave: "bia", nome: "Beatriz Santos Oliveira", nascimento: "1994-09-03", icone: "icone:dados:ameixa",
    area: "Analista de dados", cargo: "Analista de Dados Pleno", local: "Belo Horizonte, MG",
    bio: "Dados, SQL e Python. Gosto de contar histórias com gráficos e ajudar times a decidir melhor.",
    interesses: ["SQL", "Python", "Power BI"],
    sobre: "Analista de dados com 4 anos de experiência em SQL, Python e Power BI. Já construí painéis de vendas e modelos de previsão de demanda.",
    objetivo: "Atuar com engenharia de analytics e ajudar outras mulheres a entrarem na área de dados.",
    tecnicas: ["SQL", "Python", "Pandas", "Power BI", "dbt", "Estatística"],
    comportamentais: ["Pensamento analítico", "Didática", "Organização"],
    experiencias: [{ cargo: "Analista de Dados", empresa: "Varejo Minas Atacado", descricao: "Painéis de vendas e estoque, automação de relatórios com Python.", inicio: "2021-06", fim: "" }],
    formacoes: [{ curso: "Estatística", instituicao: "UFMG", nivel: "Bacharelado", inicio: "2013-03", conclusao: "2017-12" }],
    preferencias: { modalidades: ["Remoto"], areas: ["Dados"], disponibilidade: "30 dias" },
  },
  {
    chave: "camila", nome: "Camila Ferreira Rocha", nascimento: "2003-01-22", icone: "icone:terminal:musgo",
    area: "Estudante de Ciência da Computação", cargo: "Estudante de Ciência da Computação", local: "Recife, PE",
    bio: "Estudante de computação procurando o primeiro estágio em back-end. Node.js e muito café.",
    interesses: ["Node.js", "Back-end", "Primeiro emprego"],
    sobre: "Estudante do 6º período de Ciência da Computação. Faço projetos pessoais com Node.js, Express e MySQL e participo de maratonas de programação.",
    objetivo: "Conseguir meu primeiro estágio em desenvolvimento back-end.",
    tecnicas: ["Node.js", "Express", "MySQL", "Java", "Git"],
    comportamentais: ["Proatividade", "Vontade de aprender"],
    experiencias: [],
    formacoes: [{ curso: "Ciência da Computação", instituicao: "UFPE", nivel: "Bacharelado", inicio: "2022-03", conclusao: "2026-12" }],
    preferencias: { modalidades: ["Presencial", "Híbrido", "Remoto"], areas: ["Desenvolvimento"], disponibilidade: "Estágio de 6 horas" },
  },
  {
    chave: "dani", nome: "Daniela Costa Lima", nascimento: "1991-11-08", icone: "icone:escudo:rosa",
    area: "QA e automação de testes", cargo: "Analista de QA Pleno", local: "Porto Alegre, RS",
    bio: "QA que ama automação: Cypress, Playwright e testes de API. Qualidade é responsabilidade do time todo.",
    interesses: ["Cypress", "Playwright", "Testes de API"],
    sobre: "Analista de qualidade com 6 anos de experiência em testes manuais e automatizados para web e APIs.",
    objetivo: "Liderar a estratégia de qualidade de um produto digital.",
    tecnicas: ["Cypress", "Playwright", "Postman", "JavaScript", "Testes de API", "CI/CD"],
    comportamentais: ["Atenção aos detalhes", "Comunicação", "Senso crítico"],
    experiencias: [{ cargo: "Analista de QA", empresa: "SulSoft Sistemas", descricao: "Automação de testes de regressão e testes de contrato de APIs.", inicio: "2019-02", fim: "" }],
    formacoes: [{ curso: "Sistemas de Informação", instituicao: "PUCRS", nivel: "Bacharelado", inicio: "2010-03", conclusao: "2014-12" }],
    preferencias: { modalidades: ["Remoto", "Híbrido"], areas: ["QA / Testes"], disponibilidade: "30 dias" },
  },
  {
    chave: "duda", nome: "Eduarda Nunes Prado", nascimento: "1996-06-17", icone: "icone:paleta:mel",
    area: "UX/UI em transição de carreira", cargo: "Designer UX/UI (transição de carreira)", local: "Curitiba, PR",
    bio: "Vim do marketing para o UX. Pesquisa com usuárias, Figma e muita escuta.",
    interesses: ["UX", "Figma", "Transição de carreira"],
    sobre: "Profissional em transição do marketing para UX/UI. Concluí um bootcamp de design e montei um portfólio com três estudos de caso.",
    objetivo: "Primeira vaga como designer UX/UI júnior.",
    tecnicas: ["Figma", "Pesquisa com usuários", "Prototipação", "Design System"],
    comportamentais: ["Empatia", "Comunicação", "Criatividade"],
    experiencias: [{ cargo: "Analista de Marketing", empresa: "Loja Curitibana de Móveis", descricao: "Campanhas digitais e pesquisas de satisfação.", inicio: "2018-01", fim: "2024-06" }],
    formacoes: [{ curso: "Publicidade e Propaganda", instituicao: "UFPR", nivel: "Bacharelado", inicio: "2014-03", conclusao: "2017-12" }],
    preferencias: { modalidades: ["Remoto", "Híbrido"], areas: ["UX / UI Design"], disponibilidade: "Imediata" },
  },
  {
    chave: "fe", nome: "Fernanda Alves Teixeira", nascimento: "1988-02-28", icone: "icone:nuvem:vinho",
    area: "Engenheira de dados e cloud", cargo: "Engenheira de Dados Sênior", local: "Rio de Janeiro, RJ",
    bio: "Engenheira de dados há 10 anos. Mentora de mulheres que estão começando em tecnologia.",
    interesses: ["Engenharia de dados", "Cloud", "Mentoria"],
    sobre: "Engenheira de dados sênior com experiência em pipelines na nuvem, Spark e Airflow. Faço mentoria voluntária para mulheres em início de carreira.",
    objetivo: "Liderar times de dados e ampliar a presença de mulheres na área.",
    tecnicas: ["Python", "Spark", "Airflow", "AWS", "SQL", "Terraform"],
    comportamentais: ["Liderança", "Mentoria", "Visão sistêmica"],
    experiencias: [{ cargo: "Engenheira de Dados Sênior", empresa: "Rio Logística Digital", descricao: "Plataforma de dados na AWS, pipelines com Airflow e Spark.", inicio: "2020-08", fim: "" }],
    formacoes: [{ curso: "Engenharia de Computação", instituicao: "UFRJ", nivel: "Bacharelado", inicio: "2006-03", conclusao: "2011-07" }],
    preferencias: { modalidades: ["Remoto"], areas: ["Dados", "DevOps / Cloud"], disponibilidade: "60 dias" },
  },
];

const EMPRESAS = [
  {
    chave: "nuvem", nome: "Nuvem Clara Tecnologia", razao: "NUVEM CLARA TECNOLOGIA LTDA", municipio: "SAO PAULO", uf: "SP", sub: "nuvemclara",
    responsavel: "Juliana Reis", cargo: "Gerente de Pessoas", icone: "icone:nuvem:vinho", verificar: true,
    perfil: {
      areaAtuacao: "Software e computação em nuvem", localizacao: "São Paulo, SP",
      descricao: "Desenvolvemos plataformas em nuvem para pequenas e médias empresas. Time 100% remoto, com metade das vagas de tecnologia ocupadas por mulheres.",
      informacoes: "Trabalho remoto, horário flexível, auxílio home office, plano de saúde e programa de mentoria interna.",
    },
    vagas: [
      { titulo: "Desenvolvedora Front-end Júnior", area: "Desenvolvimento", nivel: "Júnior", modalidade: "Remoto", tipoContrato: "CLT", localizacao: "São Paulo, SP", salario: 4500, salarioMax: 6000,
        descricao: "Construa interfaces do nosso painel de clientes em React, com foco em acessibilidade e desempenho.", requisitos: "React\nTypeScript\nHTML e CSS semânticos\nGit", beneficios: "Auxílio home office\nPlano de saúde\nMentoria" },
      { titulo: "Engenheira de Dados Pleno", area: "Dados", nivel: "Pleno", modalidade: "Remoto", tipoContrato: "CLT", localizacao: "São Paulo, SP",
        descricao: "Mantenha e evolua os pipelines de dados que alimentam os relatórios dos nossos clientes.", requisitos: "Python\nSQL\nAirflow ou similar\nExperiência com AWS", beneficios: "Auxílio home office\nPlano de saúde" },
    ],
    post: { texto: "Estamos contratando! Abrimos vagas para front-end e dados, com processo seletivo sem teste para levar para casa. #vagas #react", tipo: "oportunidade" },
  },
  {
    chave: "raiz", nome: "Raiz Analytics", razao: "RAIZ ANALYTICS CONSULTORIA EM DADOS LTDA", municipio: "BELO HORIZONTE", uf: "MG", sub: "raizanalytics",
    responsavel: "Marina Duarte", cargo: "Sócia-diretora", icone: "icone:grafico:ameixa", verificar: false,
    perfil: {
      areaAtuacao: "Consultoria em dados", localizacao: "Belo Horizonte, MG",
      descricao: "Consultoria de dados que ajuda empresas a organizar indicadores, criar painéis e tomar decisões baseadas em dados.",
      informacoes: "Modelo híbrido, trilhas de estudo pagas pela empresa e grupo interno de mulheres em dados.",
    },
    vagas: [
      { titulo: "Analista de BI Júnior", area: "Dados", nivel: "Júnior", modalidade: "Híbrido", tipoContrato: "CLT", localizacao: "Belo Horizonte, MG", salario: 3800, salarioMax: 4800,
        descricao: "Crie painéis em Power BI e ajude nossos clientes a entender os próprios números.", requisitos: "SQL\nPower BI ou Looker\nNoções de estatística", beneficios: "Vale-refeição\nCursos pagos" },
      { titulo: "Estágio em Análise de Dados", area: "Dados", nivel: "Estágio", modalidade: "Híbrido", tipoContrato: "Estágio", localizacao: "Belo Horizonte, MG", salario: 1800,
        descricao: "Apoie o time em limpeza de dados, consultas SQL e relatórios.", requisitos: "Cursando Estatística, Computação ou áreas afins\nExcel\nVontade de aprender SQL" },
    ],
    post: { texto: "Dica para quem está começando em dados: domine SQL antes de qualquer ferramenta de BI. Abrimos vaga de estágio em BH! #dados #primeiroemprego", tipo: "dica" },
  },
  {
    chave: "trilha", nome: "Trilha Edtech", razao: "TRILHA EDUCACAO DIGITAL LTDA", municipio: "RECIFE", uf: "PE", sub: "trilhaedtech",
    responsavel: "Patrícia Gomes", cargo: "Coordenadora de Recrutamento", icone: "icone:livro:musgo", verificar: false,
    perfil: {
      areaAtuacao: "Educação e tecnologia", localizacao: "Recife, PE",
      descricao: "Plataforma de cursos on-line de programação para estudantes de escolas públicas do Nordeste.",
      informacoes: "Escritório no Porto Digital, horário flexível e bolsa de estudos para quem quiser se especializar.",
    },
    vagas: [
      { titulo: "Estágio em Desenvolvimento Back-end", area: "Desenvolvimento", nivel: "Estágio", modalidade: "Presencial", tipoContrato: "Estágio", localizacao: "Recife, PE", salario: 1600,
        descricao: "Ajude a construir a API da nossa plataforma de cursos com Node.js e MySQL.", requisitos: "Cursando Computação ou áreas afins\nJavaScript\nNoções de bancos de dados", beneficios: "Bolsa de estudos\nVale-transporte" },
      { titulo: "Designer UX/UI Júnior", area: "UX / UI Design", nivel: "Júnior", modalidade: "Híbrido", tipoContrato: "CLT", localizacao: "Recife, PE",
        descricao: "Desenhe experiências de aprendizagem para jovens estudantes, do protótipo ao teste com usuárias.", requisitos: "Figma\nPortfólio com estudos de caso\nPesquisa com usuários" },
    ],
    post: { texto: "Nosso time de produto cresceu! Procuramos designer UX/UI júnior — transição de carreira é muito bem-vinda. #ux #transicaodecarreira", tipo: "oportunidade" },
  },
  {
    chave: "ponte", nome: "Ponte Pagamentos", razao: "PONTE PAGAMENTOS DIGITAIS S.A.", municipio: "CURITIBA", uf: "PR", sub: "pontepagamentos",
    responsavel: "Renata Lopes", cargo: "Head de Engenharia", icone: "icone:escudo:vinho", verificar: false,
    perfil: {
      areaAtuacao: "Serviços financeiros digitais", localizacao: "Curitiba, PR",
      descricao: "Fintech de pagamentos para o comércio local, com foco em segurança e simplicidade.",
      informacoes: "Remoto ou híbrido, PLR, auxílio educação e licença parental estendida.",
    },
    vagas: [
      { titulo: "Analista de QA Pleno", area: "QA / Testes", nivel: "Pleno", modalidade: "Remoto", tipoContrato: "CLT", localizacao: "Curitiba, PR", salario: 7000, salarioMax: 9000,
        descricao: "Garanta a qualidade dos nossos aplicativos e APIs de pagamento com testes automatizados.", requisitos: "Cypress ou Playwright\nTestes de API\nCI/CD", beneficios: "PLR\nAuxílio educação\nLicença parental estendida" },
      { titulo: "Analista de Segurança da Informação", area: "Segurança da Informação", nivel: "Pleno", modalidade: "Híbrido", tipoContrato: "CLT", localizacao: "Curitiba, PR",
        descricao: "Acompanhe vulnerabilidades, apoie auditorias e ajude o time a desenvolver com segurança.", requisitos: "Conhecimentos de OWASP\nRedes e nuvem\nCertificações são um diferencial" },
    ],
    post: { texto: "Segurança começa no código. Estamos montando um grupo de estudos aberto sobre OWASP para devs e QAs. #seguranca #qa", tipo: "dica" },
  },
];

const COMUNIDADES = [
  { criadora: "ana", nome: "Mulheres no Front-end", tema: "Front-end", icone: "icone:codigo:rosa", membros: ["camila", "duda", "dani"],
    descricao: "Para trocar dicas de React, CSS, acessibilidade e revisar portfólios umas das outras.",
    regras: "Seja gentil e respeitosa.\nCompartilhe a fonte quando indicar um conteúdo.\nSem divulgação de cursos pagos.",
    posts: [["ana", "dica", "Bem-vindas! Contem em que projeto estão trabalhando e o que querem aprender este mês. #frontend"], ["camila", "duvida", "Vale a pena aprender Next.js antes de dominar bem o React puro?"]] },
  { criadora: "bia", nome: "Dados em Ação", tema: "Ciência de dados", icone: "icone:dados:ameixa", membros: ["fe", "camila"],
    descricao: "SQL, Python, BI e engenharia de dados: dúvidas, projetos e vagas da área.",
    regras: "Perguntas de iniciante são muito bem-vindas.\nNada de spam ou venda de cursos.",
    posts: [["bia", "dica", "Desafio da semana: uma consulta que traga os 3 produtos mais vendidos de cada mês. Esta é a minha versão com função de janela — tem outro jeito? Respostas nos comentários! #sql #dados", "post-bia-sql"], ["fe", "experiencia", "Um pipeline que levava 4 horas agora roda em 20 minutos. Não mudamos de ferramenta: reorganizamos as partições por data e cliente e paramos de reprocessar o histórico inteiro todo dia. #engenhariadedados", "post-fe-pipeline"]] },
  { criadora: "fe", nome: "Primeiro Emprego em Tech", tema: "Carreira", icone: "icone:foguete:mel", membros: ["camila", "duda", "ana"],
    descricao: "Apoio para quem procura a primeira vaga: currículo, entrevistas, portfólio e indicações.",
    regras: "Ajude como gostaria de ser ajudada.\nVagas só com link oficial da empresa.\nRespeite o tempo de cada uma.",
    posts: [["fe", "dica", "Mentoria aberta toda quinta às 19h: tragam o currículo e a gente revisa juntas. #primeiroemprego #mentoria"], ["duda", "conquista", "Fui chamada para a segunda etapa de um processo de UX! Obrigada a todas pelas dicas de portfólio. #transicaodecarreira"]] },
  { criadora: "dani", nome: "Qualidade e Segurança", tema: "QA e segurança", icone: "icone:escudo:musgo", membros: ["ana"],
    descricao: "Testes automatizados, qualidade de software e boas práticas de segurança no desenvolvimento.",
    regras: "Compartilhe exemplos sem dados reais de clientes.\nRespeito acima de tudo.",
    posts: [["dani", "dica", "Comecem pelos testes dos fluxos que dão dinheiro (cadastro, login, pagamento). Cobertura alta em código que ninguém usa não ajuda. #qa #testes"]] },
];

const POSTS_FEED = [
  ["ana", "projeto", "Publiquei a nova versão do meu portfólio. O que mudou:\n\n• modo escuro com contraste AA nas duas versões\n• navegação completa pelo teclado, com foco sempre visível\n• páginas de projeto com o problema, o processo e o resultado\n\nFeedbacks são muito bem-vindos, principalmente de quem usa leitor de tela. #react #acessibilidade", "post-ana-portfolio"],
  ["bia", "conquista", "Hoje assumi como Analista de Dados Pleno. 🎉\n\nHá quatro anos eu montava relatórios no Excel e não sabia o que era um JOIN. O que mais me ajudou nesse caminho: estudar SQL todos os dias, pedir revisão das minhas consultas e documentar cada painel como se outra pessoa fosse mantê-lo amanhã.\n\nObrigada a quem revisou meu código e me indicou para essa vaga. #dados #conquista", "post-bia-promocao"],
  ["camila", "duvida", "Primeira entrevista técnica de estágio na semana que vem. Para quem já passou por isso: o que vocês gostariam de ter sabido antes? Estou revisando estruturas de dados e treinando explicar meu raciocínio em voz alta. #primeiroemprego"],
  ["dani", "dica", "Testes de API com Playwright cabem em poucas linhas e rodam junto com os testes de interface. Este é o modelo que uso para cada rota nova: cria o recurso, confere o status e confere o corpo da resposta.\n\nDica extra: rode esses testes no CI a cada pull request — eles pegam regressão de contrato antes de chegar no front. #qa #playwright", "post-dani-playwright"],
  ["duda", "experiencia", "Fiz 8 entrevistas com mulheres que procuram vaga em tecnologia e organizei tudo num mapa de afinidade. Três temas apareceram em quase todas: encontrar vagas relevantes, saber se a candidatura foi vista e confiar que a empresa é real.\n\nPesquisa com usuárias é, de longe, a parte de UX de que eu mais gosto. #ux #transicaodecarreira", "post-duda-pesquisa"],
  ["fe", "oportunidade", "Abri 3 vagas de mentoria gratuita para mulheres em início de carreira que querem entrar em engenharia de dados. São 4 encontros on-line, com um projeto prático no final.\n\nPara participar, comente aqui contando o que você já estudou e o que quer construir. #mentoria #dados", "post-fe-mentoria"],
  ["ana", "dica", "O checklist que eu passo em todo componente antes de abrir o pull request. Leva cinco minutos e evita a maior parte dos problemas de acessibilidade que encontro em revisão. #acessibilidade #frontend", "post-ana-checklist"],
  ["camila", "conquista", "2º lugar na Maratona Regional de Programação! 🏆\n\nResolvemos 9 de 12 problemas em 5 horas. O que mais treinamos e mais caiu: grafos e programação dinâmica. Orgulho da minha equipe. #maratona #conquista", "post-camila-maratona"],
];
const CURTIDAS = { ana: ["bia", "fe", "duda"], bia: ["ana", "fe", "camila", "dani"], camila: ["fe", "ana"], dani: ["ana"], duda: ["fe", "camila"], fe: ["ana", "bia", "camila", "duda"] };
const COMENTARIOS = [
  ["camila", 0, "Ficou lindo! Como você fez o modo escuro?"],
  ["fe", 1, "Parabéns, Bia! Merecido demais."],
  ["fe", 2, "Respira, explica seu raciocínio em voz alta e não tenha medo de perguntar. Vai dar certo!"],
  ["ana", 5, "Eu quero! Estou começando a estudar SQL."],
];
const SEGUIR = [["ana", "bia"], ["ana", "fe"], ["bia", "fe"], ["camila", "fe"], ["camila", "ana"], ["duda", "fe"], ["duda", "ana"], ["dani", "ana"], ["fe", "bia"]];

const empresasCnpj = new Map();
const mock = http.createServer((req, res) => {
  const cnpj = req.url.split("/").pop();
  const e = empresasCnpj.get(cnpj);
  res.writeHead(e ? 200 : 404, { "Content-Type": "application/json" });
  res.end(JSON.stringify(e ?? { message: "CNPJ não encontrado." }));
});
await new Promise((ok) => mock.listen(0, "127.0.0.1", ok));
process.env.CNPJ_API_URL = `http://127.0.0.1:${mock.address().port}/cnpj`;

const { aplicarMigracoes } = await import("../src/database/migracoes.js");
await aplicarMigracoes();
const { default: app } = await import("../src/app.js");
const servidor = await new Promise((ok) => {
  const s = app.listen(0, "127.0.0.1", () => ok(s));
});
const B = `http://127.0.0.1:${servidor.address().port}/api`;

async function req(metodo, caminho, corpo, token) {
  const r = await fetch(B + caminho, {
    method: metodo,
    headers: { ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${metodo} ${caminho}: ${r.status} ${dados.erro ?? ""}`);
  return dados;
}

const contas = [];
const tokens = {};
const ids = {};
try {
  for (const c of CANDIDATAS) {
    const email = `${c.chave}@${DOMINIO}`;
    const senha = novaSenha();
    const cpf = novoCpf();
    const r = await req("POST", "/auth/cadastro", { nome: c.nome, cpf, nascimento: c.nascimento, email, senha, confirmarSenha: senha });
    tokens[c.chave] = r.token;
    const t = r.token;
    await req("PUT", "/candidata/perfil", { cargo: c.cargo, local: c.local, sobre: c.sobre, objetivo: c.objetivo, tecnicas: c.tecnicas, comportamentais: c.comportamentais, experiencias: c.experiencias, formacoes: c.formacoes, preferencias: c.preferencias }, t);
    await req("PUT", "/comunidade/meu-perfil", { area: c.area, bio: c.bio, interesses: c.interesses }, t);
    await req("PUT", "/imagens/foto", { imagem: imagem(`avatar-${c.chave}`) }, t);
    await req("PUT", "/imagens/capa", { imagem: imagem(`capa-${c.chave}`) }, t);
    ids[c.chave] = (await req("GET", "/comunidade/meu-perfil", undefined, t)).perfil.id;
    contas.push({ tipo: "Candidata", nome: c.nome, email, senha, documento: `CPF ${cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}`, entrar: "http://localhost:3006/login" });
  }

  for (const e of EMPRESAS) {
    const cnpj = novoCnpj();
    empresasCnpj.set(cnpj, {
      cnpj, razao_social: e.razao, nome_fantasia: e.nome, situacao_cadastral: 2, descricao_situacao_cadastral: "ATIVA",
      cnae_fiscal: 6201501, cnae_fiscal_descricao: "Desenvolvimento de programas de computador sob encomenda", municipio: e.municipio, uf: e.uf,
    });
    const email = `rh@${e.sub}.${DOMINIO}`;
    const senha = novaSenha();
    const r = await req("POST", "/auth/empresa/cadastro", { cnpj, nomeExibicao: e.nome, responsavelNome: e.responsavel, responsavelCargo: e.cargo, email, senha, confirmarSenha: senha, declaraRepresentacao: true });
    tokens[e.chave] = r.token;
    ids[e.chave] = r.usuario.id;
    await req("PUT", "/empresa/perfil", { ...e.perfil, site: `https://www.${e.sub}.${DOMINIO}` }, r.token);
    await req("PUT", "/imagens/foto", { imagem: imagem(`logo-${e.chave}`) }, r.token);
    await req("PUT", "/imagens/capa", { imagem: imagem(`capa-${e.chave}`) }, r.token);
    e.vagasCriadas = [];
    for (const v of e.vagas) e.vagasCriadas.push((await req("POST", "/empresa/vagas", v, r.token)).vaga);
    await req("POST", "/empresa/publicacoes", e.post, r.token);
    contas.push({ tipo: "Empresa", nome: e.nome, email, senha, documento: `CNPJ ${cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}`, entrar: "http://localhost:3006/empresa/login" });
  }

  await sequelize.query("UPDATE CADASTRO_USUARIA SET email_verificado_em = NOW() WHERE email LIKE ?", { replacements: [`%${DOMINIO}`] });
  await sequelize.query("UPDATE CADASTRO_EMPRESA SET email_verificado_em = NOW() WHERE email LIKE ?", { replacements: [`%${DOMINIO}`] });
  await sequelize.query(
    "UPDATE EMPRESA_DADOS_CADASTRAIS SET fonte = 'Demonstração (dados fictícios)' WHERE id_empresa IN (SELECT id_empresa FROM CADASTRO_EMPRESA WHERE email LIKE ?)",
    { replacements: [`%${DOMINIO}`] }
  );
  for (const e of EMPRESAS.filter((x) => x.verificar)) await req("POST", "/empresa/verificacao", undefined, tokens[e.chave]);

  for (const [quem, quemSegue] of SEGUIR) await req("PUT", `/comunidade/perfis/${ids[quemSegue]}/seguir`, undefined, tokens[quem]);
  const publicadas = [];
  const comImagem = (nome) => (nome ? { imagem: imagem(nome), largura: POST_LARGURA, altura: POST_ALTURA } : {});
  for (const [autora, tipo, texto, img] of POSTS_FEED) {
    publicadas.push((await req("POST", "/comunidade/publicacoes", { texto, tipo, ...comImagem(img) }, tokens[autora])).publicacao);
  }
  for (const [autora, curtidoras] of Object.entries(CURTIDAS)) {
    for (const p of publicadas.filter((x, i) => POSTS_FEED[i][0] === autora)) {
      for (const c of curtidoras) await req("POST", `/comunidade/publicacoes/${p.id}/curtir`, undefined, tokens[c]);
    }
  }
  for (const [quem, indice, texto] of COMENTARIOS) await req("POST", `/comunidade/publicacoes/${publicadas[indice].id}/comentarios`, { texto }, tokens[quem]);

  for (const c of COMUNIDADES) {
    const criada = (await req("POST", "/comunidades", { nome: c.nome, tema: c.tema, descricao: c.descricao, icone: c.icone }, tokens[c.criadora])).comunidade;
    await req("PUT", `/comunidades/${criada.id}`, { regras: c.regras }, tokens[c.criadora]);
    for (const m of c.membros) await req("POST", `/comunidades/${criada.id}/participar`, undefined, tokens[m]);
    for (const [autora, tipo, texto, img] of c.posts) await req("POST", `/comunidades/${criada.id}/publicacoes`, { texto, tipo, ...comImagem(img) }, tokens[autora]);
  }

  const nuvem = EMPRESAS.find((e) => e.chave === "nuvem");
  const candAna = (await req("POST", "/candidaturas", { vagaId: nuvem.vagasCriadas[0].id, titulo: "Desenvolvedora Front-end Júnior", apresentacao: "Olá! Trabalho com React e TypeScript há dois anos e me identifico muito com o foco de vocês em acessibilidade.", links: [{ rotulo: "Portfólio", url: "https://exemplo.com/portfolio-ana" }] }, tokens.ana)).candidatura;
  await req("PATCH", `/empresa/candidaturas/${candAna.id}/status`, { status: "Em análise" }, tokens.nuvem);
  const conv = (await req("POST", "/mensagens", { candidaturaId: candAna.id }, tokens.nuvem)).conversa;
  await req("POST", `/mensagens/${conv.id}`, { texto: "Oi, Ana! Gostamos muito do seu portfólio. Podemos marcar uma conversa esta semana?" }, tokens.nuvem);
  await req("POST", `/mensagens/${conv.id}`, { texto: "Oi! Claro, tenho disponibilidade na quarta ou na quinta à tarde." }, tokens.ana);
  const raiz = EMPRESAS.find((e) => e.chave === "raiz");
  await req("POST", "/candidaturas", { vagaId: raiz.vagasCriadas[1].id, apresentacao: "Estou no 6º período e estudo SQL todos os dias. Adoraria aprender com vocês." }, tokens.camila);
  const trilha = EMPRESAS.find((e) => e.chave === "trilha");
  await req("POST", "/candidaturas", { vagaId: trilha.vagasCriadas[1].id, apresentacao: "Venho do marketing e tenho três estudos de caso de UX no portfólio." }, tokens.duda);

  const direta = (await req("POST", "/mensagens/candidatas", { usuariaId: ids.fe }, tokens.camila)).conversa;
  await req("POST", `/mensagens/candidatas/${direta.id}`, { texto: "Oi, Fernanda! Vi sua mentoria. Ainda tem vaga para quinta?" }, tokens.camila);
  await req("POST", `/mensagens/candidatas/${direta.id}`, { texto: "Oi, Camila! Tem sim. Traz o currículo que a gente revisa juntas 😊" }, tokens.fe);
  await req("POST", `/mensagens/candidatas/${direta.id}`, { texto: "Esse é o roteiro dos encontros:", imagem: imagem("post-fe-mentoria"), largura: POST_LARGURA, altura: POST_ALTURA }, tokens.fe);

  const filtro = `%${DOMINIO}`;
  await sequelize.query(
    `UPDATE PUBLICACAO p JOIN (
       SELECT id_publicacao, ROW_NUMBER() OVER (ORDER BY id_publicacao DESC) AS ordem FROM PUBLICACAO
        WHERE id_usuario IN (SELECT id_usuario FROM CADASTRO_USUARIA WHERE email LIKE :filtro)
     ) x ON x.id_publicacao = p.id_publicacao
     SET p.criada_em = NOW() - INTERVAL (x.ordem * 5 + 1) HOUR`,
    { replacements: { filtro } }
  );
  await sequelize.query(
    `UPDATE COMENTARIO c JOIN PUBLICACAO p ON p.id_publicacao = c.id_publicacao
        SET c.criado_em = p.criada_em + INTERVAL 2 HOUR
      WHERE c.id_usuario IN (SELECT id_usuario FROM CADASTRO_USUARIA WHERE email LIKE :filtro)`,
    { replacements: { filtro } }
  );
  await sequelize.query(
    `UPDATE PUBLICACAO_EMPRESA SET criada_em = NOW() - INTERVAL (id_publicacao_empresa % 4 + 1) DAY
      WHERE id_empresa IN (SELECT id_empresa FROM CADASTRO_EMPRESA WHERE email LIKE :filtro)`,
    { replacements: { filtro } }
  );
  await sequelize.query(
    `UPDATE VAGAS SET data_publicacao = CURDATE() - INTERVAL (id_vaga % 12 + 1) DAY
      WHERE id_perfil_empresa IN (SELECT id_perfil_empresa FROM PERFIL_EMPRESA WHERE id_empresa IN (SELECT id_empresa FROM CADASTRO_EMPRESA WHERE email LIKE :filtro))`,
    { replacements: { filtro } }
  );
  for (const [tabela, idMensagem, idConversa, conversa] of [
    ["MENSAGEM", "id_mensagem", "id_conversa", conv.id],
    ["MENSAGEM_DIRETA", "id_mensagem_direta", "id_conversa_direta", direta.id],
  ]) {
    await sequelize.query(
      `UPDATE ${tabela} m JOIN (
         SELECT ${idMensagem} AS id, ROW_NUMBER() OVER (ORDER BY ${idMensagem} DESC) AS ordem FROM ${tabela} WHERE ${idConversa} = :conversa
       ) x ON x.id = m.${idMensagem}
       SET m.enviada_em = NOW() - INTERVAL (x.ordem * 7) MINUTE`,
      { replacements: { conversa } }
    );
  }
} catch (e) {
  console.error("Falhou:", e.message);
  console.error("Nada foi deixado pela metade de propósito: rode `npm run demo:remover` para limpar o que já foi criado.");
  servidor.close();
  mock.close();
  await sequelize.close();
  process.exit(1);
}

const linhas = [
  "# Contas de demonstração da Bloom",
  "",
  "Todas fictícias, criadas por `npm run demo:criar`. Remova com `npm run demo:remover`.",
  "Os e-mails são do domínio reservado `demo.bloom.test` (nenhum e-mail sai) e já estão confirmados.",
  "CPFs e CNPJs foram gerados com dígitos válidos, mas não são de ninguém. Este arquivo não vai para o git.",
  "",
  "| Tipo | Nome | E-mail (login) | Senha | Documento | Onde entrar |",
  "| --- | --- | --- | --- | --- | --- |",
  ...contas.map((c) => `| ${c.tipo} | ${c.nome} | ${c.email} | \`${c.senha}\` | ${c.documento} | ${c.entrar} |`),
  "",
  "## O que foi criado",
  "",
  `- ${CANDIDATAS.length} candidatas com perfil completo (foto ilustrada, capa, cargo, resumo, competências, experiência, formação e preferências)`,
  `- ${EMPRESAS.length} empresas com logo, capa, perfil, ${EMPRESAS.reduce((s, e) => s + e.vagas.length, 0)} vagas abertas e uma publicação cada (Nuvem Clara Tecnologia está verificada)`,
  `- ${POSTS_FEED.length} publicações no feed (${POSTS_FEED.filter((p) => p[3]).length} com imagem), com curtidas e comentários, e conexões (quem segue quem)`,
  `- ${COMUNIDADES.length} comunidades com regras, participantes e ${COMUNIDADES.reduce((s, c) => s + c.posts.length, 0)} publicações`,
  "- 3 candidaturas (uma em análise, com conversa com a empresa) e uma conversa entre candidatas",
  "",
];
writeFileSync(ARQUIVO, linhas.join("\n"));
console.log(`Pronto: ${CANDIDATAS.length} candidatas e ${EMPRESAS.length} empresas. Logins em contas-demonstracao.md`);
servidor.close();
mock.close();
await sequelize.close();
process.exit(0);
