import { Op } from "sequelize";
import { Usuaria } from "../models/index.js";
import { PerfilComunidade } from "../models/Comunidade.js";
import { imagensDe } from "../models/Imagem.js";
import { Notificacao } from "../models/Interacao.js";
import { ConversaDireta, MensagemDireta } from "../models/RedeSocial.js";
import { notificar } from "../services/notificacoes.js";
import { perfisOcultos } from "../services/privacidade.js";

// Conversas entre candidatas (/api/mensagens/candidatas). Ficam em tabelas
// próprias, separadas das conversas com empresas (CONVERSA/MENSAGEM, que são
// ligadas a uma candidatura). Só as duas participantes leem e escrevem.

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

// Nome, foto e área (do perfil da comunidade) de cada participante.
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

// Mensagem apagada: o texto não sai do servidor.
const mensagemJson = (m, meuId) => ({
  id: m.id,
  texto: m.apagadaEm ? "" : m.texto,
  apagada: Boolean(m.apagadaEm),
  minha: m.autoraId === meuId,
  enviadaEm: m.enviadaEm,
  lida: Boolean(m.lidaEm),
  lidaEm: m.lidaEm ?? null,
});

const previa = (m, meuId) => (m.apagadaEm ? "Mensagem apagada" : `${m.autoraId === meuId ? "Você: " : ""}${m.texto}`);

// GET /api/mensagens/candidatas
export const listar = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversas = await ConversaDireta.findAll({ where: minhas(meuId), order: [["atualizadaEm", "DESC"]], limit: 100 });
  const ids = conversas.map((c) => c.id);
  const [pessoas, mensagens] = await Promise.all([
    participantes(conversas.map((c) => outra(c, meuId))),
    ids.length ? MensagemDireta.findAll({ where: { conversaId: { [Op.in]: ids } }, order: [["enviadaEm", "DESC"], ["id", "DESC"]] }) : [],
  ]);
  const lista = conversas.map((c) => {
    const delas = mensagens.filter((m) => m.conversaId === c.id);
    const ultima = delas[0];
    return {
      id: c.id,
      participante: pessoas.get(outra(c, meuId)),
      ultimaMensagem: ultima ? previa(ultima, meuId) : "Conversa iniciada",
      ultimaEm: ultima?.enviadaEm ?? c.criadaEm,
      // Para os "vistos" na lista: a última foi minha? Já foi lida?
      ultimaMinha: Boolean(ultima && ultima.autoraId === meuId),
      ultimaLida: Boolean(ultima?.lidaEm),
      atualizadaEm: c.atualizadaEm,
      naoLidas: delas.filter((m) => m.autoraId !== meuId && !m.lidaEm && !m.apagadaEm).length,
    };
  });
  return res.json({ conversas: lista, naoLidas: lista.reduce((t, c) => t + c.naoLidas, 0) });
});

// POST /api/mensagens/candidatas { usuariaId } — abre (ou reabre) a conversa
// com outra candidata. Perfil oculto não recebe conversa nova.
export const abrir = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const outraId = idParam(req.body?.usuariaId);
  if (!outraId || !(await Usuaria.findByPk(outraId))) return erro(res, 404, "Integrante não encontrada.");
  if (outraId === meuId) return erro(res, 400, "Você não pode conversar com você mesma.");

  const [usuariaA, usuariaB] = [Math.min(meuId, outraId), Math.max(meuId, outraId)];
  const existente = await ConversaDireta.findOne({ where: { usuariaA, usuariaB } });
  if (existente) return res.json({ conversa: { id: existente.id } });
  if ((await perfisOcultos()).has(outraId)) return erro(res, 404, "Integrante não encontrada.");
  try {
    const criada = await ConversaDireta.create({ usuariaA, usuariaB });
    return res.status(201).json({ conversa: { id: criada.id } });
  } catch (e) {
    // As duas abriram ao mesmo tempo: usa a que já foi criada.
    if (e.name !== "SequelizeUniqueConstraintError") throw e;
    const c = await ConversaDireta.findOne({ where: { usuariaA, usuariaB } });
    return res.json({ conversa: { id: c.id } });
  }
});

async function minhaConversa(req) {
  const id = idParam(req.params.id);
  return id ? ConversaDireta.findOne({ where: { id, ...minhas(eu(req)) } }) : null;
}

// GET /api/mensagens/candidatas/:id[?antes=<id>|?depois=<id>]
// Sem parâmetro: as 50 mais recentes. "antes": 50 anteriores (rolar para
// cima). "depois": só as novas (a tela consulta de tempos em tempos).
// Também marca como lidas as recebidas. "lidasAte" diz até qual mensagem
// minha a outra pessoa já leu (para o "Visto").
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
  const [pessoas, ultimaLida] = await Promise.all([
    participantes([outra(conversa, meuId)]),
    MensagemDireta.findOne({ where: { conversaId: conversa.id, autoraId: meuId, lidaEm: { [Op.ne]: null } }, order: [["id", "DESC"]] }),
  ]);
  return res.json({
    conversa: { id: conversa.id, participante: pessoas.get(outra(conversa, meuId)) },
    mensagens: mensagens.map((m) => mensagemJson(m, meuId)),
    temMais,
    lidasAte: ultimaLida?.id ?? null,
  });
});

// POST /api/mensagens/candidatas/:id { texto }
export const enviar = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const texto = typeof req.body?.texto === "string" ? req.body.texto.trim() : "";
  if (!texto) return erro(res, 400, "Escreva uma mensagem.", "texto");
  if (texto.length > LIMITE) return erro(res, 400, `Use até ${LIMITE} caracteres.`, "texto");

  const mensagem = await MensagemDireta.create({ conversaId: conversa.id, autoraId: meuId, texto });
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
  return res.status(201).json({ mensagem: mensagemJson(mensagem, meuId) });
});

// DELETE /api/mensagens/candidatas/:id/mensagens/:mensagemId — quem enviou
// apaga a própria mensagem. O texto sai do banco; fica "mensagem apagada".
export const apagar = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const mensagemId = idParam(req.params.mensagemId);
  const mensagem = mensagemId && (await MensagemDireta.findOne({ where: { id: mensagemId, conversaId: conversa.id } }));
  if (!mensagem) return erro(res, 404, "Mensagem não encontrada.");
  if (mensagem.autoraId !== meuId) return erro(res, 403, "Você só pode apagar as suas mensagens.");
  if (!mensagem.apagadaEm) await mensagem.update({ texto: "", apagadaEm: new Date() });
  return res.json({ mensagem: mensagemJson(mensagem, meuId) });
});
