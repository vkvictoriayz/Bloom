import { api } from "./api";

const CHAVE = "bloom_sessao";

export function salvarSessao({ token, usuario }) {
  localStorage.setItem(CHAVE, JSON.stringify({ token, usuario }));
}

// Devolve a sessão salva ou null (também descarta sessão com token vencido).
// A conferência real do token é feita pelo backend; aqui é só para não
// deixar a pessoa navegando com um login que já expirou.
export function obterSessao() {
  try {
    const sessao = JSON.parse(localStorage.getItem(CHAVE));
    if (!sessao?.token) return null;

    const payload = JSON.parse(atob(sessao.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(CHAVE);
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export function sair() {
  localStorage.removeItem(CHAVE);
}

export const cadastrarUsuaria = (dados) =>
  api("/auth/cadastro", { method: "POST", corpo: dados });

export const entrarUsuaria = (dados) =>
  api("/auth/login", { method: "POST", corpo: dados });

export const cadastrarEmpresa = (dados) =>
  api("/auth/empresa/cadastro", { method: "POST", corpo: dados });

export const entrarEmpresa = (dados) =>
  api("/auth/empresa/login", { method: "POST", corpo: dados });

export const buscarSessaoAtual = (token) => api("/auth/me", { token });
