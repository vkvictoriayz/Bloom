import { Op } from "sequelize";
import { Empresa, Usuaria } from "../models/index.js";
import { Candidatura, PerfilEmpresa, Vaga } from "../models/Empresarial.js";
import { imagensDe } from "../models/Imagem.js";
import { Conversa, Mensagem, Notificacao } from "../models/Interacao.js";
import { ConversaDireta, MensagemDireta } from "../models/RedeSocial.js";
import { sequelize } from "../config/database.js";
import * as Chat from "../services/chat.js";
import { CATEGORIAS, notificar, preferenciasDe } from "../services/notificacoes.js";
import { PreferenciaNotificacao } from "../models/Premium.js";

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

const minhas = (req) => ({ tipoConta: req.auth.tipo, contaId: req.auth.sub });

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

export const marcarLida = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const [alteradas] = id ? await Notificacao.update({ lidaEm: new Date() }, { where: { id, ...minhas(req), lidaEm: { [Op.is]: null } } }) : [0];
  if (!alteradas && !(id && (await Notificacao.count({ where: { id, ...minhas(req) } })))) return erro(res, 404, "Notificação não encontrada.");
  return res.status(204).end();
});

export const lerPreferencias = comTratamento(async (req, res) => {
  return res.json({ preferencias: await preferenciasDe(req.auth.tipo, req.auth.sub) });
});

export const salvarPreferencias = comTratamento(async (req, res) => {
  const tipo = req.auth.tipo;
  const mudancas = {};
  for (const [chave, valor] of Object.entries(req.body ?? {})) {
    if (!CATEGORIAS[tipo].includes(chave)) return erro(res, 400, "Preferência desconhecida.", chave);
    if (typeof valor !== "boolean") return erro(res, 400, "Formato inválido.", chave);
    mudancas[chave] = valor;
  }
  const [linha] = await PreferenciaNotificacao.findOrCreate({ where: minhas(req), defaults: minhas(req) });
  await linha.update({ ...mudancas, atualizadaEm: new Date() });
  return res.json({ preferencias: await preferenciasDe(tipo, req.auth.sub) });
});

export const marcarTodas = comTratamento(async (req, res) => {
  await Notificacao.update({ lidaEm: new Date() }, { where: { ...minhas(req), lidaEm: { [Op.is]: null } } });
  return res.status(204).end();
});

const doTipo = (req) => (req.auth.tipo === "empresa" ? { empresaId: req.auth.sub } : { usuariaId: req.auth.sub });
const outroTipo = (tipo) => (tipo === "empresa" ? "usuaria" : "empresa");
const rotaMensagens = (tipo) => (tipo === "empresa" ? "/empresa/mensagens" : "/candidata/mensagens");

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

export const listarConversas = comTratamento(async (req, res) => {
  const tipo = req.auth.tipo;
  const conversas = await Conversa.findAll({ where: doTipo(req), order: [["atualizadaEm", "DESC"]], limit: 100 });
  const detalhes = await detalhesConversas(conversas, tipo);
  const ids = conversas.map((c) => c.id);
  const mensagens = ids.length ? await Mensagem.findAll({ where: { conversaId: { [Op.in]: ids } }, order: [["enviadaEm", "DESC"], ["id", "DESC"]] }) : [];
  const ultimas = conversas.map((c) => mensagens.find((m) => m.conversaId === c.id)).filter(Boolean);
  const fotos = await Chat.imagensDe("empresa", ultimas.map((m) => m.id));
  return res.json({
    conversas: conversas.map((c) => {
      const delas = mensagens.filter((m) => m.conversaId === c.id);
      return {
        id: c.id,
        ...detalhes.get(c.id),
        ultimaMensagem: delas[0] ? Chat.previa(delas[0], delas[0].autorTipo === tipo, fotos.get(delas[0].id)) : "Conversa iniciada",
        ultimaEm: delas[0]?.enviadaEm ?? c.criadaEm,
        ultimaMinha: Boolean(delas[0] && delas[0].autorTipo === tipo),
        ultimaLida: Boolean(delas[0]?.lidaEm),
        atualizadaEm: c.atualizadaEm,
        naoLidas: delas.filter((m) => m.autorTipo !== tipo && !m.lidaEm && !m.apagadaEm).length,
      };
    }),
  });
});

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

function mensagemJson(m, tipo, imagem = null) {
  return {
    id: m.id,
    texto: m.apagadaEm ? "" : m.texto,
    apagada: Boolean(m.apagadaEm),
    imagem: m.apagadaEm ? null : imagem,
    minha: m.autorTipo === tipo,
    enviadaEm: m.enviadaEm,
    lida: Boolean(m.lidaEm),
    lidaEm: m.lidaEm ?? null,
  };
}

export const lerConversa = comTratamento(async (req, res) => {
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const tipo = req.auth.tipo;
  await Mensagem.update({ lidaEm: new Date() }, { where: { conversaId: conversa.id, autorTipo: outroTipo(tipo), lidaEm: { [Op.is]: null } } });
  await Notificacao.update({ lidaEm: new Date() }, { where: { tipoConta: tipo, contaId: req.auth.sub, chave: `conversa-${conversa.id}`, lidaEm: { [Op.is]: null } } });

  const depois = idParam(req.query.depois);
  const onde = depois ? { conversaId: conversa.id, id: { [Op.gt]: depois } } : { conversaId: conversa.id };
  const mensagens = await Mensagem.findAll({ where: onde, order: [["enviadaEm", "ASC"], ["id", "ASC"]], limit: 500 });
  const ultimaLida = await Mensagem.findOne({ where: { conversaId: conversa.id, autorTipo: tipo, lidaEm: { [Op.ne]: null } }, order: [["id", "DESC"]] });
  const [detalhes, fotos] = await Promise.all([detalhesConversas([conversa], tipo), Chat.imagensDe("empresa", mensagens.map((m) => m.id))]);
  return res.json({
    conversa: { id: conversa.id, ...detalhes.get(conversa.id) },
    mensagens: mensagens.map((m) => mensagemJson(m, tipo, fotos.get(m.id))),
    temMais: false,
    lidasAte: ultimaLida?.id ?? null,
  });
});

export const enviarMensagem = comTratamento(async (req, res) => {
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const lida = Chat.lerMensagem(req.body, LIMITE_MENSAGEM);
  if (lida.falha) return erro(res, 400, ...lida.falha);

  const tipo = req.auth.tipo;
  const [mensagem, imagem] = await sequelize.transaction(async (transaction) => {
    const m = await Mensagem.create({ conversaId: conversa.id, autorTipo: tipo, texto: lida.texto }, { transaction });
    return [m, await Chat.gravarImagem("empresa", m.id, lida.imagem, transaction)];
  });
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

  return res.status(201).json({ mensagem: mensagemJson(mensagem, tipo, imagem) });
});

export const apagarMensagem = comTratamento(async (req, res) => {
  const conversa = await minhaConversa(req);
  if (!conversa) return erro(res, 404, "Conversa não encontrada.");
  const mensagemId = idParam(req.params.mensagemId);
  const mensagem = mensagemId && (await Mensagem.findOne({ where: { id: mensagemId, conversaId: conversa.id } }));
  if (!mensagem) return erro(res, 404, "Mensagem não encontrada.");
  if (mensagem.autorTipo !== req.auth.tipo) return erro(res, 403, "Você só pode apagar as suas mensagens.");
  if (!mensagem.apagadaEm) {
    await sequelize.transaction(async (transaction) => {
      await Chat.apagarImagens("empresa", [mensagem.id], transaction);
      await mensagem.update({ texto: "", apagadaEm: new Date() }, { transaction });
    });
  }
  return res.json({ mensagem: mensagemJson(mensagem, req.auth.tipo) });
});

export const naoLidasMensagens = comTratamento(async (req, res) => {
  const tipo = req.auth.tipo;
  const conversas = await Conversa.findAll({ attributes: ["id"], where: doTipo(req) });
  const empresas = conversas.length
    ? await Mensagem.count({ where: { conversaId: { [Op.in]: conversas.map((c) => c.id) }, autorTipo: outroTipo(tipo), lidaEm: { [Op.is]: null }, apagadaEm: { [Op.is]: null } } })
    : 0;
  let candidatas = 0;
  if (tipo === "usuaria") {
    const meuId = req.auth.sub;
    const diretas = await ConversaDireta.findAll({ attributes: ["id"], where: { [Op.or]: [{ usuariaA: meuId }, { usuariaB: meuId }] } });
    candidatas = diretas.length
      ? await MensagemDireta.count({ where: { conversaId: { [Op.in]: diretas.map((c) => c.id) }, autoraId: { [Op.ne]: meuId }, lidaEm: { [Op.is]: null }, apagadaEm: { [Op.is]: null } } })
      : 0;
  }
  return res.json({ total: empresas + candidatas, empresas, candidatas });
});
