import { api } from "./api.js";
import { obterSessao } from "./auth.js";
import { lerPerfil, salvarPerfil } from "./perfil.js";

// Foto e capa de perfil guardadas no servidor (/api/imagens), para que
// outras pessoas também as vejam. Vale para integrantes e empresas.

function chamar(caminho, opcoes = {}) {
  const token = obterSessao()?.token;
  if (!token) return Promise.reject(new Error("Sessão inválida. Faça login novamente."));
  return api(`/imagens${caminho}`, { ...opcoes, token });
}

export const lerMinhasImagens = () => chamar("/minhas");
export const enviarImagem = (campo, imagem) => chamar(`/${campo}`, { method: "PUT", corpo: { imagem } });
export const removerImagem = (campo) => chamar(`/${campo}`, { method: "DELETE" });
// Ícone predefinido no lugar da foto ("icone:<nome>:<cor>").
export const escolherIcone = (icone) => chamar("/icone", { method: "PUT", corpo: { icone } });
export const removerIcone = () => chamar("/icone", { method: "DELETE" });

// Imagem escolhida antes de existir o envio ao servidor: fica só no navegador.
export const soNesteNavegador = (valor) => typeof valor === "string" && valor.startsWith("data:");

// A candidata guarda foto e capa também no perfil local, que alimenta o menu
// e as telas dela. Aqui o perfil local passa a refletir o servidor — exceto
// imagens antigas, que só existem neste navegador e ainda não foram enviadas.
export function sincronizarImagensLocais(usuario, imagens) {
  const perfil = lerPerfil(usuario);
  const mudancas = {};
  for (const campo of ["foto", "capa"]) {
    const servidor = imagens?.[campo] ?? "";
    const local = perfil[campo] ?? "";
    if (servidor && local !== servidor) mudancas[campo] = servidor;
    if (!servidor && local && !soNesteNavegador(local)) mudancas[campo] = "";
  }
  if (Object.keys(mudancas).length) salvarPerfil({ ...perfil, ...mudancas });
}
