// Em desenvolvimento o Vite repassa "/api" para o backend (ver vite.config.js).
// Em produção, defina VITE_API_URL (ex.: https://api.seusite.com/api).
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

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

  // 502/503/504 = o Vite não conseguiu falar com o backend (não está rodando).
  if ([502, 503, 504].includes(resposta.status)) {
    throw new Error("Servidor fora do ar. Rode \"npm run server\" e tente de novo.");
  }

  if (!resposta.ok) {
    throw new Error(dados?.erro ?? "Algo deu errado. Tente novamente.");
  }

  return dados;
}
