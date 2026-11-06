import { Empresa, Usuaria } from "../models/index.js";
import { Assinatura, Campanha, Pagamento, Plano } from "../models/Premium.js";
import {
  buscarPagamentosPorReferencia,
  cancelarAssinatura,
  criarAssinatura,
  criarPreferencia,
  ErroPagamento,
  lerAssinatura,
  lerPagamento,
  lerPagamentoAutorizado,
  pagamentosAtivos,
  webhookAutentico,
} from "../services/mercadopago.js";
import { notificar } from "../services/notificacoes.js";

// Bloom Premium (candidatas e empresas). Regras:
//  - planos e preços vêm da tabela PLANO (tabela de preços da Bloom);
//  - nada fica "ativo" ou "pago" sem confirmação do Mercado Pago: o status é
//    sempre lido na API dele (webhook ou sincronização), nunca do navegador.

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const minha = (req) => ({ tipoConta: req.auth.tipo, contaId: req.auth.sub });
const ABERTAS = ["pendente", "ativa", "pausada"];
const STATUS_ASSINATURA = { pending: "pendente", authorized: "ativa", paused: "pausada", cancelled: "cancelada" };

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    if (e instanceof ErroPagamento) return erro(res, e.status, e.message);
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

function planoJson(p) {
  return { codigo: p.codigo, nome: p.nome, tipo: p.tipo, preco: Number(p.preco), rotuloPreco: p.rotuloPreco, beneficios: p.beneficios ?? [] };
}

const voltarPara = (tipo, extra) => `${(process.env.FRONTEND_URL ?? "http://localhost:3006").replace(/\/$/, "")}/${tipo === "empresa" ? "empresa" : "candidata"}/premium?retorno=${extra}`;

// ---------------------------------------------------------- Registro

// Grava (ou atualiza) um pagamento informado pelo Mercado Pago.
async function registrarPagamento({ idExterno, status, valor, pagoEm, tipoConta, contaId, planoId, assinaturaId = null, campanhaId = null }) {
  const existente = await Pagamento.findOne({ where: { idExterno: String(idExterno) } });
  const dados = { status: String(status ?? "desconhecido").slice(0, 30), valor: Number(valor ?? 0), pagoEm: pagoEm ? new Date(pagoEm) : null };
  if (existente) return existente.update(dados);
  return Pagamento.create({ ...dados, idExterno: String(idExterno), tipoConta, contaId, planoId, assinaturaId, campanhaId, provedor: "mercadopago" });
}

// Atualiza a assinatura local a partir do que o Mercado Pago diz dela.
async function aplicarAssinatura(local, remota) {
  const status = STATUS_ASSINATURA[remota.status] ?? local.status;
  const virouAtiva = status === "ativa" && local.status !== "ativa";
  await local.update({
    status,
    proximoPagamento: remota.next_payment_date ? new Date(remota.next_payment_date) : local.proximoPagamento,
    atualizadaEm: new Date(),
    ...(status === "cancelada" && !local.canceladaEm ? { canceladaEm: new Date() } : {}),
  });
  if (virouAtiva) {
    await notificar({ tipoConta: local.tipoConta, contaId: local.contaId, tipo: "plataforma", texto: "Seu Plano Premium está ativo. Obrigada por apoiar a Bloom!", link: `/${local.tipoConta === "empresa" ? "empresa" : "candidata"}/premium` });
  }
}

// Busca os pagamentos de uma referência ("assinatura-12", "campanha-3") e registra.
async function sincronizarPagamentos(referencia, base) {
  const r = await buscarPagamentosPorReferencia(referencia);
  for (const p of r?.results ?? []) {
    await registrarPagamento({ ...base, idExterno: p.id, status: p.status, valor: p.transaction_amount, pagoEm: p.date_approved });
  }
  return (r?.results ?? []).some((p) => p.status === "approved");
}

// ---------------------------------------------------------- Consulta

// GET /api/premium — planos, assinatura atual, campanhas e histórico.
export const visaoGeral = comTratamento(async (req, res) => {
  const { tipoConta, contaId } = minha(req);
  const [planos, assinaturas, pagamentos, campanhas] = await Promise.all([
    Plano.findAll({ where: { publico: tipoConta, ativo: true }, order: [["preco", "ASC"]] }),
    Assinatura.findAll({ where: { tipoConta, contaId }, order: [["id", "DESC"]], limit: 1 }),
    Pagamento.findAll({ where: { tipoConta, contaId }, order: [["id", "DESC"]], limit: 50 }),
    tipoConta === "empresa" ? Campanha.findAll({ where: { empresaId: contaId }, order: [["id", "DESC"]], limit: 50 }) : [],
  ]);
  const todosPlanos = await Plano.findAll();
  const codigo = new Map(todosPlanos.map((p) => [p.id, p]));
  const a = assinaturas[0];
  return res.json({
    pagamentosConfigurados: pagamentosAtivos(),
    premium: a?.status === "ativa",
    planos: planos.map(planoJson),
    assinatura: a
      ? {
          id: a.id,
          status: a.status,
          plano: planoJson(codigo.get(a.planoId)),
          criadaEm: a.criadaEm,
          proximoPagamento: a.proximoPagamento,
          canceladaEm: a.canceladaEm,
        }
      : null,
    pagamentos: pagamentos.map((p) => ({
      id: p.id,
      descricao: codigo.get(p.planoId)?.nome ?? "Plano",
      status: p.status,
      valor: Number(p.valor),
      moeda: p.moeda,
      pagoEm: p.pagoEm,
      registradoEm: p.registradoEm,
    })),
    campanhas: campanhas.map((c) => ({ id: c.id, titulo: c.titulo, texto: c.texto, link: c.link ?? "", status: c.status, criadaEm: c.criadaEm, pagaEm: c.pagaEm })),
  });
});

// ---------------------------------------------------------- Assinatura

// POST /api/premium/assinatura { plano } — devolve o link de pagamento.
export const assinar = comTratamento(async (req, res) => {
  const { tipoConta, contaId } = minha(req);
  if (!pagamentosAtivos()) return erro(res, 503, "Os pagamentos ainda não foram configurados na Bloom. Tente novamente mais tarde.");
  const plano = await Plano.findOne({ where: { codigo: texto(req.body?.plano), publico: tipoConta, tipo: "assinatura", ativo: true } });
  if (!plano) return erro(res, 404, "Plano não encontrado.", "plano");
  const aberta = await Assinatura.findOne({ where: { tipoConta, contaId, status: ABERTAS } });
  if (aberta) {
    return erro(res, 409, aberta.status === "pendente" ? "Você já tem uma assinatura aguardando pagamento. Conclua o pagamento ou cancele-a." : "Você já tem uma assinatura Premium.");
  }

  const conta = tipoConta === "empresa" ? await Empresa.findByPk(contaId) : await Usuaria.findByPk(contaId);
  const local = await Assinatura.create({ tipoConta, contaId, planoId: plano.id, status: "pendente", provedor: "mercadopago" });
  try {
    const remota = await criarAssinatura({
      referencia: `assinatura-${local.id}`,
      descricao: `Bloom ${plano.nome}`,
      valor: Number(plano.preco),
      email: conta.email,
      voltarPara: voltarPara(tipoConta, "assinatura"),
    });
    await local.update({ idExterno: String(remota.id), atualizadaEm: new Date() });
    return res.status(201).json({ initPoint: remota.init_point });
  } catch (e) {
    await local.update({ status: "falhou", atualizadaEm: new Date() });
    throw e;
  }
});

async function minhaAssinaturaAberta(req) {
  return Assinatura.findOne({ where: { ...minha(req), status: ABERTAS }, order: [["id", "DESC"]] });
}

// POST /api/premium/assinatura/sincronizar — relê o status no Mercado Pago
// (usado na volta do pagamento, sem depender do webhook).
export const sincronizarAssinatura = comTratamento(async (req, res) => {
  const local = await minhaAssinaturaAberta(req);
  if (local?.idExterno) {
    await aplicarAssinatura(local, await lerAssinatura(local.idExterno));
    await sincronizarPagamentos(`assinatura-${local.id}`, { ...minha(req), planoId: local.planoId, assinaturaId: local.id });
  }
  return visaoGeral(req, res);
});

// DELETE /api/premium/assinatura — cancela no Mercado Pago; só marca como
// cancelada depois que ele confirma.
export const cancelar = comTratamento(async (req, res) => {
  const local = await minhaAssinaturaAberta(req);
  if (!local) return erro(res, 404, "Você não tem assinatura ativa.");
  if (!local.idExterno) {
    await local.update({ status: "cancelada", canceladaEm: new Date(), atualizadaEm: new Date() });
    return visaoGeral(req, res);
  }
  const remota = await cancelarAssinatura(local.idExterno);
  if (remota?.status !== "cancelled") return erro(res, 502, "O Mercado Pago não confirmou o cancelamento. Tente novamente.");
  await aplicarAssinatura(local, remota);
  return visaoGeral(req, res);
});

// ---------------------------------------------------------- Publicidade

// POST /api/premium/campanhas { titulo, texto, link? } — só empresas.
export const criarCampanha = comTratamento(async (req, res) => {
  if (!pagamentosAtivos()) return erro(res, 503, "Os pagamentos ainda não foram configurados na Bloom. Tente novamente mais tarde.");
  const titulo = texto(req.body?.titulo);
  const corpo = texto(req.body?.texto);
  const link = texto(req.body?.link);
  if (titulo.length < 3 || titulo.length > 100) return erro(res, 400, "O título deve ter de 3 a 100 caracteres.", "titulo");
  if (corpo.length < 10 || corpo.length > 300) return erro(res, 400, "O texto deve ter de 10 a 300 caracteres.", "texto");
  if (link) {
    try {
      const u = new URL(link);
      if (!["http:", "https:"].includes(u.protocol) || link.length > 255) throw new Error();
    } catch {
      return erro(res, 400, "Use um endereço completo (https://...).", "link");
    }
  }
  const plano = await Plano.findOne({ where: { codigo: "publicidade", publico: "empresa", ativo: true } });
  if (!plano) return erro(res, 404, "Plano de publicidade indisponível.");
  const campanha = await Campanha.create({ empresaId: req.auth.sub, planoId: plano.id, titulo, texto: corpo, link: link || null, status: "aguardando_pagamento" });
  try {
    const pref = await criarPreferencia({
      referencia: `campanha-${campanha.id}`,
      titulo: `Bloom Publicidade — ${titulo}`,
      valor: Number(plano.preco),
      voltarPara: voltarPara("empresa", `campanha-${campanha.id}`),
    });
    return res.status(201).json({ initPoint: pref.init_point, campanha: { id: campanha.id } });
  } catch (e) {
    await campanha.update({ status: "cancelada" });
    throw e;
  }
});

async function minhaCampanha(req) {
  const id = idParam(req.params.id);
  return id ? Campanha.findOne({ where: { id, empresaId: req.auth.sub } }) : null;
}

// POST /api/premium/campanhas/:id/sincronizar — confere o pagamento.
export const sincronizarCampanha = comTratamento(async (req, res) => {
  const campanha = await minhaCampanha(req);
  if (!campanha) return erro(res, 404, "Campanha não encontrada.");
  if (campanha.status === "aguardando_pagamento") {
    const aprovado = await sincronizarPagamentos(`campanha-${campanha.id}`, { ...minha(req), planoId: campanha.planoId, campanhaId: campanha.id });
    if (aprovado) await campanha.update({ status: "paga", pagaEm: new Date() });
  }
  return visaoGeral(req, res);
});

// DELETE /api/premium/campanhas/:id — desiste de uma campanha ainda não paga.
export const cancelarCampanha = comTratamento(async (req, res) => {
  const campanha = await minhaCampanha(req);
  if (!campanha) return erro(res, 404, "Campanha não encontrada.");
  if (campanha.status !== "aguardando_pagamento") return erro(res, 400, "Só campanhas aguardando pagamento podem ser canceladas.");
  await campanha.update({ status: "cancelada" });
  return visaoGeral(req, res);
});

// ---------------------------------------------------------- Webhook

// POST /api/pagamentos/mercadopago/webhook — aviso do Mercado Pago. O corpo
// só diz "o que mudou"; o status verdadeiro é relido na API dele.
export async function webhook(req, res) {
  const tipo = req.query.type ?? req.query.topic ?? req.body?.type ?? req.body?.topic;
  const dataId = req.query["data.id"] ?? req.body?.data?.id ?? req.query.id;
  if (!tipo || !dataId) return res.status(200).json({ ok: true });

  const autentico = webhookAutentico({ assinatura: req.get("x-signature"), requestId: req.get("x-request-id"), dataId });
  if (autentico === false) return res.status(401).json({ erro: "Assinatura inválida." });

  try {
    if (tipo === "payment") {
      const p = await lerPagamento(dataId);
      const [qual, id] = String(p.external_reference ?? "").split("-");
      if (qual === "campanha") {
        const campanha = await Campanha.findByPk(Number(id));
        if (campanha) {
          await registrarPagamento({ idExterno: p.id, status: p.status, valor: p.transaction_amount, pagoEm: p.date_approved, tipoConta: "empresa", contaId: campanha.empresaId, planoId: campanha.planoId, campanhaId: campanha.id });
          if (p.status === "approved" && campanha.status === "aguardando_pagamento") await campanha.update({ status: "paga", pagaEm: new Date() });
        }
      } else if (qual === "assinatura") {
        const local = await Assinatura.findByPk(Number(id));
        if (local) await registrarPagamento({ idExterno: p.id, status: p.status, valor: p.transaction_amount, pagoEm: p.date_approved, tipoConta: local.tipoConta, contaId: local.contaId, planoId: local.planoId, assinaturaId: local.id });
      }
    } else if (tipo === "subscription_preapproval") {
      const remota = await lerAssinatura(dataId);
      const local = await Assinatura.findOne({ where: { idExterno: String(remota.id) } });
      if (local) await aplicarAssinatura(local, remota);
    } else if (tipo === "subscription_authorized_payment") {
      const ap = await lerPagamentoAutorizado(dataId);
      const local = ap?.preapproval_id && (await Assinatura.findOne({ where: { idExterno: String(ap.preapproval_id) } }));
      if (local) {
        await registrarPagamento({
          idExterno: ap.payment?.id ?? `ap-${ap.id}`,
          status: ap.payment?.status ?? ap.status,
          valor: ap.transaction_amount,
          pagoEm: ap.payment?.status === "approved" ? ap.date_created ?? new Date() : null,
          tipoConta: local.tipoConta,
          contaId: local.contaId,
          planoId: local.planoId,
          assinaturaId: local.id,
        });
        await aplicarAssinatura(local, await lerAssinatura(local.idExterno));
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    // 5xx faz o Mercado Pago tentar de novo mais tarde.
    console.error("Webhook Mercado Pago:", e.message);
    return res.status(500).json({ erro: "Falha ao processar." });
  }
}
