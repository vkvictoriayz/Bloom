import { api } from "./api.js";
import { obterSessao } from "./auth.js";

// Cliente da API da comunidade (backend/src/routes/comunidadeRoutes.js).
// Usa o token da sessão atual; sem sessão, nada é enviado.
export const TIPOS = [
  { id: "dica", rotulo: "Dica" },
  { id: "experiencia", rotulo: "Experiência" },
  { id: "projeto", rotulo: "Projeto" },
  { id: "conquista", rotulo: "Conquista" },
  { id: "oportunidade", rotulo: "Oportunidade" },
  { id: "duvida", rotulo: "Dúvida" },
];

export const LIMITE_PUBLICACAO = 1000;
export const LIMITE_COMENTARIO = 500;

const chamar = (caminho, opcoes = {}) => {
  const token = obterSessao()?.token;
  if (!token) return Promise.reject(new Error("Sessão inválida. Faça login novamente."));
  return api(`/comunidade${caminho}`, { ...opcoes, token });
};

const consulta = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return q ? `?${q}` : "";
};

export const lerFeed = ({ filtro, tipo, pagina = 1 } = {}) =>
  chamar(`/feed${consulta({ filtro, tipo, pagina: pagina > 1 ? pagina : "" })}`);
export const publicar = (corpo) => chamar("/publicacoes", { method: "POST", corpo });
export const excluirPublicacao = (id) => chamar(`/publicacoes/${id}`, { method: "DELETE" });
export const curtir = (id) => chamar(`/publicacoes/${id}/curtir`, { method: "POST" });
export const lerComentarios = (id) => chamar(`/publicacoes/${id}/comentarios`);
export const comentar = (id, texto) => chamar(`/publicacoes/${id}/comentarios`, { method: "POST", corpo: { texto } });

export const lerPerfis = ({ busca, conectadas } = {}) => chamar(`/perfis${consulta({ busca, conectadas: conectadas ? "1" : "" })}`);
export const seguir = (id) => chamar(`/perfis/${id}/seguir`, { method: "POST" });
export const lerMeuPerfil = () => chamar("/meu-perfil");
export const salvarMeuPerfil = (corpo) => chamar("/meu-perfil", { method: "PUT", corpo });

// "há 5 min", "há 3 h", "ontem" ou a data.
export function tempoRelativo(data, agora = Date.now()) {
  const ms = agora - new Date(data).getTime();
  if (Number.isNaN(ms)) return "";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 7) return `há ${d} dias`;
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}
