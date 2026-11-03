import { Op } from "sequelize";
import { Empresa, Usuaria } from "../models/index.js";
import { PerfilComunidade, Publicacao, Comentario, Curtida } from "../models/Comunidade.js";
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

// Área privada da empresa. Todas as rotas exigem login de empresa
// (exigirLogin(["empresa"])) e só mexem em registros da própria empresa:
// vaga, candidatura ou publicação de outra empresa responde 404.

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const hoje = () => new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD
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

// Vaga da empresa logada, ou null (inexistente ou de outra empresa).
async function minhaVaga(req) {
  const id = idParam(req.params.id);
  const perfil = await meuPerfil(eu(req));
  if (!id || !perfil) return null;
  const vaga = await Vaga.findByPk(id);
  return vaga && vaga.perfilEmpresaId === perfil.id ? vaga : null;
}

function vagaJson(v, candidaturas = undefined) {
  return {
    id: v.id,
    titulo: v.titulo,
    descricao: v.descricao,
    requisitos: v.requisitos ?? "",
    area: v.area ?? "",
    localizacao: v.localizacao ?? "",
    modalidade: v.modalidade ?? "",
    tipoContrato: v.tipoContrato ?? "",
    salario: v.salario === null || v.salario === undefined ? null : Number(v.salario),
    dataPublicacao: v.dataPublicacao,
    status: v.status ?? "Aberta",
    ...(candidaturas !== undefined ? { candidaturas } : {}),
  };
}

// Valida os campos de VAGAS (tamanhos do banco). Devolve [dados] ou [null, erro].
function lerVaga(body) {
  const dados = {
    titulo: texto(body.titulo),
    descricao: texto(body.descricao),
    requisitos: texto(body.requisitos),
    area: texto(body.area),
    localizacao: texto(body.localizacao),
    modalidade: texto(body.modalidade),
    tipoContrato: texto(body.tipoContrato),
  }
  if (!dados.titulo) return [null, ["Informe o título da vaga.", "titulo"]];
  if (dados.titulo.length > 150) return [null, ["O título pode ter até 150 caracteres.", "titulo"]];
  if (!dados.descricao) return [null, ["Descreva a vaga.", "descricao"]];
  if (dados.descricao.length > 500) return [null, ["A descrição pode ter até 500 caracteres.", "descricao"]];
  if (dados.requisitos.length > 500) return [null, ["Os requisitos podem ter até 500 caracteres.", "requisitos"]];
  if (dados.area.length > 100) return [null, ["A área pode ter até 100 caracteres.", "area"]];
  if (dados.localizacao.length > 150) return [null, ["A localização pode ter até 150 caracteres.", "localizacao"]];
  if (!MODALIDADES.includes(dados.modalidade)) return [null, ["Escolha a modalidade de trabalho.", "modalidade"]];
  if (dados.tipoContrato.length > 50) return [null, ["O tipo de contratação pode ter até 50 caracteres.", "tipoContrato"]];

  let salario = null;
  if (body.salario !== undefined && body.salario !== null && String(body.salario).trim() !== "") {
    salario = Number(String(body.salario).replace(",", "."));
    if (!Number.isFinite(salario) || salario < 0 || salario > 99999999) return [null, ["Informe um salário válido.", "salario"]];
  }
  for (const campo of ["requisitos", "area", "localizacao", "tipoContrato"]) dados[campo] ||= null;
  return [{ ...dados, salario }];
}

// ---------------------------------------------------------------- Perfil

export const perfil = comTratamento(async (req, res) => {
  const empresa = await Empresa.findByPk(eu(req));
  if (!empresa) return erro(res, 401, "Sessão inválida. Faça login novamente.");
  const p = await meuPerfil(eu(req));
  const vagas = p ? await Vaga.findAll({ where: { perfilEmpresaId: p.id } }) : [];
  const [candidaturas, pendentes, publicacoes] = await Promise.all([
    vagas.length ? Candidatura.count({ where: { vagaId: { [Op.in]: vagas.map((v) => v.id) } } }) : 0,
    vagas.length ? Candidatura.count({ where: { vagaId: { [Op.in]: vagas.map((v) => v.id) }, status: "Pendente" } }) : 0,
    PublicacaoEmpresa.count({ where: { empresaId: eu(req) } }),
  ]);
  return res.json({
    empresa: { id: empresa.id, nome: empresa.nome, email: empresa.email, telefone: empresa.telefone ?? "" },
    perfil: { logo: p?.logo ?? "", descricao: p?.descricao ?? "", localizacao: p?.localizacao ?? "", site: p?.site ?? "" },
    numeros: {
      vagasAbertas: vagas.filter((v) => (v.status ?? "Aberta") === "Aberta").length,
      vagas: vagas.length,
      candidaturas,
      pendentes,
      publicacoes,
    },
  });
});

export const atualizarPerfil = comTratamento(async (req, res) => {
  const dados = {
    logo: texto(req.body.logo),
    descricao: texto(req.body.descricao),
    localizacao: texto(req.body.localizacao),
    site: texto(req.body.site),
  };
  if (dados.descricao.length > 500) return erro(res, 400, "A descrição pode ter até 500 caracteres.", "descricao");
  if (dados.localizacao.length > 150) return erro(res, 400, "A localização pode ter até 150 caracteres.", "localizacao");
  if (dados.site.length > 255 || !urlValida(dados.site)) return erro(res, 400, "Informe um endereço de site válido (https://...).", "site");
  if (dados.logo.length > 255 || !urlValida(dados.logo)) return erro(res, 400, "Informe um endereço de imagem válido (https://...).", "logo");

  const p = await meuPerfil(eu(req), true);
  await p.update({
    logo: dados.logo || null,
    descricao: dados.descricao || null,
    localizacao: dados.localizacao || null,
    site: dados.site || null,
  });
  return res.json({ perfil: { logo: p.logo ?? "", descricao: p.descricao ?? "", localizacao: p.localizacao ?? "", site: p.site ?? "" } });
});

// ----------------------------------------------------------------- Vagas

export const listarVagas = comTratamento(async (req, res) => {
  const p = await meuPerfil(eu(req));
  if (!p) return res.json({ vagas: [] });
  const where = { perfilEmpresaId: p.id };
  if (req.query.status) {
    if (!STATUS_VAGA.includes(req.query.status)) return erro(res, 400, "Status inválido.");
    where.status = req.query.status;
  }
  const vagas = await Vaga.findAll({ where, order: [["dataPublicacao", "DESC"], ["id", "DESC"]] });
  const cands = vagas.length ? await Candidatura.findAll({ where: { vagaId: { [Op.in]: vagas.map((v) => v.id) } } }) : [];
  return res.json({ vagas: vagas.map((v) => vagaJson(v, cands.filter((c) => c.vagaId === v.id).length)) });
});

export const criarVaga = comTratamento(async (req, res) => {
  const [dados, falha] = lerVaga(req.body);
  if (!dados) return erro(res, 400, ...falha);
  const p = await meuPerfil(eu(req), true);
  const vaga = await Vaga.create({ ...dados, perfilEmpresaId: p.id, status: "Aberta", dataPublicacao: hoje() });
  return res.status(201).json({ vaga: vagaJson(vaga, 0) });
});

export const verVaga = comTratamento(async (req, res) => {
  const vaga = await minhaVaga(req);
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  const total = await Candidatura.count({ where: { vagaId: vaga.id } });
  return res.json({ vaga: vagaJson(vaga, total) });
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
  await vaga.update({ status });
  return res.json({ vaga: vagaJson(vaga) });
});

// ---------------------------------------------------------- Candidaturas

async function perfisPublicos(ids) {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return new Map();
  const [contas, perfis] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: unicos } } }),
    PerfilComunidade.findAll({ where: { usuariaId: { [Op.in]: unicos } } }),
  ]);
  const porId = new Map(perfis.map((p) => [p.usuariaId, p]));
  return new Map(
    contas.map((c) => {
      const p = porId.get(c.id);
      return [c.id, { id: c.id, nome: c.nome, area: p?.area ?? "", interesses: lista(p?.interesses), bio: p?.bio ?? "" }];
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
  const [conta, pessoas, envio] = await Promise.all([
    Usuaria.findByPk(cand.usuariaId),
    perfisPublicos([cand.usuariaId]),
    CandidaturaEnvio.findOne({ where: { candidaturaId: cand.id } }),
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
    // O e-mail foi informado pela candidata ao se candidatar a esta vaga.
    candidata: { ...pessoas.get(cand.usuariaId), email: conta?.email ?? "" },
    envio: {
      titulo: envio?.titulo ?? "",
      competencias: lista(envio?.competencias),
      apresentacao: envio?.apresentacao ?? "",
      links: Array.isArray(links) ? links : [],
    },
  });
});

export const mudarStatusCandidatura = comTratamento(async (req, res) => {
  const [cand] = await minhaCandidatura(req);
  if (!cand) return erro(res, 404, "Candidatura não encontrada.");
  const status = texto(req.body.status);
  if (!STATUS_CANDIDATURA.includes(status)) return erro(res, 400, "Status inválido.");
  await cand.update({ status });
  return res.json({ candidatura: { id: cand.id, data: cand.data, status: cand.status } });
});

// ----------------------------------------------------------- Publicações

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

// ------------------------------------------------------------------ Feed

// Feed da empresa: publicações das integrantes (somente leitura) e das
// empresas, da mais recente para a mais antiga.
export const feed = comTratamento(async (req, res) => {
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const porPagina = 20;
  const limite = porPagina * pagina + 1;
  const [dasIntegrantes, dasEmpresas] = await Promise.all([
    Publicacao.findAll({ order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: limite }),
    PublicacaoEmpresa.findAll({ order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: limite }),
  ]);
  const [autoras, empresas] = await Promise.all([
    perfisPublicos(dasIntegrantes.map((p) => p.usuariaId)),
    Empresa.findAll({ where: { id: { [Op.in]: [...new Set(dasEmpresas.map((p) => p.empresaId))] } } }),
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
        autor: { id: p.usuariaId, nome: a?.nome ?? "Integrante", detalhe: a?.area ?? "" },
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
      autor: { id: p.empresaId, nome: nomeEmpresa.get(p.empresaId) ?? "Empresa", detalhe: "Empresa" },
      minha: p.empresaId === eu(req),
    })),
  ].sort((x, y) => new Date(y.criadaEm) - new Date(x.criadaEm));

  const inicio = (pagina - 1) * porPagina;
  return res.json({ publicacoes: itens.slice(inicio, inicio + porPagina), temMais: itens.length > inicio + porPagina });
});

// --------------------------------------------------------------- Talentos

// Só dados que a integrante tornou públicos na comunidade (nome, área,
// interesses e apresentação). Nunca CPF, e-mail ou telefone.
export const talentos = comTratamento(async (req, res) => {
  const busca = texto(req.query.busca).toLowerCase();
  const area = texto(req.query.area).toLowerCase();
  const contas = await Usuaria.findAll({ order: [["nome", "ASC"]], limit: 300 });
  const mapa = await perfisPublicos(contas.map((c) => c.id));
  const contagem = await Publicacao.findAll({ attributes: ["usuariaId"] });
  let pessoas = contas.map((c) => ({
    ...mapa.get(c.id),
    publicacoes: contagem.filter((p) => p.usuariaId === c.id).length,
  }));
  if (busca) pessoas = pessoas.filter((p) => `${p.nome} ${p.area} ${p.interesses.join(" ")} ${p.bio}`.toLowerCase().includes(busca));
  if (area) pessoas = pessoas.filter((p) => p.area.toLowerCase() === area);
  return res.json({ talentos: pessoas });
});

export const talento = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id || !(await Usuaria.findByPk(id))) return erro(res, 404, "Perfil não encontrado.");
  const mapa = await perfisPublicos([id]);
  const pubs = await Publicacao.findAll({ where: { usuariaId: id }, order: [["criadaEm", "DESC"]], limit: 20 });
  return res.json({
    talento: mapa.get(id),
    publicacoes: pubs.map((p) => ({ id: p.id, tipo: p.tipo, texto: p.texto, criadaEm: p.criadaEm })),
  });
});
