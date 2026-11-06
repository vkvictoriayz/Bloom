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

  // Até 4 tentativas (~6 s) enquanto a API não responde: cobre um reinício
  // da API (npm run server) sem mostrar erro à toa.
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
    throw new Error("O servidor da Bloom não está respondendo. Confira o terminal do \"npm run server\" e tente de novo.");
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

// Baixa um arquivo protegido por login (ex.: currículo) e oferece para salvar.
// O nome vem do cabeçalho Content-Disposition da API.
export async function baixarArquivo(caminho, token, nomePadrao = "arquivo") {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => null);
    throw new Error(dados?.erro ?? "Não foi possível baixar o arquivo.");
  }
  const cabecalho = resposta.headers.get("Content-Disposition") ?? "";
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecalho)?.[1];
  const simples = /filename="([^"]+)"/i.exec(cabecalho)?.[1];
  const nome = utf8 ? decodeURIComponent(utf8) : simples || nomePadrao;
  const url = URL.createObjectURL(await resposta.blob());
  const link = Object.assign(document.createElement("a"), { href: url, download: nome });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
