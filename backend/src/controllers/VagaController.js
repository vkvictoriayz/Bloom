import { Op } from "sequelize";
import { Empresa } from "../models/index.js";
import { Candidatura, CandidaturaEnvio, PerfilEmpresa, Vaga } from "../models/Empresarial.js";

// Vagas publicadas pelas empresas, vistas pela candidata, e as candidaturas
// dela. Rotas exigem login de usuária (exigirLogin(["usuaria"])).

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const hoje = () => new Date().toLocaleDateString("sv-SE");
const eu = (req) => req.auth.sub;

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

// Empresa dona de cada vaga (nome e dados públicos do perfil).
async function empresasDas(vagas) {
  const perfis = await PerfilEmpresa.findAll({ where: { id: { [Op.in]: [...new Set(vagas.map((v) => v.perfilEmpresaId))] } } });
  const contas = await Empresa.findAll({ where: { id: { [Op.in]: perfis.map((p) => p.empresaId) } } });
  const nome = new Map(contas.map((c) => [c.id, c.nome]));
  return new Map(
    perfis.map((p) => [p.id, { id: p.empresaId, nome: nome.get(p.empresaId) ?? "Empresa", logo: p.logo ?? "", site: p.site ?? "", localizacao: p.localizacao ?? "" }])
  );
}

const vagaPublica = (v, empresa) => ({
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
  empresa,
});

// GET /api/vagas — vagas abertas
export const listar = comTratamento(async (req, res) => {
  const vagas = await Vaga.findAll({ where: { status: "Aberta" }, order: [["dataPublicacao", "DESC"], ["id", "DESC"]], limit: 200 });
  const empresas = await empresasDas(vagas);
  return res.json({ vagas: vagas.map((v) => vagaPublica(v, empresas.get(v.perfilEmpresaId))) });
});

// GET /api/vagas/:id — também mostra vagas pausadas/encerradas (com o status)
export const ver = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const vaga = id && (await Vaga.findByPk(id));
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  const empresas = await empresasDas([vaga]);
  return res.json({ vaga: vagaPublica(vaga, empresas.get(vaga.perfilEmpresaId)) });
});

// POST /api/candidaturas { vagaId, titulo, competencias[], apresentacao, links[] }
export const candidatar = comTratamento(async (req, res) => {
  const vagaId = idParam(req.body.vagaId);
  const vaga = vagaId && (await Vaga.findByPk(vagaId));
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  if ((vaga.status ?? "Aberta") !== "Aberta") return erro(res, 400, "Esta vaga não está recebendo candidaturas.");

  const apresentacao = texto(req.body.apresentacao);
  if (apresentacao.length > 1000) return erro(res, 400, "A apresentação pode ter até 1000 caracteres.", "apresentacao");
  const titulo = texto(req.body.titulo).slice(0, 100);
  const competencias = (Array.isArray(req.body.competencias) ? req.body.competencias : [])
    .map(texto)
    .filter(Boolean)
    .map((c) => c.replace(/,/g, " "))
    .join(", ")
    .slice(0, 500);
  const links = (Array.isArray(req.body.links) ? req.body.links : [])
    .filter((l) => l && typeof l.url === "string" && /^https?:\/\//i.test(l.url))
    .slice(0, 10)
    .map((l) => ({ rotulo: texto(l.rotulo).slice(0, 60), url: l.url.slice(0, 200) }));

  const existente = await Candidatura.findOne({ where: { usuariaId: eu(req), vagaId } });
  if (existente) return erro(res, 409, "Você já se candidatou a esta vaga.");

  let cand;
  try {
    cand = await Candidatura.create({ usuariaId: eu(req), vagaId, data: hoje(), status: "Pendente" });
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") return erro(res, 409, "Você já se candidatou a esta vaga.");
    throw e;
  }
  await CandidaturaEnvio.create({ candidaturaId: cand.id, titulo: titulo || null, competencias: competencias || null, apresentacao: apresentacao || null, links: JSON.stringify(links) });
  return res.status(201).json({ candidatura: { id: cand.id, vagaId, data: cand.data, status: cand.status } });
});

// GET /api/candidaturas/minhas
export const minhas = comTratamento(async (req, res) => {
  const cands = await Candidatura.findAll({ where: { usuariaId: eu(req) }, order: [["data", "DESC"], ["id", "DESC"]] });
  const vagas = cands.length ? await Vaga.findAll({ where: { id: { [Op.in]: cands.map((c) => c.vagaId) } } }) : [];
  const empresas = await empresasDas(vagas);
  const envios = cands.length ? await CandidaturaEnvio.findAll({ where: { candidaturaId: { [Op.in]: cands.map((c) => c.id) } } }) : [];
  const vagaPorId = new Map(vagas.map((v) => [v.id, v]));
  const envioPorId = new Map(envios.map((e) => [e.candidaturaId, e]));
  return res.json({
    candidaturas: cands.map((c) => {
      const v = vagaPorId.get(c.vagaId);
      const e = envioPorId.get(c.id);
      let links = [];
      try {
        links = JSON.parse(e?.links ?? "[]");
      } catch {
        links = [];
      }
      return {
        id: c.id,
        data: c.data,
        status: c.status,
        vaga: v ? vagaPublica(v, empresas.get(v.perfilEmpresaId)) : { id: c.vagaId, titulo: "Vaga removida" },
        envio: { titulo: e?.titulo ?? "", apresentacao: e?.apresentacao ?? "", links: Array.isArray(links) ? links : [] },
      };
    }),
  });
});
