const API_URL = import.meta.env?.VITE_API_URL ?? "/api";

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

const semApi = (resposta, dados) => [502, 503, 504].includes(resposta.status) && !dados?.erro;

export async function api(caminho, { method = "GET", corpo, token } = {}) {
  let resposta;
  let dados = null;

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
    }

    if (!semApi(resposta, dados) || tentativa === 4) break;
    await esperar(tentativa * 1000);
  }

  if (semApi(resposta, dados)) {
    throw new Error("O servidor da Bloom não está respondendo. Confira o terminal do \"npm run server\" e tente de novo.");
  }

  if (!resposta.ok) {
    const falha = new Error(dados?.erro ?? "Algo deu errado. Tente novamente.");
    // Campo que causou o erro (quando a API informa), para mostrar a mensagem junto dele.
    if (dados?.campo) falha.campo = dados.campo;
    throw falha;
  }

  return dados;
}

export function urlImagem(caminho) {
  if (typeof caminho === "string" && caminho.startsWith("/imagens/")) return `${API_URL}${caminho}`;
  return caminho || "";
}

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
