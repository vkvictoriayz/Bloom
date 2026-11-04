import { Op } from "sequelize";
import { Empresa, Usuaria } from "../models/index.js";
import { Candidatura, PerfilEmpresa, Vaga } from "../models/Empresarial.js";
import { imagensDe } from "../models/Imagem.js";
import { Conversa, Mensagem, Notificacao } from "../models/Interacao.js";
import { notificar } from "../services/notificacoes.js";

// Notificações e mensagens, para candidatas e empresas. O tipo da conta vem
// do token (req.auth.tipo) e cada consulta filtra pelo dono.

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const LIMITE_MENSAGEM = 1000;

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

// ------------------------------------------------------- Notificações

const minhas = (req) => ({ tipoConta: req.auth.tipo, contaId: req.auth.sub });

// GET /api/notificacoes (com ?resumo=1, só a contagem de não lidas)
export const listarNotificacoes = comTratamento(async (req, res) => {
  if (req.query.resumo === "1") {
    return res.json({ naoLidas: await Notificacao.count({ where: { ...minhas(req), lidaEm: { [Op.is]: null } } }) });
  }
  const [lista, naoLidas] = await Promise.all([
    Notificacao.findAll({ where: minhas(req), order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: 50 }),
    Notificacao.count({ where: { ...minhas(req), lidaEm: { [Op.is]: null } } }),
  ]);
  return res.json({
    naoLidas,
    notificacoes: lista.map((n) => ({ id: n.id, tipo: n.tipo, texto: n.texto, link: n.link, criadaEm: n.criadaEm, lida: Boolean(n.lidaEm) })),
  });
});

// POST /api/notificacoes/:id/lida
export const marcarLida = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const [alteradas] = id ? await Notificacao.update({ lidaEm: new Date() }, { where: { id, ...minhas(req), lidaEm: { [Op.is]: null } } }) : [0];
  if (!alteradas && !(id && (await Notificacao.count({ where: { id, ...minhas(req) } })))) return erro(res, 404, "Notificação não encontrada.");
  return res.status(204).end();
});

// POST /api/notificacoes/lidas — marca todas
export const marcarTodas = comTratamento(async (req, res) => {
  await Notificacao.update({ lidaEm: new Date() }, { where: { ...minhas(req), lidaEm: { [Op.is]: null } } });
  return res.status(204).end();
});

// ----------------------------------------------------------- Mensagens

const doTipo = (req) => (req.auth.tipo === "empresa" ? { empresaId: req.auth.sub } : { usuariaId: req.auth.sub });
const outroTipo = (tipo) => (tipo === "empresa" ? "usuaria" : "empresa");
const rotaMensagens = (tipo) => (tipo === "empresa" ? "/empresa/mensagens" : "/candidata/mensagens");

// Quem está do outro lado (nome e foto) e de qual vaga é a conversa.
async function detalhesConversas(conversas, tipo) {
  if (!conversas.length) return new Map();
  const ids = (campo) => [...new Set(conversas.map((c) => c[campo]))];
  const [usuarias, empresas, candidaturas] = await Promise.all([
    tipo === "empresa" ? Usuaria.findAll({ where: { id: { [Op.in]: ids("usuariaId") } } }) : [],
    tipo === "usuaria" ? Empresa.findAll({ where: { id: { [Op.in]: ids("empresaId") } } }) : [],
    Candidatura.findAll({ where: { id: { [Op.in]: ids("candidaturaId") } } }),
  ]);
  const vagas = await Vaga.findAll({ where: { id: { [Op.in]: candidaturas.map((c) => c.vagaId) } } });
  const fotos = tipo === "empresa" ? await imagensDe("usuaria", ids("usuariaId")) : await imagensDe("empresa", ids("empresaId"));
  const nomeU = new Map(usuarias.map((u) => [u.id, u.nome]));
  const nomeE = new Map(empresas.map((e) => [e.id, e.nome]));
  const vagaDaCandidatura = new Map(candidaturas.map((c) => [c.id, vagas.find((v) => v.id === c.vagaId)?.titulo ?? "Vaga"]));
  return new Map(
    conversas.map((c) => {
      const outroId = tipo === "empresa" ? c.usuariaId : c.empresaId;
      const nome = tipo === "empresa" ? nomeU.get(c.usuariaId) : nomeE.get(c.empresaId);
      return [c.id, { participante: { id: outroId, nome: nome ?? "Conta removida", foto: fotos.get(outroId)?.foto ?? null }, vaga: vagaDaCandidatura.get(c.candidaturaId), candidaturaId: c.candidaturaId }];
    })
  );
}

// GET /api/mensagens
export const listarConversas = comTratamento(async (req, res) => {
  const tipo = req.auth.tipo;
  const conversas = await Conversa.findAll({ where: doTipo(req), order: [["atualizadaEm", "DESC"]], limit: 100 });
  const detalhes = await detalhesConversas(conversas, tipo);
  const ids = conversas.map((c) => c.id);
  const mensagens = ids.length ? await Mensagem.findAll({ where: { conversaId: { [Op.in]: ids } }, order: [["enviadaEm", "DESC"], ["id", "DESC"]] }) : [];
  return res.json({
    conversas: conversas.map((c) => {
      const delas = mensagens.filter((m) => m.conversaId === c.id);
      return {
        id: c.id,
        ...detalhes.get(c.id),
        ultimaMensagem: delas[0]?.texto ?? "Conversa iniciada",
        atualizadaEm: c.atualizadaEm,
        naoLidas: delas.filter((m) => m.autorTipo !== tipo && !m.lidaEm).length,
      };
    }),
  });
});

// POST /api/mensagens { candidaturaId } — abre (ou reabre) a conversa de uma
// candidatura. A candidata só da própria; a empresa só das suas vagas.
export const abrirConversa = comTratamento(async (req, res) => {
  const candidaturaId = idParam(req.body?.candidaturaId);
  const candidatura = candidaturaId && (await Candidatura.findByPk(candidaturaId));
  if (!candidatura) return erro(res, 404, "Candidatura não encontrada.");
  const vaga = await Vaga.findByPk(candidatura.vagaId);
  const perfilEmpresa = vaga && (await PerfilEmpresa.findByPk(vaga.perfilEmpresaId));
  if (!perfilEmpresa) return erro(res, 404, "Candidatura não encontrada.");

  const permitido = req.auth.tipo === "empresa" ? perfilEmpresa.empresaId === req.auth.sub : candidatura.usuariaId === req.auth.sub;
  if (!permitido) return erro(res, 404, "Candidatura não encontrada.");

  const [conversa] = await Conversa.findOrCreate({
    where: { candidaturaId },
    defaults: { candidaturaId, usuariaId: candidatura.usuariaId, empresaId: perfilEmpresa.empresaId },
  });
  return res.json({ conversa: { id: conversa.id } });
});

async function minhaConversa(req) {
  const id = idParam(req.params.id);
  return id ? Conversa.findOne({ where: { id, ...doTipo(req) } }) : null;
}

function mensagemJson(m, tipo) {
  return { id: m.id, texto: m.texto, minha: m.autorTipo === tipo, enviadaEm: m.enviadaEm, lida: Boolean(m.lidaEm) };
}

// GET /api/mensagens/:id — também marca como lidas as mensagens recebidas.
export const lerConversa = comTratamento(async (req, res) => {
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const tipo = req.auth.tipo;
  await Mensagem.update({ lidaEm: new Date() }, { where: { conversaId: conversa.id, autorTipo: outroTipo(tipo), lidaEm: { [Op.is]: null } } });
  // O aviso de "nova mensagem" desta conversa deixa de fazer sentido.
  await Notificacao.update({ lidaEm: new Date() }, { where: { tipoConta: tipo, contaId: req.auth.sub, chave: `conversa-${conversa.id}`, lidaEm: { [Op.is]: null } } });

  const mensagens = await Mensagem.findAll({ where: { conversaId: conversa.id }, order: [["enviadaEm", "ASC"], ["id", "ASC"]], limit: 500 });
  const detalhes = await detalhesConversas([conversa], tipo);
  return res.json({ conversa: { id: conversa.id, ...detalhes.get(conversa.id) }, mensagens: mensagens.map((m) => mensagemJson(m, tipo)) });
});

// POST /api/mensagens/:id { texto }
export const enviarMensagem = comTratamento(async (req, res) => {
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const texto = typeof req.body?.texto === "string" ? req.body.texto.trim() : "";
  if (!texto) return erro(res, 400, "Escreva uma mensagem.", "texto");
  if (texto.length > LIMITE_MENSAGEM) return erro(res, 400, `Use até ${LIMITE_MENSAGEM} caracteres.`, "texto");

  const tipo = req.auth.tipo;
  const mensagem = await Mensagem.create({ conversaId: conversa.id, autorTipo: tipo, texto });
  await conversa.update({ atualizadaEm: new Date() });

  const remetente = tipo === "empresa" ? await Empresa.findByPk(req.auth.sub) : await Usuaria.findByPk(req.auth.sub);
  const destino = outroTipo(tipo);
  await notificar({
    tipoConta: destino,
    contaId: destino === "empresa" ? conversa.empresaId : conversa.usuariaId,
    tipo: "mensagem",
    texto: `Nova mensagem de ${remetente?.nome ?? "uma conta da Bloom"}`,
    link: `${rotaMensagens(destino)}/${conversa.id}`,
    chave: `conversa-${conversa.id}`,
  });

  return res.status(201).json({ mensagem: mensagemJson(mensagem, tipo) });
});
