import { Op } from "sequelize";
import { Empresa, Usuaria } from "../models/index.js";
import { PerfilComunidade, Publicacao, Comentario, Curtida } from "../models/Comunidade.js";
import { imagensDe } from "../models/Imagem.js";
import { notificar } from "../services/notificacoes.js";
import { perfilCompleto } from "./CandidataController.js";
import { perfisOcultos, privacidadeDe } from "../services/privacidade.js";
import { contasSuspensas } from "../services/suspensao.js";
import { avisarVagaCompativel } from "../services/vagasCompativeis.js";
import { Favorito } from "../models/Candidata.js";
import { contasPremium, Convite } from "../models/Premium.js";
import {
  Candidatura,
  CandidaturaEnvio,
  PerfilEmpresa,
  PublicacaoEmpresa,
  STATUS_CANDIDATURA,
  STATUS_VAGA,
  Vaga,
} from "../models/Empresarial.js";
import { TIPOS } from "./ComunidadeController.js";
import { CandidaturaCurriculo, enviarArquivo, resumoArquivo } from "../models/Curriculo.js";

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const hoje = () => new Date().toLocaleDateString("sv-SE");
const lista = (s) => (s ? s.split(",").map((i) => i.trim()).filter(Boolean) : []);
const eu = (req) => req.auth.sub;

export const MODALIDADES = ["Presencial", "Híbrido", "Remoto"];

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

function urlValida(valor) {
  if (!valor) return true;
  try {
    const u = new URL(valor);
    return ["http:", "https:"].includes(u.protocol) && u.hostname.includes(".");
  } catch {
    return false;
  }
}

async function meuPerfil(empresaId, criar = false) {
  const perfil = await PerfilEmpresa.findOne({ where: { empresaId } });
  if (perfil || !criar) return perfil;
  return PerfilEmpresa.create({ empresaId });
}

async function minhaVaga(req) {
  const id = idParam(req.params.id);
  const perfil = await meuPerfil(eu(req));
  if (!id || !perfil) return null;
  const vaga = await Vaga.findByPk(id);
  return vaga && vaga.perfilEmpresaId === perfil.id ? vaga : null;
}

export const NIVEIS = ["Estágio", "Júnior", "Pleno", "Sênior", "Especialista", "Liderança"];

const numero = (v) => (v === null || v === undefined ? null : Number(v));

function vagaJson(v, extras = {}) {
  return {
    id: v.id,
    titulo: v.titulo,
    descricao: v.descricao,
    requisitos: v.requisitos ?? "",
    beneficios: v.beneficios ?? "",
    area: v.area ?? "",
    nivel: v.nivel ?? "",
    localizacao: v.localizacao ?? "",
    modalidade: v.modalidade ?? "",
    tipoContrato: v.tipoContrato ?? "",
    salario: numero(v.salario),
    salarioMax: numero(v.salarioMax),
    dataPublicacao: v.dataPublicacao,
    status: v.status ?? "Aberta",
    ...extras,
  };
}

function valorEmReais(bruto, campo, rotulo) {
  if (bruto === undefined || bruto === null || String(bruto).trim() === "") return [null];
  const valor = Number(String(bruto).replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(valor) || valor < 0 || valor > 99999999) return [undefined, [`Informe ${rotulo} válido.`, campo]];
  return [valor];
}

function lerVaga(body) {
  const dados = {
    titulo: texto(body.titulo),
    descricao: texto(body.descricao),
    requisitos: texto(body.requisitos),
    beneficios: texto(body.beneficios),
    area: texto(body.area),
    nivel: texto(body.nivel),
    localizacao: texto(body.localizacao),
    modalidade: texto(body.modalidade),
    tipoContrato: texto(body.tipoContrato),
  };
  if (!dados.titulo) return [null, ["Informe o título da vaga.", "titulo"]];
  if (dados.titulo.length > 150) return [null, ["O título pode ter até 150 caracteres.", "titulo"]];
  if (!dados.descricao) return [null, ["Descreva a vaga.", "descricao"]];
  if (dados.descricao.length > 500) return [null, ["A descrição pode ter até 500 caracteres.", "descricao"]];
  if (dados.requisitos.length > 500) return [null, ["Os requisitos podem ter até 500 caracteres.", "requisitos"]];
  if (dados.beneficios.length > 500) return [null, ["Os benefícios podem ter até 500 caracteres.", "beneficios"]];
  if (dados.area.length > 100) return [null, ["A área pode ter até 100 caracteres.", "area"]];
  if (dados.nivel && !NIVEIS.includes(dados.nivel)) return [null, ["Escolha um nível de experiência da lista.", "nivel"]];
  if (dados.localizacao.length > 150) return [null, ["A localização pode ter até 150 caracteres.", "localizacao"]];
  if (!MODALIDADES.includes(dados.modalidade)) return [null, ["Escolha a modalidade de trabalho.", "modalidade"]];
  if (dados.tipoContrato.length > 50) return [null, ["O tipo de contratação pode ter até 50 caracteres.", "tipoContrato"]];

  const [salario, f1] = valorEmReais(body.salario, "salario", "um salário");
  if (f1) return [null, f1];
  const [salarioMax, f2] = valorEmReais(body.salarioMax, "salarioMax", "um valor máximo");
  if (f2) return [null, f2];
  if (salario !== null && salarioMax !== null && salarioMax < salario) return [null, ["O máximo da faixa não pode ser menor que o mínimo.", "salarioMax"]];
  if (salario === null && salarioMax !== null) return [null, ["Informe o mínimo da faixa salarial.", "salario"]];

  for (const campo of ["requisitos", "beneficios", "area", "nivel", "localizacao", "tipoContrato"]) dados[campo] ||= null;
  return [{ ...dados, salario, salarioMax }];
}

async function numerosDasVagas(vagas) {
  const ids = vagas.map((v) => v.id);
  if (!ids.length) return { candidaturas: [], salvas: [] };
  const [candidaturas, salvas] = await Promise.all([
    Candidatura.findAll({ attributes: ["vagaId", "status"], where: { vagaId: { [Op.in]: ids } } }),
    Favorito.findAll({ attributes: ["vagaId"], where: { vagaId: { [Op.in]: ids } } }),
  ]);
  return { candidaturas, salvas };
}

function perfilJson(p) {
  return {
    logo: p?.logo ?? "",
    descricao: p?.descricao ?? "",
    localizacao: p?.localizacao ?? "",
    site: p?.site ?? "",
    areaAtuacao: p?.areaAtuacao ?? "",
    linkedin: p?.linkedin ?? "",
    emailContato: p?.emailContato ?? "",
    informacoes: p?.informacoes ?? "",
  };
}

export const perfil = comTratamento(async (req, res) => {
  const empresa = await Empresa.findByPk(eu(req));
  if (!empresa) return erro(res, 401, "Sessão inválida. Faça login novamente.");
  const p = await meuPerfil(eu(req));
  const vagas = p ? await Vaga.findAll({ where: { perfilEmpresaId: p.id } }) : [];
  const [{ candidaturas }, publicacoes, imagens, premium] = await Promise.all([
    numerosDasVagas(vagas),
    PublicacaoEmpresa.count({ where: { empresaId: eu(req) } }),
    imagensDe("empresa", [eu(req)]),
    contasPremium("empresa", [eu(req)]),
  ]);
  return res.json({
    empresa: { id: empresa.id, nome: empresa.nome, email: empresa.email, telefone: empresa.telefone ?? "", premium: premium.has(eu(req)) },
    imagens: imagens.get(eu(req)),
    perfil: perfilJson(p),
    numeros: {
      vagasAbertas: vagas.filter((v) => v.status === "Aberta").length,
      vagas: vagas.filter((v) => v.status !== "Rascunho").length,
      candidaturas: candidaturas.length,
      pendentes: candidaturas.filter((c) => c.status === "Recebida").length,
      publicacoes,
    },
  });
});

export const atualizarPerfil = comTratamento(async (req, res) => {
  const b = req.body ?? {};
  const dados = {
    logo: texto(b.logo),
    descricao: texto(b.descricao),
    localizacao: texto(b.localizacao),
    site: texto(b.site),
    areaAtuacao: texto(b.areaAtuacao),
    linkedin: texto(b.linkedin),
    emailContato: texto(b.emailContato).toLowerCase(),
    informacoes: texto(b.informacoes),
  };
  if (dados.descricao.length > 500) return erro(res, 400, "A descrição pode ter até 500 caracteres.", "descricao");
  if (dados.localizacao.length > 150) return erro(res, 400, "A localização pode ter até 150 caracteres.", "localizacao");
  if (dados.areaAtuacao.length > 100) return erro(res, 400, "A área de atuação pode ter até 100 caracteres.", "areaAtuacao");
  if (dados.informacoes.length > 1000) return erro(res, 400, "As informações adicionais podem ter até 1000 caracteres.", "informacoes");
  if (dados.site.length > 255 || !urlValida(dados.site)) return erro(res, 400, "Informe um endereço de site válido (https://...).", "site");
  if (dados.logo.length > 255 || !urlValida(dados.logo)) return erro(res, 400, "Informe um endereço de imagem válido (https://...).", "logo");
  if (dados.linkedin.length > 255 || !urlValida(dados.linkedin) || (dados.linkedin && !/linkedin\.com/i.test(dados.linkedin))) {
    return erro(res, 400, "Informe o endereço da página da empresa no LinkedIn (https://www.linkedin.com/...).", "linkedin");
  }
  if (dados.emailContato && (dados.emailContato.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.emailContato))) {
    return erro(res, 400, "Informe um e-mail de contato válido.", "emailContato");
  }

  const conta = {};
  if (b.nome !== undefined) {
    const nome = texto(b.nome);
    if (nome.length < 2 || nome.length > 150) return erro(res, 400, "O nome da empresa deve ter de 2 a 150 caracteres.", "nome");
    conta.nome = nome;
  }
  if (b.telefone !== undefined) {
    const tel = String(b.telefone ?? "").replace(/\D/g, "");
    if (tel && (tel.length < 10 || tel.length > 11)) return erro(res, 400, "Use DDD + número, com 10 ou 11 dígitos.", "telefone");
    conta.telefone = tel || null;
  }

  const p = await meuPerfil(eu(req), true);
  await p.update(Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, v || null])));
  if (Object.keys(conta).length) await Empresa.update(conta, { where: { id: eu(req) } });
  return res.json({ perfil: perfilJson(p) });
});

export const listarVagas = comTratamento(async (req, res) => {
  const p = await meuPerfil(eu(req));
  if (!p) return res.json({ vagas: [] });
  const where = { perfilEmpresaId: p.id };
  if (req.query.status) {
    if (!STATUS_VAGA.includes(req.query.status)) return erro(res, 400, "Status inválido.");
    where.status = req.query.status;
  }
  const vagas = await Vaga.findAll({ where, order: [["id", "DESC"]] });
  const { candidaturas, salvas } = await numerosDasVagas(vagas);
  return res.json({
    vagas: vagas.map((v) =>
      vagaJson(v, { candidaturas: candidaturas.filter((c) => c.vagaId === v.id).length, interessadas: salvas.filter((f) => f.vagaId === v.id).length })
    ),
  });
});

async function publicada(vaga, req) {
  const empresa = await Empresa.findByPk(eu(req));
  await avisarVagaCompativel(vaga, empresa?.nome);
}

export const criarVaga = comTratamento(async (req, res) => {
  const [dados, falha] = lerVaga(req.body);
  if (!dados) return erro(res, 400, ...falha);
  const rascunho = req.body.rascunho === true;
  const p = await meuPerfil(eu(req), true);
  const vaga = await Vaga.create({
    ...dados,
    perfilEmpresaId: p.id,
    status: rascunho ? "Rascunho" : "Aberta",
    dataPublicacao: rascunho ? null : hoje(),
  });
  if (!rascunho) await publicada(vaga, req);
  return res.status(201).json({ vaga: vagaJson(vaga, { candidaturas: 0, interessadas: 0 }) });
});

export const verVaga = comTratamento(async (req, res) => {
  const vaga = await minhaVaga(req);
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  const { candidaturas, salvas } = await numerosDasVagas([vaga]);
  const porStatus = Object.fromEntries(STATUS_CANDIDATURA.map((s) => [s, candidaturas.filter((c) => c.status === s).length]));
  return res.json({ vaga: vagaJson(vaga, { candidaturas: candidaturas.length, interessadas: salvas.length, porStatus }) });
});

export const editarVaga = comTratamento(async (req, res) => {
  const vaga = await minhaVaga(req);
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  const [dados, falha] = lerVaga(req.body);
  if (!dados) return erro(res, 400, ...falha);
  await vaga.update(dados);
  return res.json({ vaga: vagaJson(vaga) });
});

export const mudarStatusVaga = comTratamento(async (req, res) => {
  const vaga = await minhaVaga(req);
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  const status = texto(req.body.status);
  if (!STATUS_VAGA.includes(status)) return erro(res, 400, "Status inválido.");
  if (status === "Rascunho" && vaga.status !== "Rascunho" && (await Candidatura.count({ where: { vagaId: vaga.id } }))) {
    return erro(res, 400, "Uma vaga com candidaturas não volta a ser rascunho. Pause ou encerre a vaga.");
  }
  const primeiraPublicacao = status === "Aberta" && !vaga.dataPublicacao;
  await vaga.update({ status, ...(primeiraPublicacao ? { dataPublicacao: hoje() } : {}) });
  if (primeiraPublicacao) await publicada(vaga, req);
  return res.json({ vaga: vagaJson(vaga) });
});

export const excluirVaga = comTratamento(async (req, res) => {
  const vaga = await minhaVaga(req);
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  if (await Candidatura.count({ where: { vagaId: vaga.id } })) {
    return erro(res, 409, "Esta vaga já recebeu candidaturas e não pode ser excluída. Encerre a vaga para parar de recebê-las.");
  }
  await Favorito.destroy({ where: { vagaId: vaga.id } });
  await Convite.destroy({ where: { vagaId: vaga.id } });
  await vaga.destroy();
  return res.status(204).end();
});

export const dashboard = comTratamento(async (req, res) => {
  const p = await meuPerfil(eu(req));
  const vagas = p ? await Vaga.findAll({ where: { perfilEmpresaId: p.id }, order: [["id", "DESC"]] }) : [];
  const { candidaturas, salvas } = await numerosDasVagas(vagas);
  const [publicacoes, convites] = await Promise.all([
    PublicacaoEmpresa.count({ where: { empresaId: eu(req) } }),
    Convite.count({ where: { empresaId: eu(req) } }),
  ]);
  const conta = (status) => candidaturas.filter((c) => c.status === status).length;
  return res.json({
    totais: {
      vagasPublicadas: vagas.filter((v) => v.status !== "Rascunho").length,
      vagasAtivas: vagas.filter((v) => v.status === "Aberta").length,
      rascunhos: vagas.filter((v) => v.status === "Rascunho").length,
      candidaturas: candidaturas.length,
      recebidas: conta("Recebida"),
      emAnalise: conta("Em análise"),
      emEntrevista: conta("Em entrevista"),
      aprovadas: conta("Aprovada"),
      reprovadas: conta("Reprovada"),
      interessadas: salvas.length,
      convites,
      publicacoes,
    },
    vagas: vagas
      .filter((v) => v.status !== "Rascunho")
      .map((v) => ({
        id: v.id,
        titulo: v.titulo,
        status: v.status,
        dataPublicacao: v.dataPublicacao,
        candidaturas: candidaturas.filter((c) => c.vagaId === v.id).length,
        aprovadas: candidaturas.filter((c) => c.vagaId === v.id && c.status === "Aprovada").length,
        interessadas: salvas.filter((f) => f.vagaId === v.id).length,
      })),
  });
});

async function perfisPublicos(ids) {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return new Map();
  const [contas, perfis, imagens] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: unicos } } }),
    PerfilComunidade.findAll({ where: { usuariaId: { [Op.in]: unicos } } }),
    imagensDe("usuaria", unicos),
  ]);
  const porId = new Map(perfis.map((p) => [p.usuariaId, p]));
  return new Map(
    contas.map((c) => {
      const p = porId.get(c.id);
      const { foto, capa } = imagens.get(c.id);
      return [c.id, { id: c.id, nome: c.nome, area: p?.area ?? "", interesses: lista(p?.interesses), bio: p?.bio ?? "", foto, capa }];
    })
  );
}

export const listarCandidaturas = comTratamento(async (req, res) => {
  const p = await meuPerfil(eu(req));
  if (!p) return res.json({ candidaturas: [] });
  const vagas = await Vaga.findAll({ where: { perfilEmpresaId: p.id } });
  let ids = vagas.map((v) => v.id);
  const filtroVaga = idParam(req.query.vaga);
  if (req.query.vaga) ids = ids.filter((id) => id === filtroVaga);
  if (!ids.length) return res.json({ candidaturas: [] });

  const where = { vagaId: { [Op.in]: ids } };
  if (req.query.status) {
    if (!STATUS_CANDIDATURA.includes(req.query.status)) return erro(res, 400, "Status inválido.");
    where.status = req.query.status;
  }
  const cands = await Candidatura.findAll({ where, order: [["data", "DESC"], ["id", "DESC"]] });
  const [pessoas, envios] = await Promise.all([
    perfisPublicos(cands.map((c) => c.usuariaId)),
    cands.length ? CandidaturaEnvio.findAll({ where: { candidaturaId: { [Op.in]: cands.map((c) => c.id) } } }) : [],
  ]);
  const vagaPorId = new Map(vagas.map((v) => [v.id, v]));
  const envioPorId = new Map(envios.map((e) => [e.candidaturaId, e]));
  return res.json({
    candidaturas: cands.map((c) => ({
      id: c.id,
      data: c.data,
      status: c.status,
      vaga: { id: c.vagaId, titulo: vagaPorId.get(c.vagaId)?.titulo ?? "" },
      candidata: { ...(pessoas.get(c.usuariaId) ?? { id: c.usuariaId, nome: "Candidata", area: "" }), titulo: envioPorId.get(c.id)?.titulo ?? "" },
    })),
  });
});

async function minhaCandidatura(req) {
  const id = idParam(req.params.id);
  const p = await meuPerfil(eu(req));
  if (!id || !p) return [null];
  const cand = await Candidatura.findByPk(id);
  if (!cand) return [null];
  const vaga = await Vaga.findByPk(cand.vagaId);
  return vaga && vaga.perfilEmpresaId === p.id ? [cand, vaga] : [null];
}

export const verCandidatura = comTratamento(async (req, res) => {
  const [cand, vaga] = await minhaCandidatura(req);
  if (!cand) return erro(res, 404, "Candidatura não encontrada.");
  const [conta, pessoas, envio, profissional, curriculo] = await Promise.all([
    Usuaria.findByPk(cand.usuariaId),
    perfisPublicos([cand.usuariaId]),
    CandidaturaEnvio.findOne({ where: { candidaturaId: cand.id } }),
    perfilCompleto(cand.usuariaId, { comContato: false }),
    CandidaturaCurriculo.findOne({ attributes: ["nomeArquivo", "tamanho", "enviadoEm"], where: { candidaturaId: cand.id } }),
  ]);
  let links = [];
  try {
    links = JSON.parse(envio?.links ?? "[]");
  } catch {
    links = [];
  }
  return res.json({
    candidatura: { id: cand.id, data: cand.data, status: cand.status },
    vaga: vagaJson(vaga),
    candidata: { ...pessoas.get(cand.usuariaId), email: conta?.email ?? "" },
    perfil: profissional,
    envio: {
      titulo: envio?.titulo ?? "",
      competencias: lista(envio?.competencias),
      apresentacao: envio?.apresentacao ?? "",
      links: Array.isArray(links) ? links : [],
      curriculo: resumoArquivo(curriculo),
    },
  });
});

export const baixarCurriculoCandidatura = comTratamento(async (req, res) => {
  const [cand] = await minhaCandidatura(req);
  if (!cand) return erro(res, 404, "Candidatura não encontrada.");
  const arquivo = await CandidaturaCurriculo.findOne({ where: { candidaturaId: cand.id } });
  if (!arquivo) return erro(res, 404, "Esta candidatura não tem currículo anexado.");
  return enviarArquivo(res, arquivo);
});

export const mudarStatusCandidatura = comTratamento(async (req, res) => {
  const [cand] = await minhaCandidatura(req);
  if (!cand) return erro(res, 404, "Candidatura não encontrada.");
  const status = texto(req.body.status);
  if (!STATUS_CANDIDATURA.includes(status)) return erro(res, 400, "Status inválido.");
  const mudou = cand.status !== status;
  await cand.update({ status });
  if (mudou) {
    const vaga = await Vaga.findByPk(cand.vagaId);
    const frase = {
      Recebida: "voltou para a etapa de recebidas",
      "Em análise": "está em análise",
      "Em entrevista": "avançou para a etapa de entrevista",
      Aprovada: "foi aprovada",
      Reprovada: "não foi selecionada desta vez",
    }[status];
    await notificar({
      tipoConta: "usuaria",
      contaId: cand.usuariaId,
      tipo: "candidatura",
      texto: `Sua candidatura para ${vaga?.titulo ?? "uma vaga"} ${frase}.`,
      link: `/candidata/candidaturas/s${cand.id}`,
    });
  }
  return res.json({ candidatura: { id: cand.id, data: cand.data, status: cand.status } });
});

const publicacaoJson = (p, nomeEmpresa, minha) => ({
  id: p.id,
  tipo: p.tipo,
  texto: p.texto,
  criadaEm: p.criadaEm,
  editadaEm: p.editadaEm ?? null,
  empresa: { id: p.empresaId, nome: nomeEmpresa },
  minha,
});

function lerPublicacao(body) {
  const conteudo = texto(body.texto);
  const tipo = texto(body.tipo) || "oportunidade";
  if (!conteudo) return [null, ["Escreva algo para publicar.", "texto"]];
  if (conteudo.length > 1000) return [null, ["A publicação pode ter até 1000 caracteres.", "texto"]];
  if (!TIPOS.includes(tipo)) return [null, ["Escolha um tipo de publicação válido.", "tipo"]];
  return [{ texto: conteudo, tipo }];
}

export const listarPublicacoes = comTratamento(async (req, res) => {
  const empresa = await Empresa.findByPk(eu(req));
  const lista = await PublicacaoEmpresa.findAll({ where: { empresaId: eu(req) }, order: [["criadaEm", "DESC"], ["id", "DESC"]] });
  return res.json({ publicacoes: lista.map((p) => publicacaoJson(p, empresa?.nome ?? "", true)) });
});

export const criarPublicacao = comTratamento(async (req, res) => {
  const [dados, falha] = lerPublicacao(req.body);
  if (!dados) return erro(res, 400, ...falha);
  const empresa = await Empresa.findByPk(eu(req));
  const p = await PublicacaoEmpresa.create({ ...dados, empresaId: eu(req) });
  return res.status(201).json({ publicacao: publicacaoJson(p, empresa?.nome ?? "", true) });
});

async function minhaPublicacao(req) {
  const id = idParam(req.params.id);
  const p = id && (await PublicacaoEmpresa.findByPk(id));
  return p && p.empresaId === eu(req) ? p : null;
}

export const editarPublicacao = comTratamento(async (req, res) => {
  const p = await minhaPublicacao(req);
  if (!p) return erro(res, 404, "Publicação não encontrada.");
  const [dados, falha] = lerPublicacao(req.body);
  if (!dados) return erro(res, 400, ...falha);
  await p.update({ ...dados, editadaEm: new Date() });
  const empresa = await Empresa.findByPk(eu(req));
  return res.json({ publicacao: publicacaoJson(p, empresa?.nome ?? "", true) });
});

export const excluirPublicacao = comTratamento(async (req, res) => {
  const p = await minhaPublicacao(req);
  if (!p) return erro(res, 404, "Publicação não encontrada.");
  await p.destroy();
  return res.json({ ok: true });
});

export const feed = comTratamento(async (req, res) => {
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const porPagina = 20;
  const limite = porPagina * pagina + 1;
  const [suspU, suspE] = await Promise.all([contasSuspensas("usuaria"), contasSuspensas("empresa")]);
  const semU = [...suspU].concat(0);
  const semE = [...suspE].filter((i) => i !== eu(req)).concat(0);
  const [dasIntegrantes, dasEmpresas] = await Promise.all([
    Publicacao.findAll({ where: { usuariaId: { [Op.notIn]: semU } }, order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: limite }),
    PublicacaoEmpresa.findAll({ where: { empresaId: { [Op.notIn]: semE } }, order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: limite }),
  ]);
  const idsEmpresas = [...new Set(dasEmpresas.map((p) => p.empresaId))];
  const [autoras, empresas, fotosEmpresas] = await Promise.all([
    perfisPublicos(dasIntegrantes.map((p) => p.usuariaId)),
    Empresa.findAll({ where: { id: { [Op.in]: idsEmpresas } } }),
    imagensDe("empresa", idsEmpresas),
  ]);
  const nomeEmpresa = new Map(empresas.map((e) => [e.id, e.nome]));
  const ids = dasIntegrantes.map((p) => p.id);
  const [curtidas, comentarios] = ids.length
    ? await Promise.all([
        Curtida.findAll({ where: { publicacaoId: { [Op.in]: ids } } }),
        Comentario.findAll({ where: { publicacaoId: { [Op.in]: ids } } }),
      ])
    : [[], []];

  const itens = [
    ...dasIntegrantes.map((p) => {
      const a = autoras.get(p.usuariaId);
      return {
        id: `u${p.id}`,
        origem: "integrante",
        tipo: p.tipo,
        texto: p.texto,
        criadaEm: p.criadaEm,
        autor: { id: p.usuariaId, nome: a?.nome ?? "Integrante", detalhe: a?.area ?? "", foto: a?.foto ?? null },
        curtidas: curtidas.filter((c) => c.publicacaoId === p.id).length,
        comentarios: comentarios.filter((c) => c.publicacaoId === p.id).length,
        minha: false,
      };
    }),
    ...dasEmpresas.map((p) => ({
      id: `e${p.id}`,
      origem: "empresa",
      tipo: p.tipo,
      texto: p.texto,
      criadaEm: p.criadaEm,
      autor: { id: p.empresaId, nome: nomeEmpresa.get(p.empresaId) ?? "Empresa", detalhe: "Empresa", foto: fotosEmpresas.get(p.empresaId)?.foto ?? null },
      minha: p.empresaId === eu(req),
    })),
  ].sort((x, y) => new Date(y.criadaEm) - new Date(x.criadaEm));

  const inicio = (pagina - 1) * porPagina;
  return res.json({ publicacoes: itens.slice(inicio, inicio + porPagina), temMais: itens.length > inicio + porPagina });
});

export const talentos = comTratamento(async (req, res) => {
  const busca = texto(req.query.busca).toLowerCase();
  const area = texto(req.query.area).toLowerCase();
  const [todas, ocultos] = await Promise.all([Usuaria.findAll({ order: [["nome", "ASC"]], limit: 300 }), perfisOcultos()]);
  const contas = todas.filter((c) => !ocultos.has(c.id));
  const mapa = await perfisPublicos(contas.map((c) => c.id));
  const contagem = await Publicacao.findAll({ attributes: ["usuariaId"] });
  let pessoas = contas.map((c) => ({
    ...mapa.get(c.id),
    publicacoes: contagem.filter((p) => p.usuariaId === c.id).length,
  }));
  if (busca) pessoas = pessoas.filter((p) => `${p.nome} ${p.area} ${p.interesses.join(" ")} ${p.bio}`.toLowerCase().includes(busca));
  if (area) pessoas = pessoas.filter((p) => p.area.toLowerCase() === area);
  const premium = await contasPremium("usuaria", pessoas.map((p) => p.id));
  pessoas = pessoas.map((p) => ({ ...p, premium: premium.has(p.id) })).sort((a, b) => Number(b.premium) - Number(a.premium));
  return res.json({ talentos: pessoas });
});

export const convidar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const conta = id && (await Usuaria.findByPk(id));
  const privacidade = conta && (await privacidadeDe([id])).get(id);
  if (!conta || !privacidade.perfilPublico || conta.suspensaEm) return erro(res, 404, "Perfil não encontrado.");
  req.params.id = String(req.body?.vagaId ?? "");
  const vaga = await minhaVaga(req);
  if (!vaga) return erro(res, 404, "Vaga não encontrada.", "vagaId");
  if (vaga.status !== "Aberta") return erro(res, 400, "Só é possível convidar para vagas abertas.", "vagaId");
  const mensagem = texto(req.body.mensagem);
  if (mensagem.length > 500) return erro(res, 400, "A mensagem pode ter até 500 caracteres.", "mensagem");
  if (await Candidatura.findOne({ where: { vagaId: vaga.id, usuariaId: id } })) return erro(res, 409, "Ela já se candidatou a esta vaga.");
  if (await Convite.findOne({ where: { vagaId: vaga.id, usuariaId: id } })) return erro(res, 409, "Você já convidou esta profissional para esta vaga.");

  const convite = await Convite.create({ empresaId: eu(req), usuariaId: id, vagaId: vaga.id, mensagem: mensagem || null });
  const empresa = await Empresa.findByPk(eu(req));
  await notificar({
    tipoConta: "usuaria",
    contaId: id,
    tipo: "convite",
    texto: `${empresa?.nome ?? "Uma empresa"} convidou você para o processo da vaga ${vaga.titulo}.${mensagem ? ` “${mensagem.slice(0, 120)}”` : ""}`,
    link: `/vagas/b${vaga.id}`,
  });
  return res.status(201).json({ convite: { id: convite.id, vagaId: vaga.id, criadoEm: convite.criadoEm } });
});

export const talento = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const conta = id && (await Usuaria.findByPk(id));
  const privacidade = conta && (await privacidadeDe([id])).get(id);
  if (!conta || !privacidade.perfilPublico || conta.suspensaEm) return erro(res, 404, "Perfil não encontrado.");
  const mapa = await perfisPublicos([id]);
  const pubs = await Publicacao.findAll({ where: { usuariaId: id }, order: [["criadaEm", "DESC"]], limit: 20 });
  return res.json({
    talento: { ...mapa.get(id), ...(privacidade.mostrarContato ? { email: conta.email } : {}) },
    profissional: privacidade.mostrarExperiencia ? await perfilCompleto(id, { comContato: false }) : null,
    convidadaPara: (await Convite.findAll({ attributes: ["vagaId"], where: { empresaId: eu(req), usuariaId: id } })).map((c) => c.vagaId),
    publicacoes: pubs.map((p) => ({ id: p.id, tipo: p.tipo, texto: p.texto, criadaEm: p.criadaEm })),
  });
});
