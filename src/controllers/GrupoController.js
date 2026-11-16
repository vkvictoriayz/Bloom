import { fn, col, Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Publicacao } from "../models/Comunidade.js";
import { Comunidade, ComunidadeMembro, ComunidadePublicacao } from "../models/Grupos.js";
import { imagensDe } from "../models/Imagem.js";
import { Usuaria } from "../models/index.js";
import { perfisOcultos } from "../services/privacidade.js";
import { contasSuspensas } from "../services/suspensao.js";
import { iconeValido } from "../services/icones.js";
import { gravarImagem, lerPublicacao, montarPublicacoes } from "./ComunidadeController.js";

// Comunidades temáticas. Leitura: candidatas e empresas. Criar, participar,
// publicar e excluir: só candidatas (exigirLogin nas rotas).

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const souCandidata = (req) => req.auth.tipo === "usuaria";
const LIMITE_CRIADAS = 5;

const comTratamento = (fn_) => async (req, res) => {
  try {
    return await fn_(req, res);
  } catch (e) {
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

async function contagens(ids) {
  if (!ids.length) return new Map();
  const linhas = await ComunidadeMembro.findAll({
    attributes: ["comunidadeId", [fn("COUNT", col("id_membro")), "total"]],
    where: { comunidadeId: { [Op.in]: ids } },
    group: ["comunidadeId"],
    raw: true,
  });
  return new Map(linhas.map((l) => [l.comunidadeId, Number(l.total)]));
}

function comunidadeJson(c, { participantes = 0, participando = false, minha = false } = {}) {
  return { id: c.id, nome: c.nome, tema: c.tema, descricao: c.descricao, icone: c.icone ?? null, criadaEm: c.criadaEm, participantes, participando, minha };
}

// GET /api/comunidades
export const listar = comTratamento(async (req, res) => {
  const lista = await Comunidade.findAll({ order: [["nome", "ASC"]], limit: 200 });
  const ids = lista.map((c) => c.id);
  const [totais, minhas] = await Promise.all([
    contagens(ids),
    souCandidata(req) && ids.length ? ComunidadeMembro.findAll({ where: { usuariaId: req.auth.sub, comunidadeId: { [Op.in]: ids } } }) : [],
  ]);
  const participo = new Set(minhas.map((m) => m.comunidadeId));
  const comunidades = lista
    .map((c) =>
      comunidadeJson(c, {
        participantes: totais.get(c.id) ?? 0,
        participando: participo.has(c.id),
        minha: souCandidata(req) && c.criadoraId === req.auth.sub,
      })
    )
    // As mais movimentadas primeiro.
    .sort((a, b) => b.participantes - a.participantes || a.nome.localeCompare(b.nome, "pt-BR"));
  return res.json({ comunidades });
});

function lerComunidade(body = {}) {
  const nome = texto(body.nome);
  const tema = texto(body.tema);
  const descricao = texto(body.descricao);
  if (nome.length < 3 || nome.length > 80) return [null, ["O nome deve ter de 3 a 80 caracteres.", "nome"]];
  if (tema.length < 2 || tema.length > 60) return [null, ["Informe o tema (até 60 caracteres).", "tema"]];
  if (descricao.length < 10 || descricao.length > 500) return [null, ["Descreva a comunidade (de 10 a 500 caracteres).", "descricao"]];
  const icone = texto(body.icone);
  if (icone && !iconeValido(icone, "comunidade")) return [null, ["Escolha um dos ícones da lista.", "icone"]];
  return [{ nome, tema, descricao, icone: icone || null }];
}

// POST /api/comunidades { nome, tema, descricao, icone? }
export const criar = comTratamento(async (req, res) => {
  const [dados, falha] = lerComunidade(req.body);
  if (!dados) return erro(res, 400, ...falha);
  if ((await Comunidade.count({ where: { criadoraId: req.auth.sub } })) >= LIMITE_CRIADAS) {
    return erro(res, 400, `Cada integrante pode criar até ${LIMITE_CRIADAS} comunidades.`);
  }
  if (await Comunidade.findOne({ where: { nome: dados.nome } })) return erro(res, 409, "Já existe uma comunidade com esse nome.", "nome");
  try {
    const comunidade = await sequelize.transaction(async (transaction) => {
      const c = await Comunidade.create({ ...dados, criadoraId: req.auth.sub }, { transaction });
      await ComunidadeMembro.create({ comunidadeId: c.id, usuariaId: req.auth.sub }, { transaction });
      return c;
    });
    return res.status(201).json({ comunidade: comunidadeJson(comunidade, { participantes: 1, participando: true, minha: true }) });
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") return erro(res, 409, "Já existe uma comunidade com esse nome.", "nome");
    throw e;
  }
});

// GET /api/comunidades/:id — dados, participantes e publicações.
export const ver = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");

  const [membros, vinculos, ocultos] = await Promise.all([
    ComunidadeMembro.findAll({ where: { comunidadeId: id }, order: [["entrouEm", "ASC"]] }),
    ComunidadePublicacao.findAll({ where: { comunidadeId: id }, order: [["id", "DESC"]], limit: 30 }),
    perfisOcultos(),
  ]);
  const meuId = souCandidata(req) ? req.auth.sub : null;
  // Quem escondeu o perfil não aparece na lista (a não ser para ela mesma).
  const visiveis = membros.filter((m) => !ocultos.has(m.usuariaId) || m.usuariaId === meuId);
  const [contas, fotos] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: visiveis.map((m) => m.usuariaId) } } }),
    imagensDe("usuaria", visiveis.map((m) => m.usuariaId)),
  ]);
  const nome = new Map(contas.map((c) => [c.id, c.nome]));
  const suspensas = await contasSuspensas("usuaria");
  const pubs = (
    vinculos.length
      ? await Publicacao.findAll({ where: { id: { [Op.in]: vinculos.map((v) => v.publicacaoId) } }, order: [["criadaEm", "DESC"], ["id", "DESC"]] })
      : []
  ).filter((p) => !suspensas.has(p.usuariaId) || p.usuariaId === meuId);

  return res.json({
    comunidade: comunidadeJson(comunidade, {
      participantes: membros.length,
      participando: Boolean(meuId && membros.some((m) => m.usuariaId === meuId)),
      minha: comunidade.criadoraId === meuId,
    }),
    participantes: visiveis
      .filter((m) => nome.has(m.usuariaId))
      .map((m) => ({ id: m.usuariaId, nome: nome.get(m.usuariaId), foto: fotos.get(m.usuariaId)?.foto ?? null, criadora: m.usuariaId === comunidade.criadoraId })),
    publicacoes: await montarPublicacoes(pubs, meuId ?? -1),
  });
});

// POST /api/comunidades/:id/participar — entra ou sai (alterna).
export const participar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  const existente = await ComunidadeMembro.findOne({ where: { comunidadeId: id, usuariaId: req.auth.sub } });
  if (existente) {
    if (comunidade.criadoraId === req.auth.sub) {
      return erro(res, 400, "Você criou esta comunidade. Para sair, exclua a comunidade.");
    }
    await existente.destroy();
  } else {
    await ComunidadeMembro.create({ comunidadeId: id, usuariaId: req.auth.sub });
  }
  return res.json({ participando: !existente, participantes: await ComunidadeMembro.count({ where: { comunidadeId: id } }) });
});

// POST /api/comunidades/:id/publicacoes { texto, tipo, imagem? } — só participantes.
export const publicar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id || !(await Comunidade.findByPk(id))) return erro(res, 404, "Comunidade não encontrada.");
  if (!(await ComunidadeMembro.findOne({ where: { comunidadeId: id, usuariaId: req.auth.sub } }))) {
    return erro(res, 403, "Participe da comunidade para publicar nela.");
  }
  const lida = lerPublicacao(req.body);
  if (lida.falha) return erro(res, 400, ...lida.falha);

  const criada = await sequelize.transaction(async (transaction) => {
    const p = await Publicacao.create({ usuariaId: req.auth.sub, tipo: lida.tipo, texto: lida.conteudo }, { transaction });
    await ComunidadePublicacao.create({ comunidadeId: id, publicacaoId: p.id }, { transaction });
    await gravarImagem(p.id, lida.imagem ?? undefined, transaction);
    return p;
  });
  const [publicacao] = await montarPublicacoes([criada], req.auth.sub);
  return res.status(201).json({ publicacao });
});

// PUT /api/comunidades/:id { icone } — só quem criou troca o ícone
// (null volta para a inicial do nome).
export const atualizar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  if (comunidade.criadoraId !== req.auth.sub) return erro(res, 403, "Só quem criou a comunidade pode alterá-la.");
  const icone = req.body?.icone === null ? null : texto(req.body?.icone);
  if (icone !== null && !iconeValido(icone, "comunidade")) return erro(res, 400, "Escolha um dos ícones da lista.", "icone");
  await comunidade.update({ icone });
  const participantes = await ComunidadeMembro.count({ where: { comunidadeId: id } });
  return res.json({ comunidade: comunidadeJson(comunidade, { participantes, participando: true, minha: true }) });
});

// DELETE /api/comunidades/:id — só quem criou. As publicações continuam no
// feed, sem o vínculo com a comunidade.
export const excluir = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  if (comunidade.criadoraId !== req.auth.sub) return erro(res, 403, "Só quem criou a comunidade pode excluí-la.");
  await sequelize.transaction(async (transaction) => {
    await ComunidadePublicacao.destroy({ where: { comunidadeId: id }, transaction });
    await ComunidadeMembro.destroy({ where: { comunidadeId: id }, transaction });
    await comunidade.destroy({ transaction });
  });
  return res.status(204).end();
});
