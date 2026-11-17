import { fn, col, Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Publicacao } from "../models/Comunidade.js";
import { Comunidade, ComunidadeCapa, ComunidadeMembro, ComunidadePublicacao } from "../models/Grupos.js";
import { imagensDe } from "../models/Imagem.js";
import { Usuaria } from "../models/index.js";
import { notificar } from "../services/notificacoes.js";
import { perfisOcultos } from "../services/privacidade.js";
import { contasSuspensas } from "../services/suspensao.js";
import { iconeValido } from "../services/icones.js";
import { lerImagem, novaChave } from "../utils/imagem.js";
import { gravarImagem, lerPublicacao, montarPublicacoes } from "./ComunidadeController.js";

// Comunidades temáticas. Leitura: candidatas e empresas. Criar, participar,
// publicar, editar e excluir: só candidatas (exigirLogin nas rotas).

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const souCandidata = (req) => req.auth.tipo === "usuaria";
const LIMITE_CRIADAS = 5;
const LIMITE_CAPA = 1024 * 1024; // 1 MB, como as capas de perfil
const POR_PAGINA = 20;
const SEMANA = 7 * 24 * 60 * 60 * 1000;
const AMOSTRA = 4; // fotos de participantes mostradas no cartão

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

// Atividade de cada comunidade: publicações na última semana e a data da
// publicação mais recente (de contas não suspensas).
async function atividade(ids) {
  if (!ids.length) return new Map();
  const suspensas = [...(await contasSuspensas("usuaria"))];
  const [linhas] = await sequelize.query(
    `SELECT cp.id_comunidade AS id,
            SUM(p.criada_em >= :desde) AS semana,
            MAX(p.criada_em) AS ultima
       FROM COMUNIDADE_PUBLICACAO cp
       JOIN PUBLICACAO p ON p.id_publicacao = cp.id_publicacao
      WHERE cp.id_comunidade IN (:ids) ${suspensas.length ? "AND p.id_usuario NOT IN (:suspensas)" : ""}
      GROUP BY cp.id_comunidade`,
    { replacements: { ids, desde: new Date(Date.now() - SEMANA), suspensas } }
  );
  return new Map(linhas.map((l) => [l.id, { publicacoesSemana: Number(l.semana) || 0, ultimaAtividade: l.ultima }]));
}

// Algumas participantes (perfil visível) de cada comunidade, para o cartão.
async function amostras(ids, meuId) {
  if (!ids.length) return new Map();
  const [membros, ocultos] = await Promise.all([
    ComunidadeMembro.findAll({ where: { comunidadeId: { [Op.in]: ids } }, order: [["entrouEm", "DESC"]] }),
    perfisOcultos(),
  ]);
  const suspensas = await contasSuspensas("usuaria");
  const porComunidade = new Map();
  for (const m of membros) {
    if ((ocultos.has(m.usuariaId) && m.usuariaId !== meuId) || suspensas.has(m.usuariaId)) continue;
    const lista = porComunidade.get(m.comunidadeId) ?? [];
    if (lista.length < AMOSTRA) lista.push(m.usuariaId);
    porComunidade.set(m.comunidadeId, lista);
  }
  const usuarias = [...new Set([...porComunidade.values()].flat())];
  const [contas, fotos] = await Promise.all([
    usuarias.length ? Usuaria.findAll({ where: { id: { [Op.in]: usuarias } } }) : [],
    imagensDe("usuaria", usuarias),
  ]);
  const nome = new Map(contas.map((c) => [c.id, c.nome]));
  return new Map(
    [...porComunidade].map(([id, lista]) => [id, lista.filter((u) => nome.has(u)).map((u) => ({ id: u, nome: nome.get(u), foto: fotos.get(u)?.foto ?? null }))])
  );
}

async function capas(ids) {
  if (!ids.length) return new Map();
  const linhas = await ComunidadeCapa.findAll({ attributes: ["comunidadeId", "chave"], where: { comunidadeId: { [Op.in]: ids } } });
  return new Map(linhas.map((l) => [l.comunidadeId, l.chave]));
}

function comunidadeJson(c, { participantes = 0, participando = false, minha = false, capa = null, atividade: atv = null, amostra = [] } = {}) {
  return {
    id: c.id,
    nome: c.nome,
    tema: c.tema,
    descricao: c.descricao,
    regras: c.regras ?? "",
    icone: c.icone ?? null,
    capa,
    criadaEm: c.criadaEm,
    participantes,
    participando,
    minha,
    publicacoesSemana: atv?.publicacoesSemana ?? 0,
    ultimaAtividade: atv?.ultimaAtividade ?? null,
    amostra,
  };
}

// GET /api/comunidades?filtro=minhas|descobrir&busca=
export const listar = comTratamento(async (req, res) => {
  const meuId = souCandidata(req) ? req.auth.sub : null;
  const busca = texto(req.query.busca).toLowerCase().slice(0, 80);
  const filtro = ["minhas", "descobrir"].includes(req.query.filtro) ? req.query.filtro : "";

  const todas = await Comunidade.findAll({ order: [["nome", "ASC"]], limit: 200 });
  const ids = todas.map((c) => c.id);
  const minhasLinhas = meuId && ids.length ? await ComunidadeMembro.findAll({ where: { usuariaId: meuId, comunidadeId: { [Op.in]: ids } } }) : [];
  const participo = new Set(minhasLinhas.map((m) => m.comunidadeId));

  const lista = todas.filter((c) => {
    if (filtro === "minhas" && !participo.has(c.id)) return false;
    if (filtro === "descobrir" && participo.has(c.id)) return false;
    if (busca && ![c.nome, c.tema, c.descricao].some((v) => v.toLowerCase().includes(busca))) return false;
    return true;
  });
  const visiveis = lista.map((c) => c.id);
  const [totais, atividades, fotos, chaves] = await Promise.all([contagens(visiveis), atividade(visiveis), amostras(visiveis, meuId), capas(visiveis)]);

  const comunidades = lista
    .map((c) =>
      comunidadeJson(c, {
        participantes: totais.get(c.id) ?? 0,
        participando: participo.has(c.id),
        minha: Boolean(meuId) && c.criadoraId === meuId,
        capa: chaves.get(c.id) ?? null,
        atividade: atividades.get(c.id),
        amostra: fotos.get(c.id) ?? [],
      })
    )
    // As mais movimentadas primeiro.
    .sort((a, b) => b.participantes - a.participantes || b.publicacoesSemana - a.publicacoesSemana || a.nome.localeCompare(b.nome, "pt-BR"));
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

// GET /api/comunidades/:id?pagina=1 — dados, criadora, participantes e
// publicações (20 por página; "temMais" diz se há mais).
export const ver = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const meuId = souCandidata(req) ? req.auth.sub : null;

  const [membros, ocultos, suspensas] = await Promise.all([
    ComunidadeMembro.findAll({ where: { comunidadeId: id }, order: [["entrouEm", "ASC"]] }),
    perfisOcultos(),
    contasSuspensas("usuaria"),
  ]);
  // Quem escondeu o perfil não aparece na lista (a não ser para ela mesma);
  // conta suspensa também não.
  const visiveis = membros.filter((m) => (!ocultos.has(m.usuariaId) || m.usuariaId === meuId) && !suspensas.has(m.usuariaId));
  const [contas, fotos] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: visiveis.map((m) => m.usuariaId).concat(comunidade.criadoraId) } } }),
    imagensDe("usuaria", visiveis.map((m) => m.usuariaId).concat(comunidade.criadoraId)),
  ]);
  const nome = new Map(contas.map((c) => [c.id, c.nome]));

  // Publicações da página pedida (sem as de contas suspensas).
  const pubIds = (await ComunidadePublicacao.findAll({ attributes: ["publicacaoId"], where: { comunidadeId: id } })).map((v) => v.publicacaoId);
  const filtroPub = { id: { [Op.in]: pubIds.length ? pubIds : [0] } };
  const semSuspensas = [...suspensas].filter((s) => s !== meuId);
  if (semSuspensas.length) filtroPub.usuariaId = { [Op.notIn]: semSuspensas };
  const linhas = await Publicacao.findAll({ where: filtroPub, order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: POR_PAGINA + 1, offset: (pagina - 1) * POR_PAGINA });
  const [atividades, chaves] = await Promise.all([atividade([id]), capas([id])]);

  const criadoraVisivel = !ocultos.has(comunidade.criadoraId) || comunidade.criadoraId === meuId;
  return res.json({
    comunidade: comunidadeJson(comunidade, {
      participantes: membros.length,
      participando: Boolean(meuId && membros.some((m) => m.usuariaId === meuId)),
      minha: comunidade.criadoraId === meuId,
      capa: chaves.get(id) ?? null,
      atividade: atividades.get(id),
    }),
    criadora:
      criadoraVisivel && nome.has(comunidade.criadoraId)
        ? { id: comunidade.criadoraId, nome: nome.get(comunidade.criadoraId), foto: fotos.get(comunidade.criadoraId)?.foto ?? null }
        : null,
    participantes: visiveis
      .filter((m) => nome.has(m.usuariaId))
      .map((m) => ({
        id: m.usuariaId,
        nome: nome.get(m.usuariaId),
        foto: fotos.get(m.usuariaId)?.foto ?? null,
        criadora: m.usuariaId === comunidade.criadoraId,
        entrouEm: m.entrouEm,
      })),
    publicacoes: await montarPublicacoes(linhas.slice(0, POR_PAGINA), meuId ?? -1),
    temMais: linhas.length > POR_PAGINA,
  });
});

// POST /api/comunidades/:id/participar — entra ou sai (alterna). Quem criou
// recebe um aviso quando alguém entra.
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
    const nova = await Usuaria.findByPk(req.auth.sub);
    await notificar({
      tipoConta: "usuaria",
      contaId: comunidade.criadoraId,
      tipo: "comunidade",
      texto: `${nova?.nome ?? "Uma integrante"} entrou na comunidade ${comunidade.nome}.`,
      link: `/comunidades/${id}?aba=participantes`,
    });
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

// DELETE /api/comunidades/:id/publicacoes/:publicacaoId — quem criou a
// comunidade tira uma publicação dela (moderação). A publicação continua no
// feed e no perfil de quem publicou; só deixa de aparecer na comunidade.
export const tirarPublicacao = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const publicacaoId = idParam(req.params.publicacaoId);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  if (comunidade.criadoraId !== req.auth.sub) return erro(res, 403, "Só quem criou a comunidade pode tirar publicações dela.");
  const vinculo = publicacaoId && (await ComunidadePublicacao.findOne({ where: { comunidadeId: id, publicacaoId } }));
  if (!vinculo) return erro(res, 404, "Publicação não encontrada nesta comunidade.");
  await vinculo.destroy();
  return res.status(204).end();
});

// PUT /api/comunidades/:id { icone?, tema?, descricao?, regras? } — só quem
// criou. Campo ausente não muda; icone null volta para a inicial do nome.
export const atualizar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  if (comunidade.criadoraId !== req.auth.sub) return erro(res, 403, "Só quem criou a comunidade pode alterá-la.");
  const body = req.body ?? {};
  const mudancas = {};

  if ("icone" in body) {
    const icone = body.icone === null ? null : texto(body.icone);
    if (icone !== null && !iconeValido(icone, "comunidade")) return erro(res, 400, "Escolha um dos ícones da lista.", "icone");
    mudancas.icone = icone;
  }
  if ("tema" in body) {
    const tema = texto(body.tema);
    if (tema.length < 2 || tema.length > 60) return erro(res, 400, "Informe o tema (até 60 caracteres).", "tema");
    mudancas.tema = tema;
  }
  if ("descricao" in body) {
    const descricao = texto(body.descricao);
    if (descricao.length < 10 || descricao.length > 500) return erro(res, 400, "Descreva a comunidade (de 10 a 500 caracteres).", "descricao");
    mudancas.descricao = descricao;
  }
  if ("regras" in body) {
    const regras = texto(body.regras);
    if (regras.length > 1000) return erro(res, 400, "As regras podem ter até 1000 caracteres.", "regras");
    mudancas.regras = regras || null;
  }
  await comunidade.update(mudancas);
  const [participantes, chaves, atividades] = await Promise.all([ComunidadeMembro.count({ where: { comunidadeId: id } }), capas([id]), atividade([id])]);
  return res.json({
    comunidade: comunidadeJson(comunidade, { participantes, participando: true, minha: true, capa: chaves.get(id) ?? null, atividade: atividades.get(id) }),
  });
});

// PUT /api/comunidades/:id/capa { imagem: dataURL } | DELETE — só quem criou.
export const enviarCapa = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  if (comunidade.criadoraId !== req.auth.sub) return erro(res, 403, "Só quem criou a comunidade pode trocar a capa.");
  const lida = lerImagem(req.body?.imagem, LIMITE_CAPA);
  if (lida.erro) return erro(res, 400, lida.erro, "capa");
  const valores = { mime: lida.mime, dados: lida.dados, chave: novaChave(), atualizadaEm: new Date() };
  const existente = await ComunidadeCapa.findByPk(id);
  if (existente) await existente.update(valores);
  else await ComunidadeCapa.create({ comunidadeId: id, ...valores });
  return res.json({ capa: valores.chave });
});

export const removerCapa = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comunidade = id && (await Comunidade.findByPk(id));
  if (!comunidade) return erro(res, 404, "Comunidade não encontrada.");
  if (comunidade.criadoraId !== req.auth.sub) return erro(res, 403, "Só quem criou a comunidade pode trocar a capa.");
  await ComunidadeCapa.destroy({ where: { comunidadeId: id } });
  return res.json({ capa: null });
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
    await ComunidadeCapa.destroy({ where: { comunidadeId: id }, transaction });
    await comunidade.destroy({ transaction });
  });
  return res.status(204).end();
});
