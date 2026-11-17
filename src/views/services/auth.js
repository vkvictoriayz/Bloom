import { api } from "./api.js";

const CHAVE = "bloom_sessao";
try {
  localStorage.removeItem("bloom_usuarios_cadastrados");
} catch {
}

export function salvarSessao({ token, usuario }) {
  localStorage.setItem(CHAVE, JSON.stringify({ token, usuario }));
  window.dispatchEvent(new Event("bloom-sessao-atualizada"));
}

export function obterSessao() {
  try {
    const sessao = JSON.parse(localStorage.getItem(CHAVE));
    if (!sessao?.token) return null;

    const payload = JSON.parse(
      atob(sessao.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
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
  window.dispatchEvent(new Event("bloom-sessao-atualizada"));
}

export const cadastrarUsuaria = (dados) =>
  api("/auth/cadastro", { method: "POST", corpo: dados });

export const entrarUsuaria = (dados) =>
  api("/auth/login", { method: "POST", corpo: dados });

export const consultarCnpj = (cnpj) =>
  api(`/auth/empresa/cnpj/${encodeURIComponent(cnpj)}`).then((r) => r.empresa);

export const cadastrarEmpresa = (dados) =>
  api("/auth/empresa/cadastro", { method: "POST", corpo: dados });

export const entrarEmpresa = (dados) =>
  api("/auth/empresa/login", { method: "POST", corpo: dados });

export const buscarSessaoAtual = (token) => api("/auth/me", { token });

export const pedirRedefinicaoSenha = (dados) =>
  api("/auth/senha/esqueci", { method: "POST", corpo: dados });

export const redefinirSenha = (dados) =>
  api("/auth/senha/redefinir", { method: "POST", corpo: dados });

export const confirmarEmail = (token) =>
  api("/auth/email/confirmar", { method: "POST", corpo: { token } });

export const reenviarConfirmacaoEmail = (token) =>
  api("/auth/email/reenviar", { method: "POST", token });

export function atualizarUsuarioSessao(campos) {
  const sessao = obterSessao();
  if (!sessao) return;
  salvarSessao({ token: sessao.token, usuario: { ...sessao.usuario, ...campos } });
}
