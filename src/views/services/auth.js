import { api } from "./api.js";

const CHAVE = "bloom_sessao";
// Versões antigas guardavam neste navegador os cadastros feitos com o
// servidor fora do ar, inclusive CPF e senha em texto puro, e criavam uma
// sessão de demonstração. Isso acabou: apaga o que tiver sobrado.
try {
  localStorage.removeItem("bloom_usuarios_cadastrados");
} catch {
  // armazenamento indisponível: nada a limpar
}

export function salvarSessao({ token, usuario }) {
  localStorage.setItem(CHAVE, JSON.stringify({ token, usuario }));
  window.dispatchEvent(new Event("bloom-sessao-atualizada"));
}

// Devolve a sessão salva ou null (também descarta sessão com token vencido).
// A conferência real do token é feita pelo backend; aqui é só para não
// deixar a pessoa navegando com um login que já expirou.
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

// Login e cadastro só pelo servidor: sem ele, a pessoa vê o erro e tenta de novo.
export const cadastrarUsuaria = (dados) =>
  api("/auth/cadastro", { method: "POST", corpo: dados });

export const entrarUsuaria = (dados) =>
  api("/auth/login", { method: "POST", corpo: dados });

// Dados públicos do CNPJ (BrasilAPI, consultada pelo servidor).
export const consultarCnpj = (cnpj) =>
  api(`/auth/empresa/cnpj/${encodeURIComponent(cnpj)}`).then((r) => r.empresa);

export const cadastrarEmpresa = (dados) =>
  api("/auth/empresa/cadastro", { method: "POST", corpo: dados });

export const entrarEmpresa = (dados) =>
  api("/auth/empresa/login", { method: "POST", corpo: dados });

export const buscarSessaoAtual = (token) => api("/auth/me", { token });

// Redefinição de senha: pede o link por e-mail e grava a nova senha.
export const pedirRedefinicaoSenha = (dados) =>
  api("/auth/senha/esqueci", { method: "POST", corpo: dados });

export const redefinirSenha = (dados) =>
  api("/auth/senha/redefinir", { method: "POST", corpo: dados });

// Confirmação do e-mail da conta: o link do e-mail abre /confirmar-email.
export const confirmarEmail = (token) =>
  api("/auth/email/confirmar", { method: "POST", corpo: { token } });

export const reenviarConfirmacaoEmail = (token) =>
  api("/auth/email/reenviar", { method: "POST", token });

// Atualiza campos do usuário guardado na sessão (sem trocar o token).
export function atualizarUsuarioSessao(campos) {
  const sessao = obterSessao();
  if (!sessao) return;
  salvarSessao({ token: sessao.token, usuario: { ...sessao.usuario, ...campos } });
}
