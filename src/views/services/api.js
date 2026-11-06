// Em desenvolvimento o Vite repassa "/api" para o backend (ver vite.config.js).
// Em produção, defina VITE_API_URL (ex.: https://api.seusite.com/api).
const API_URL = import.meta.env?.VITE_API_URL ?? "/api";

export async function api(caminho, { method = "GET", corpo, token } = {}) {
  let resposta;

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers: {
        ...(corpo ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    // resposta sem corpo JSON
  }

  // 502/503/504 sem mensagem da API = o Vite não conseguiu falar com o
  // backend (não está rodando). Com mensagem, é o backend avisando que um
  // serviço externo está fora (ex.: consulta de CNPJ) e ela vale.
  if ([502, 503, 504].includes(resposta.status) && !dados?.erro) {
    throw new Error("Servidor fora do ar. Rode \"npm run server\" e tente de novo.");
  }

  if (!resposta.ok) {
    throw new Error(dados?.erro ?? "Algo deu errado. Tente novamente.");
  }

  return dados;
}

// Endereço de uma imagem guardada no servidor ("/imagens/<chave>", como a API
// devolve). Fotos de outra origem (data:, https:) passam sem mudança.
export function urlImagem(caminho) {
  if (typeof caminho === "string" && caminho.startsWith("/imagens/")) return `${API_URL}${caminho}`;
  return caminho || "";
}
