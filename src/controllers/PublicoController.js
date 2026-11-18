import { Op } from "sequelize";
import { Empresa, Usuaria } from "../models/index.js";
import { PerfilEmpresa, Vaga } from "../models/Empresarial.js";
import { imagensDe } from "../models/Imagem.js";
import { contasPremium } from "../models/Premium.js";
import { EmpresaCadastro } from "../models/Verificacao.js";
import { empresasVerificadas } from "../services/representante.js";
import { totaisCandidaturas, vagaPublica } from "./VagaController.js";

const erro = (res, status, mensagem) => res.status(status).json({ erro: mensagem });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const texto = (v) => (typeof v === "string" ? v.trim() : "");
const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

async function empresasVisiveis(where = {}) {
  return Empresa.findAll({ where: { ...where, suspensaEm: { [Op.is]: null } }, order: [["nome", "ASC"]], limit: 500 });
}

async function cartoes(contas) {
  const ids = contas.map((c) => c.id);
  if (!ids.length) return [];
  const [perfis, cadastros, imagens, premium, verificadas] = await Promise.all([
    PerfilEmpresa.findAll({ where: { empresaId: { [Op.in]: ids } } }),
    EmpresaCadastro.findAll({ attributes: ["empresaId", "municipio", "uf"], where: { empresaId: { [Op.in]: ids } } }),
    imagensDe("empresa", ids),
    contasPremium("empresa", ids),
    empresasVerificadas(ids),
  ]);
  const perfilDe = new Map(perfis.map((p) => [p.empresaId, p]));
  const cadastroDe = new Map(cadastros.map((c) => [c.empresaId, c]));
  const vagas = perfis.length
    ? await Vaga.findAll({ attributes: ["id", "perfilEmpresaId", "titulo", "modalidade"], where: { perfilEmpresaId: { [Op.in]: perfis.map((p) => p.id) }, status: "Aberta" }, order: [["dataPublicacao", "DESC"], ["id", "DESC"]] })
    : [];
  return contas.map((c) => {
    const p = perfilDe.get(c.id);
    const cad = cadastroDe.get(c.id);
    const delas = p ? vagas.filter((v) => v.perfilEmpresaId === p.id) : [];
    const cidade = cad?.municipio ? `${cad.municipio.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase())}${cad.uf ? `, ${cad.uf}` : ""}` : "";
    return {
      id: c.id,
      nome: c.nome,
      foto: imagens.get(c.id)?.foto ?? null,
      capa: imagens.get(c.id)?.capa ?? null,
      logo: p?.logo ?? "",
      areaAtuacao: p?.areaAtuacao ?? "",
      localizacao: p?.localizacao || cidade,
      descricao: p?.descricao ?? "",
      site: p?.site ?? "",
      vagasAbertas: delas.length,
      ultimasVagas: delas.slice(0, 2).map((v) => ({ id: v.id, titulo: v.titulo, modalidade: v.modalidade ?? "" })),
      verificada: verificadas.has(c.id),
      premium: premium.has(c.id),
    };
  });
}

export const empresas = comTratamento(async (req, res) => {
  const busca = texto(req.query.busca).toLowerCase().slice(0, 80);
  const area = texto(req.query.area).slice(0, 100);
  const todas = await cartoes(await empresasVisiveis());
  const areas = [...new Set(todas.map((e) => e.areaAtuacao).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const lista = todas
    .filter((e) => !busca || [e.nome, e.areaAtuacao, e.localizacao, e.descricao].some((v) => v.toLowerCase().includes(busca)))
    .filter((e) => !area || e.areaAtuacao === area)
    .filter((e) => req.query.comVagas !== "1" || e.vagasAbertas > 0)
    .sort((a, b) => b.vagasAbertas - a.vagasAbertas || Number(b.premium) - Number(a.premium) || Number(b.verificada) - Number(a.verificada) || a.nome.localeCompare(b.nome, "pt-BR"));
  return res.json({ empresas: lista, areas, total: todas.length });
});

export const empresa = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const conta = id && (await Empresa.findByPk(id));
  if (!conta || conta.suspensaEm) return erro(res, 404, "Empresa não encontrada.");
  const [cartao] = await cartoes([conta]);
  const p = await PerfilEmpresa.findOne({ where: { empresaId: id } });
  const vagas = p ? await Vaga.findAll({ where: { perfilEmpresaId: p.id, status: "Aberta" }, order: [["dataPublicacao", "DESC"], ["id", "DESC"]] }) : [];
  const totais = await totaisCandidaturas(vagas);
  const dadosEmpresa = { id, nome: conta.nome, logo: cartao.logo, foto: cartao.foto, capa: cartao.capa, site: cartao.site, localizacao: cartao.localizacao, premium: cartao.premium };
  return res.json({
    empresa: { ...cartao, linkedin: p?.linkedin ?? "", emailContato: p?.emailContato ?? "", informacoes: p?.informacoes ?? "" },
    vagas: vagas.map((v) => vagaPublica(v, dadosEmpresa, totais.get(v.id))),
  });
});

export const resumo = comTratamento(async (req, res) => {
  const visiveis = await empresasVisiveis();
  const perfis = visiveis.length ? await PerfilEmpresa.findAll({ attributes: ["id"], where: { empresaId: { [Op.in]: visiveis.map((e) => e.id) } } }) : [];
  const [vagasAbertas, integrantes] = await Promise.all([
    perfis.length ? Vaga.count({ where: { status: "Aberta", perfilEmpresaId: { [Op.in]: perfis.map((p) => p.id) } } }) : 0,
    Usuaria.count({ where: { suspensaEm: { [Op.is]: null } } }),
  ]);
  return res.json({ empresas: visiveis.length, vagasAbertas, integrantes });
});
