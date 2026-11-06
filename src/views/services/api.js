// Em desenvolvimento o Vite repassa "/api" para o backend (ver vite.config.js).
// Em produção, defina VITE_API_URL (ex.: https://api.seusite.com/api).
const API_URL = import.meta.env?.VITE_API_URL ?? "/api";

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

// 502/503/504 sem mensagem da API = o Vite não conseguiu falar com a API
// (ela está reiniciando ou parada); o pedido nem chegou nela. Com mensagem,
// é a API avisando que um serviço externo está fora (ex.: consulta de CNPJ).
const semApi = (resposta, dados) => [502, 503, 504].includes(resposta.status) && !dados?.erro;

export async function api(caminho, { method = "GET", corpo, token } = {}) {
  let resposta;
  let dados = null;

  // Até 4 tentativas (~6 s) enquanto a API não responde: cobre o reinício
  // automático dela no `npm run dev` sem mostrar erro à toa.
  for (let tentativa = 1; ; tentativa++) {
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
      throw new Error("Não foi possível conectar ao servidor. Confira sua internet e tente novamente.");
    }

    dados = null;
    try {
      dados = await resposta.json();
    } catch {
      // resposta sem corpo JSON
    }

    if (!semApi(resposta, dados) || tentativa === 4) break;
    await esperar(tentativa * 1000);
  }

  if (semApi(resposta, dados)) {
    throw new Error("O servidor da Bloom não está respondendo. Confira o terminal do \"npm run dev\" e tente de novo.");
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
