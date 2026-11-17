const URL_PADRAO = "https://brasilapi.com.br/api/cnpj/v1";
const TEMPO_LIMITE = 8000;
const VALIDADE_CACHE = 10 * 60 * 1000;

export const SITUACOES = {
  1: "NULA",
  2: "ATIVA",
  3: "SUSPENSA",
  4: "INAPTA",
  8: "BAIXADA",
};

export class ErroConsultaCnpj extends Error {
  constructor(tipo, mensagem) {
    super(mensagem);
    this.tipo = tipo;
  }
}

const cache = new Map();

function texto(v) {
  return typeof v === "string" ? v.trim() : "";
}

function resumir(d) {
  const codigo = Number(d.situacao_cadastral);
  return {
    cnpj: String(d.cnpj),
    razaoSocial: texto(d.razao_social),
    nomeFantasia: texto(d.nome_fantasia),
    situacao: { codigo, descricao: texto(d.descricao_situacao_cadastral) || SITUACOES[codigo] || "Não informada" },
    ativa: codigo === 2,
    cnaePrincipal: d.cnae_fiscal ? { codigo: String(d.cnae_fiscal), descricao: texto(d.cnae_fiscal_descricao) } : null,
    municipio: texto(d.municipio),
    uf: texto(d.uf),
    fonte: "BrasilAPI (dados públicos da Receita Federal)",
    consultadoEm: new Date().toISOString(),
  };
}

export async function consultarCnpj(cnpj) {
  const guardado = cache.get(cnpj);
  if (guardado && Date.now() - guardado.quando < VALIDADE_CACHE) return guardado.dados;

  const base = (process.env.CNPJ_API_URL || URL_PADRAO).replace(/\/$/, "");
  let resposta;
  try {
    resposta = await fetch(`${base}/${cnpj}`, {
      headers: { accept: "application/json", "User-Agent": "Bloom/1.0 (cadastro de empresas)" },
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    });
  } catch {
    throw new ErroConsultaCnpj("indisponivel", "Não foi possível consultar o CNPJ agora. Tente novamente em alguns minutos.");
  }

  if (resposta.status === 400) throw new ErroConsultaCnpj("invalido", "CNPJ inválido.");
  if (resposta.status === 404) throw new ErroConsultaCnpj("nao_encontrado", "CNPJ não encontrado no cadastro da Receita Federal.");
  if (!resposta.ok) {
    console.error("Consulta de CNPJ respondeu HTTP", resposta.status);
    throw new ErroConsultaCnpj("indisponivel", "Não foi possível consultar o CNPJ agora. Tente novamente em alguns minutos.");
  }

  let corpo;
  try {
    corpo = await resposta.json();
  } catch {
    throw new ErroConsultaCnpj("indisponivel", "A consulta de CNPJ respondeu em um formato inesperado. Tente novamente.");
  }

  const dados = resumir(corpo);
  if (dados.cnpj !== cnpj || !dados.razaoSocial || !Number.isFinite(dados.situacao.codigo)) {
    throw new ErroConsultaCnpj("incompleto", "A consulta não trouxe os dados mínimos da empresa (razão social e situação cadastral).");
  }

  cache.set(cnpj, { quando: Date.now(), dados });
  return dados;
}
