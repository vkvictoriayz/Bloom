import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Empresa } from "../models/index.js";
import { Candidatura, CandidaturaEnvio, PerfilEmpresa, Vaga } from "../models/Empresarial.js";
import { CandidaturaCurriculo, CurriculoCandidata } from "../models/Curriculo.js";
import { imagensDe } from "../models/Imagem.js";
import { Conversa, Mensagem } from "../models/Interacao.js";
import { contasPremium } from "../models/Premium.js";
import { Usuaria } from "../models/Usuaria.js";
import { notificar } from "../services/notificacoes.js";

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
  const [imagens, premium] = await Promise.all([imagensDe("empresa", perfis.map((p) => p.empresaId)), contasPremium("empresa", perfis.map((p) => p.empresaId))]);
  return new Map(
    perfis.map((p) => {
      const { foto, capa } = imagens.get(p.empresaId);
      return [
        p.id,
        {
          id: p.empresaId,
          nome: nome.get(p.empresaId) ?? "Empresa",
          logo: p.logo ?? "",
          foto,
          capa,
          site: p.site ?? "",
          localizacao: p.localizacao ?? "",
          premium: premium.has(p.empresaId),
        },
      ];
    })
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
  nivel: v.nivel ?? "",
  beneficios: v.beneficios ?? "",
  salario: v.salario === null || v.salario === undefined ? null : Number(v.salario),
  salarioMax: v.salarioMax === null || v.salarioMax === undefined ? null : Number(v.salarioMax),
  dataPublicacao: v.dataPublicacao,
  status: v.status ?? "Aberta",
  empresa,
});

// GET /api/vagas — vagas abertas
export const listar = comTratamento(async (req, res) => {
  const vagas = await Vaga.findAll({ where: { status: "Aberta" }, order: [["dataPublicacao", "DESC"], ["id", "DESC"]], limit: 200 });
  const empresas = await empresasDas(vagas);
  // Premium: vagas de empresas assinantes aparecem primeiro (mais visibilidade).
  const lista = vagas.map((v) => vagaPublica(v, empresas.get(v.perfilEmpresaId)));
  lista.sort((a, b) => Number(Boolean(b.empresa?.premium)) - Number(Boolean(a.empresa?.premium)));
  return res.json({ vagas: lista });
});

// GET /api/vagas/empresas/:id — perfil público de uma empresa e as vagas abertas dela.
export const empresaPublica = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const conta = id && (await Empresa.findByPk(id));
  if (!conta || conta.suspensaEm) return erro(res, 404, "Empresa não encontrada.");
  const p = await PerfilEmpresa.findOne({ where: { empresaId: id } });
  const vagas = p ? await Vaga.findAll({ where: { perfilEmpresaId: p.id, status: "Aberta" }, order: [["dataPublicacao", "DESC"], ["id", "DESC"]] }) : [];
  const [imagens, premium] = await Promise.all([imagensDe("empresa", [id]), contasPremium("empresa", [id])]);
  const empresa = {
    id,
    nome: conta.nome,
    foto: imagens.get(id).foto,
    capa: imagens.get(id).capa,
    logo: p?.logo ?? "",
    descricao: p?.descricao ?? "",
    areaAtuacao: p?.areaAtuacao ?? "",
    localizacao: p?.localizacao ?? "",
    site: p?.site ?? "",
    linkedin: p?.linkedin ?? "",
    emailContato: p?.emailContato ?? "",
    informacoes: p?.informacoes ?? "",
    premium: premium.has(id),
  };
  const dadosEmpresa = { id, nome: conta.nome, logo: empresa.logo, foto: empresa.foto, capa: empresa.capa, site: empresa.site, localizacao: empresa.localizacao, premium: empresa.premium };
  return res.json({ empresa, vagas: vagas.map((v) => vagaPublica(v, dadosEmpresa)) });
});

// GET /api/vagas/:id — também mostra vagas pausadas/encerradas (com o status)
export const ver = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const vaga = id && (await Vaga.findByPk(id));
  // Rascunho não é público.
  if (!vaga || vaga.status === "Rascunho") return erro(res, 404, "Vaga não encontrada.");
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
  // Currículo do perfil, se ela escolheu enviar (vai uma cópia, que não muda depois).
  const curriculo = req.body.incluirCurriculo === true ? await CurriculoCandidata.findOne({ where: { usuariaId: eu(req) } }) : null;
  if (req.body.incluirCurriculo === true && !curriculo) return erro(res, 400, "Envie um currículo no seu perfil antes de anexá-lo.", "curriculo");

  let cand;
  try {
    cand = await Candidatura.create({ usuariaId: eu(req), vagaId, data: hoje(), status: "Recebida" });
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") return erro(res, 409, "Você já se candidatou a esta vaga.");
    throw e;
  }
  await CandidaturaEnvio.create({ candidaturaId: cand.id, titulo: titulo || null, competencias: competencias || null, apresentacao: apresentacao || null, links: JSON.stringify(links) });
  if (curriculo) {
    await CandidaturaCurriculo.create({ candidaturaId: cand.id, nomeArquivo: curriculo.nomeArquivo, mime: curriculo.mime, tamanho: curriculo.tamanho, dados: curriculo.dados });
  }
  const [perfilEmpresa, candidata] = await Promise.all([PerfilEmpresa.findByPk(vaga.perfilEmpresaId), Usuaria.findByPk(eu(req))]);
  if (perfilEmpresa) {
    await notificar({
      tipoConta: "empresa",
      contaId: perfilEmpresa.empresaId,
      tipo: "candidatura",
      texto: `Nova candidatura de ${candidata?.nome ?? "uma candidata"} para ${vaga.titulo}.`,
      link: `/empresa/candidaturas/${cand.id}`,
    });
  }
  return res.status(201).json({ candidatura: { id: cand.id, vagaId, data: cand.data, status: cand.status, comCurriculo: Boolean(curriculo) } });
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

// Etapas em que a candidata ainda pode desistir. Depois de aprovada ou
// reprovada o processo acabou, e a candidatura fica como histórico.
const PODE_RETIRAR = ["Recebida", "Em análise", "Em entrevista"];

// DELETE /api/candidaturas/:id — a candidata retira a candidatura. Apaga a
// candidatura e o que foi enviado com ela (apresentação, cópia do currículo e a
// conversa com a empresa), e avisa a empresa. Depois ela pode se candidatar de
// novo, se a vaga continuar aberta.
export const retirar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const cand = id && (await Candidatura.findOne({ where: { id, usuariaId: eu(req) } }));
  if (!cand) return erro(res, 404, "Candidatura não encontrada.");
  if (!PODE_RETIRAR.includes(cand.status)) {
    return erro(res, 400, `Esta candidatura já foi ${cand.status.toLowerCase()} e não pode mais ser retirada.`);
  }

  const vaga = await Vaga.findByPk(cand.vagaId);
  await sequelize.transaction(async (transaction) => {
    const conversa = await Conversa.findOne({ where: { candidaturaId: cand.id }, transaction });
    if (conversa) {
      await Mensagem.destroy({ where: { conversaId: conversa.id }, transaction });
      await conversa.destroy({ transaction });
    }
    await CandidaturaEnvio.destroy({ where: { candidaturaId: cand.id }, transaction });
    await CandidaturaCurriculo.destroy({ where: { candidaturaId: cand.id }, transaction });
    await cand.destroy({ transaction });
  });

  const perfilEmpresa = vaga && (await PerfilEmpresa.findByPk(vaga.perfilEmpresaId));
  if (perfilEmpresa) {
    const candidata = await Usuaria.findByPk(eu(req));
    await notificar({
      tipoConta: "empresa",
      contaId: perfilEmpresa.empresaId,
      tipo: "candidatura",
      texto: `${candidata?.nome ?? "Uma candidata"} retirou a candidatura para ${vaga.titulo}.`,
      link: `/empresa/vagas/${vaga.id}`,
    });
  }
  return res.json({ ok: true, podeCandidatarDeNovo: (vaga?.status ?? "Aberta") === "Aberta" });
});
