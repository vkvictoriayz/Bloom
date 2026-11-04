import { createHmac, timingSafeEqual } from "node:crypto";

// Cliente mínimo da API do Mercado Pago (https://www.mercadopago.com.br/developers),
// por HTTP, sem SDK. Usado pelo Bloom Premium:
//  - assinaturas: POST/GET/PUT /preapproval (cobrança mensal recorrente);
//  - campanhas (pagamento avulso): POST /checkout/preferences (Checkout Pro);
//  - consulta de pagamentos: GET /v1/payments/:id e /authorized_payments/:id.
//
// Variáveis de ambiente:
//   MP_ACCESS_TOKEN    — Access Token (de teste ou de produção) da conta Mercado Pago
//   MP_WEBHOOK_SECRET  — assinatura secreta dos webhooks (Suas integrações > Webhooks)
//   API_PUBLIC_URL     — endereço público desta API, para o Mercado Pago avisar
//                        (ex.: https://api.seusite.com/api). Sem ele, o status é
//                        conferido quando a pessoa volta do pagamento.
//
// Sem MP_ACCESS_TOKEN nada é cobrado: as rotas de compra respondem 503.

// MP_API_URL só existe para testes automatizados; em uso real fica o endereço oficial.
const BASE = () => (process.env.MP_API_URL || "https://api.mercadopago.com").replace(/\/$/, "");

export class ErroPagamento extends Error {
  constructor(mensagem, status = 502) {
    super(mensagem);
    this.status = status;
  }
}

export const pagamentosAtivos = () => Boolean(process.env.MP_ACCESS_TOKEN);

async function chamar(caminho, { method = "GET", corpo, idempotencia } = {}) {
  if (!pagamentosAtivos()) throw new ErroPagamento("Pagamentos ainda não configurados.", 503);
  let resposta;
  try {
    resposta = await fetch(`${BASE()}${caminho}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        ...(idempotencia ? { "X-Idempotency-Key": idempotencia } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ErroPagamento("Não foi possível falar com o Mercado Pago. Tente novamente.");
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    // Só o código e a mensagem técnica no log; nada de dados de pagamento.
    console.error(`Mercado Pago ${method} ${caminho.split("?")[0]}: HTTP ${resposta.status}`, dados?.message ?? "");
    throw new ErroPagamento(resposta.status === 404 ? "Registro não encontrado no Mercado Pago." : "O Mercado Pago recusou a operação.");
  }
  return dados;
}

const urlNotificacao = () => (process.env.API_PUBLIC_URL ? `${process.env.API_PUBLIC_URL.replace(/\/$/, "")}/pagamentos/mercadopago/webhook` : undefined);

// Assinatura mensal. Devolve { id, init_point, status } — a pessoa autoriza
// no init_point; até lá o status é "pending".
export function criarAssinatura({ referencia, descricao, valor, email, voltarPara }) {
  return chamar("/preapproval", {
    method: "POST",
    idempotencia: referencia,
    corpo: {
      reason: descricao,
      external_reference: referencia,
      payer_email: email,
      back_url: voltarPara,
      status: "pending",
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: valor, currency_id: "BRL" },
      ...(urlNotificacao() ? { notification_url: urlNotificacao() } : {}),
    },
  });
}

export const lerAssinatura = (id) => chamar(`/preapproval/${encodeURIComponent(id)}`);
export const cancelarAssinatura = (id) => chamar(`/preapproval/${encodeURIComponent(id)}`, { method: "PUT", corpo: { status: "cancelled" } });

// Pagamento avulso (Checkout Pro). Devolve { id, init_point }.
export function criarPreferencia({ referencia, titulo, valor, voltarPara }) {
  return chamar("/checkout/preferences", {
    method: "POST",
    idempotencia: referencia,
    corpo: {
      items: [{ title: titulo, quantity: 1, unit_price: valor, currency_id: "BRL" }],
      external_reference: referencia,
      back_urls: { success: voltarPara, pending: voltarPara, failure: voltarPara },
      ...(urlNotificacao() ? { notification_url: urlNotificacao() } : {}),
    },
  });
}

export const lerPagamento = (id) => chamar(`/v1/payments/${encodeURIComponent(id)}`);
export const lerPagamentoAutorizado = (id) => chamar(`/authorized_payments/${encodeURIComponent(id)}`);
export const buscarPagamentosPorReferencia = (referencia) =>
  chamar(`/v1/payments/search?external_reference=${encodeURIComponent(referencia)}&sort=date_created&criteria=desc`);

// Confere a assinatura do webhook (header x-signature: "ts=...,v1=...").
// Mensagem assinada: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
// (HMAC-SHA256 com MP_WEBHOOK_SECRET). Sem segredo configurado, devolve
// null: o webhook segue, porque o status é sempre relido na API.
export function webhookAutentico({ assinatura, requestId, dataId }) {
  const segredo = process.env.MP_WEBHOOK_SECRET;
  if (!segredo) return null;
  const partes = Object.fromEntries(
    String(assinatura ?? "")
      .split(",")
      .map((p) => p.split("=").map((x) => x.trim()))
  );
  if (!partes.ts || !partes.v1) return false;
  const id = /^[a-z0-9]+$/i.test(String(dataId)) ? String(dataId).toLowerCase() : String(dataId);
  const mensagem = `id:${id};request-id:${requestId ?? ""};ts:${partes.ts};`;
  const esperado = createHmac("sha256", segredo).update(mensagem).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(String(partes.v1));
  return a.length === b.length && timingSafeEqual(a, b);
}
