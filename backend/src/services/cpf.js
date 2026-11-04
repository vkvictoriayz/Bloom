// Consulta de CPF pelo Serpro — "Consulta CPF" v3
// (https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cpf/).
// Serviço oficial e pago: exige contrato com o Serpro. A v3 pede o CPF e a
// data de nascimento e devolve nome, situação cadastral e nascimento.
//
// Variáveis de ambiente (todas obrigatórias para ativar a consulta):
//   SERPRO_CPF_CONSUMER_KEY    — Consumer Key do contrato
//   SERPRO_CPF_CONSUMER_SECRET — Consumer Secret do contrato
//   SERPRO_CPF_URL             — base da API contratada, sem barra no fim, ex.:
//                                https://gateway.apiserpro.serpro.gov.br/consulta-cpf-df-trial/v3 (demonstração)
// Opcional:
//   SERPRO_TOKEN_URL           — padrão: https://gateway.apiserpro.serpro.gov.br/token
//
// Sem essas variáveis a consulta fica DESLIGADA: a conta é criada como
// "CPF não verificado". Nunca se marca um CPF como verificado sem resposta
// real do serviço. A conta matemática (dígitos verificadores) não prova a
// identidade de ninguém.

const TOKEN_PADRAO = "https://gateway.apiserpro.serpro.gov.br/token";
const TEMPO_LIMITE = 8000;

export class ErroConsultaCpf extends Error {
  constructor(tipo, mensagem) {
    super(mensagem);
    this.tipo = tipo; // "nao_confere" | "irregular" | "indisponivel"
  }
}

let tokenGuardado = null; // { valor, expiraEm }

export function consultaCpfAtiva() {
  return Boolean(process.env.SERPRO_CPF_CONSUMER_KEY && process.env.SERPRO_CPF_CONSUMER_SECRET && process.env.SERPRO_CPF_URL);
}

async function obterToken(renovar = false) {
  if (!renovar && tokenGuardado && Date.now() < tokenGuardado.expiraEm) return tokenGuardado.valor;
  const credencial = Buffer.from(`${process.env.SERPRO_CPF_CONSUMER_KEY}:${process.env.SERPRO_CPF_CONSUMER_SECRET}`).toString("base64");
  const resposta = await fetch(process.env.SERPRO_TOKEN_URL || TOKEN_PADRAO, {
    method: "POST",
    headers: { Authorization: `Basic ${credencial}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(TEMPO_LIMITE),
  });
  if (!resposta.ok) throw new Error(`token Serpro: HTTP ${resposta.status}`);
  const corpo = await resposta.json();
  // Renova um minuto antes de vencer.
  tokenGuardado = { valor: corpo.access_token, expiraEm: Date.now() + (Number(corpo.expires_in) - 60) * 1000 };
  return tokenGuardado.valor;
}

// Compara nomes sem acentos, caixa ou espaços extras.
export function normalizarNome(nome) {
  return String(nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// nascimento: "AAAA-MM-DD" (como vem do formulário).
// Devolve { status: "verificado" } quando o Serpro confirma: situação
// regular, nome igual ao informado e mesma data de nascimento.
export async function verificarCpf({ cpf, nome, nascimento }) {
  const [ano, mes, dia] = nascimento.split("-");
  const url = `${process.env.SERPRO_CPF_URL.replace(/\/$/, "")}/cpf/${cpf}/${dia}${mes}${ano}`;

  async function chamar(renovar) {
    const token = await obterToken(renovar);
    return fetch(url, {
      headers: { accept: "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    });
  }

  let resposta;
  try {
    resposta = await chamar(false);
    if (resposta.status === 401) resposta = await chamar(true); // token vencido
  } catch (e) {
    // Sem o CPF na mensagem: só o motivo técnico.
    console.error("Consulta de CPF indisponível:", e.message);
    throw new ErroConsultaCpf("indisponivel", "Serviço de consulta de CPF indisponível.");
  }

  if (resposta.status === 404 || resposta.status === 400) {
    throw new ErroConsultaCpf("nao_confere", "Não foi possível confirmar o CPF com os dados informados.");
  }
  if (!resposta.ok) {
    console.error("Consulta de CPF respondeu HTTP", resposta.status);
    throw new ErroConsultaCpf("indisponivel", "Serviço de consulta de CPF indisponível.");
  }

  let corpo;
  try {
    corpo = await resposta.json();
  } catch {
    throw new ErroConsultaCpf("indisponivel", "Resposta inesperada da consulta de CPF.");
  }

  if (String(corpo?.situacao?.codigo) !== "0") {
    throw new ErroConsultaCpf("irregular", "Não foi possível confirmar o CPF: a situação cadastral não está regular.");
  }
  const mesmoNascimento = !corpo.nascimento || corpo.nascimento === `${dia}${mes}${ano}`;
  if (corpo.ni !== cpf || !mesmoNascimento || normalizarNome(corpo.nome) !== normalizarNome(nome)) {
    throw new ErroConsultaCpf("nao_confere", "Os dados informados não conferem com o cadastro do CPF.");
  }
  return { status: "verificado", fonte: "Serpro Consulta CPF v3" };
}
