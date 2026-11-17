import { Op } from "sequelize";
import { Usuaria } from "../models/index.js";
import { PerfilComunidade } from "../models/Comunidade.js";
import { imagensDe } from "../models/Imagem.js";
import { Notificacao } from "../models/Interacao.js";
import { Bloqueio, ConversaDireta, MensagemDireta } from "../models/RedeSocial.js";
import { sequelize } from "../config/database.js";
import * as Chat from "../services/chat.js";
import { notificar } from "../services/notificacoes.js";
import { perfisOcultos } from "../services/privacidade.js";

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const LIMITE = 1000;
const POR_PAGINA = 50;
const eu = (req) => req.auth.sub;
const outra = (c, meuId) => (c.usuariaA === meuId ? c.usuariaB : c.usuariaA);
const minhas = (meuId) => ({ [Op.or]: [{ usuariaA: meuId }, { usuariaB: meuId }] });

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

async function participantes(ids) {
  const lista = ids.length ? ids : [0];
  const [contas, fotos, perfis] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: lista } } }),
    imagensDe("usuaria", ids),
    PerfilComunidade.findAll({ attributes: ["usuariaId", "area"], where: { usuariaId: { [Op.in]: lista } } }),
  ]);
  const nome = new Map(contas.map((c) => [c.id, c.nome]));
  const area = new Map(perfis.map((p) => [p.usuariaId, p.area]));
  return new Map(ids.map((id) => [id, { id, nome: nome.get(id) ?? "Conta removida", foto: fotos.get(id)?.foto ?? null, area: area.get(id) || null }]));
}

const mensagemJson = (m, meuId, imagem = null) => ({
  id: m.id,
  texto: m.apagadaEm ? "" : m.texto,
  apagada: Boolean(m.apagadaEm),
  imagem: m.apagadaEm ? null : imagem,
  minha: m.autoraId === meuId,
  enviadaEm: m.enviadaEm,
  lida: Boolean(m.lidaEm),
  lidaEm: m.lidaEm ?? null,
});

export const listar = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversas = await ConversaDireta.findAll({ where: minhas(meuId), order: [["atualizadaEm", "DESC"]], limit: 100 });
  const ids = conversas.map((c) => c.id);
  const [pessoas, mensagens] = await Promise.all([
    participantes(conversas.map((c) => outra(c, meuId))),
    ids.length ? MensagemDireta.findAll({ where: { conversaId: { [Op.in]: ids } }, order: [["enviadaEm", "DESC"], ["id", "DESC"]] }) : [],
  ]);
  const ultimas = conversas.map((c) => mensagens.find((m) => m.conversaId === c.id)).filter(Boolean);
  const [fotos, bloqueios] = await Promise.all([Chat.imagensDe("direta", ultimas.map((m) => m.id)), Chat.bloqueadasPor(meuId)]);
  const lista = conversas.map((c) => {
    const delas = mensagens.filter((m) => m.conversaId === c.id);
    const ultima = delas[0];
    const outraId = outra(c, meuId);
    return {
      id: c.id,
      participante: pessoas.get(outraId),
      bloqueada: bloqueios.euBloqueei.has(outraId) || bloqueios.meBloquearam.has(outraId),
      ultimaMensagem: ultima ? Chat.previa(ultima, ultima.autoraId === meuId, fotos.get(ultima.id)) : "Conversa iniciada",
      ultimaEm: ultima?.enviadaEm ?? c.criadaEm,
      ultimaMinha: Boolean(ultima && ultima.autoraId === meuId),
      ultimaLida: Boolean(ultima?.lidaEm),
      atualizadaEm: c.atualizadaEm,
      naoLidas: delas.filter((m) => m.autoraId !== meuId && !m.lidaEm && !m.apagadaEm).length,
    };
  });
  return res.json({ conversas: lista, naoLidas: lista.reduce((t, c) => t + c.naoLidas, 0) });
});

export const abrir = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const outraId = idParam(req.body?.usuariaId);
  if (!outraId || !(await Usuaria.findByPk(outraId))) return erro(res, 404, "Integrante não encontrada.");
  if (outraId === meuId) return erro(res, 400, "Você não pode conversar com você mesma.");

  const [usuariaA, usuariaB] = [Math.min(meuId, outraId), Math.max(meuId, outraId)];
  const existente = await ConversaDireta.findOne({ where: { usuariaA, usuariaB } });
  if (existente) return res.json({ conversa: { id: existente.id } });
  if ((await perfisOcultos()).has(outraId)) return erro(res, 404, "Integrante não encontrada.");
  const bloqueio = await Chat.bloqueioEntre(meuId, outraId);
  if (bloqueio.euBloqueei) return erro(res, 403, "Você bloqueou esta integrante. Desbloqueie para conversar.");
  if (bloqueio.meBloqueou) return erro(res, 403, "Não é possível conversar com esta integrante.");
  try {
    const criada = await ConversaDireta.create({ usuariaA, usuariaB });
    return res.status(201).json({ conversa: { id: criada.id } });
  } catch (e) {
    if (e.name !== "SequelizeUniqueConstraintError") throw e;
    const c = await ConversaDireta.findOne({ where: { usuariaA, usuariaB } });
    return res.json({ conversa: { id: c.id } });
  }
});

async function minhaConversa(req) {
  const id = idParam(req.params.id);
  return id ? ConversaDireta.findOne({ where: { id, ...minhas(eu(req)) } }) : null;
}

export const ler = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  await MensagemDireta.update({ lidaEm: new Date() }, { where: { conversaId: conversa.id, autoraId: { [Op.ne]: meuId }, lidaEm: { [Op.is]: null } } });
  await Notificacao.update(
    { lidaEm: new Date() },
    { where: { tipoConta: "usuaria", contaId: meuId, chave: `direta-${conversa.id}`, lidaEm: { [Op.is]: null } } }
  );

  const antes = idParam(req.query.antes);
  const depois = idParam(req.query.depois);
  const where = { conversaId: conversa.id };
  let mensagens;
  let temMais = false;
  if (depois) {
    where.id = { [Op.gt]: depois };
    mensagens = await MensagemDireta.findAll({ where, order: [["id", "ASC"]], limit: 200 });
  } else {
    if (antes) where.id = { [Op.lt]: antes };
    const linhas = await MensagemDireta.findAll({ where, order: [["id", "DESC"]], limit: POR_PAGINA + 1 });
    temMais = linhas.length > POR_PAGINA;
    mensagens = linhas.slice(0, POR_PAGINA).reverse();
  }
  const [pessoas, ultimaLida, fotos, bloqueio] = await Promise.all([
    participantes([outra(conversa, meuId)]),
    MensagemDireta.findOne({ where: { conversaId: conversa.id, autoraId: meuId, lidaEm: { [Op.ne]: null } }, order: [["id", "DESC"]] }),
    Chat.imagensDe("direta", mensagens.map((m) => m.id)),
    Chat.bloqueioEntre(meuId, outra(conversa, meuId)),
  ]);
  return res.json({
    conversa: { id: conversa.id, participante: pessoas.get(outra(conversa, meuId)), bloqueio: bloqueio.euBloqueei ? "eu" : bloqueio.meBloqueou ? "ela" : null },
    mensagens: mensagens.map((m) => mensagemJson(m, meuId, fotos.get(m.id))),
    temMais,
    lidasAte: ultimaLida?.id ?? null,
  });
});

export const enviar = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const lida = Chat.lerMensagem(req.body, LIMITE);
  if (lida.falha) return erro(res, 400, ...lida.falha);
  const bloqueio = await Chat.bloqueioEntre(meuId, outra(conversa, meuId));
  if (bloqueio.euBloqueei) return erro(res, 403, "Você bloqueou esta integrante. Desbloqueie para enviar mensagens.");
  if (bloqueio.meBloqueou) return erro(res, 403, "Não é possível enviar mensagens para esta integrante.");

  const [mensagem, imagem] = await sequelize.transaction(async (transaction) => {
    const m = await MensagemDireta.create({ conversaId: conversa.id, autoraId: meuId, texto: lida.texto }, { transaction });
    return [m, await Chat.gravarImagem("direta", m.id, lida.imagem, transaction)];
  });
  await conversa.update({ atualizadaEm: new Date() });
  const remetente = await Usuaria.findByPk(meuId);
  await notificar({
    tipoConta: "usuaria",
    contaId: outra(conversa, meuId),
    tipo: "mensagem",
    texto: `Nova mensagem de ${remetente?.nome ?? "uma integrante"}`,
    link: `/candidata/mensagens/candidatas/${conversa.id}`,
    chave: `direta-${conversa.id}`,
  });
  return res.status(201).json({ mensagem: mensagemJson(mensagem, meuId, imagem) });
});

export const apagar = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const mensagemId = idParam(req.params.mensagemId);
  const mensagem = mensagemId && (await MensagemDireta.findOne({ where: { id: mensagemId, conversaId: conversa.id } }));
  if (!mensagem) return erro(res, 404, "Mensagem não encontrada.");
  if (mensagem.autoraId !== meuId) return erro(res, 403, "Você só pode apagar as suas mensagens.");
  if (!mensagem.apagadaEm) {
    await sequelize.transaction(async (transaction) => {
      await Chat.apagarImagens("direta", [mensagem.id], transaction);
      await mensagem.update({ texto: "", apagadaEm: new Date() }, { transaction });
    });
  }
  return res.json({ mensagem: mensagemJson(mensagem, meuId) });
});

export const bloquear = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  await Bloqueio.findOrCreate({ where: { usuariaId: meuId, bloqueadaId: outra(conversa, meuId) } });
  return res.json({ bloqueio: "eu" });
});

export const desbloquear = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  await Bloqueio.destroy({ where: { usuariaId: meuId, bloqueadaId: outra(conversa, meuId) } });
  const bloqueio = await Chat.bloqueioEntre(meuId, outra(conversa, meuId));
  return res.json({ bloqueio: bloqueio.meBloqueou ? "ela" : null });
});
