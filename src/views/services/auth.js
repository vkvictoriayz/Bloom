import { api } from "./api.js";

const CHAVE = "bloom_sessao";
try {
  localStorage.removeItem("bloom_usuarios_cadastrados");
} catch {
}

// "Lembrar de mim": marcado, a sessão fica no localStorage (sobrevive ao fechar o navegador);
// desmarcado, fica no sessionStorage (termina ao fechar a aba). Sem a opção, mantém onde já estava.
function armazenamentoDaSessao() {
  try {
    if (sessionStorage.getItem(CHAVE)) return sessionStorage;
  } catch {
  }
  return localStorage;
}

export function salvarSessao({ token, usuario }, { lembrar } = {}) {
  const destino = lembrar === undefined ? armazenamentoDaSessao() : lembrar ? localStorage : sessionStorage;
  const outro = destino === localStorage ? sessionStorage : localStorage;
  try {
    outro.removeItem(CHAVE);
  } catch {
  }
  destino.setItem(CHAVE, JSON.stringify({ token, usuario }));
  window.dispatchEvent(new Event("bloom-sessao-atualizada"));
}

function lerGuardada() {
  for (const armazenamento of [localStorage, sessionStorage]) {
    try {
      const valor = armazenamento.getItem(CHAVE);
      if (valor) return JSON.parse(valor);
    } catch {
    }
  }
  return null;
}

function apagarSessao() {
  for (const armazenamento of [localStorage, sessionStorage]) {
    try {
      armazenamento.removeItem(CHAVE);
    } catch {
    }
  }
}

export function obterSessao() {
  try {
    const sessao = lerGuardada();
    if (!sessao?.token) return null;

    const payload = JSON.parse(
      atob(sessao.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (payload.exp * 1000 < Date.now()) {
      apagarSessao();
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export function sair() {
  apagarSessao();
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
