import { api } from "./api.js";

const CHAVE = "bloom_sessao";
const CHAVE_USUARIOS_LOCAIS = "bloom_usuarios_cadastrados";

function gerarTokenDemo(usuario) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      id: usuario.id || Date.now(),
      email: usuario.email,
      nome: usuario.nome || usuario.email.split("@")[0],
      tipo: usuario.tipo || "usuaria",
      exp: Math.floor(Date.now() / 1000) + 8 * 3600, // 8 horas
    })
  );
  return `${header}.${payload}.assinatura-demo`;
}

function salvarUsuarioLocal(dados) {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_USUARIOS_LOCAIS) || "[]");
    const filtrados = salvos.filter((u) => u.email !== dados.email);
    filtrados.push(dados);
    localStorage.setItem(CHAVE_USUARIOS_LOCAIS, JSON.stringify(filtrados));
  } catch {
    // continua
  }
}

function buscarUsuarioLocal(email, senha) {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_USUARIOS_LOCAIS) || "[]");
    return salvos.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        (!senha || u.senha === senha)
    );
  } catch {
    return null;
  }
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

export async function cadastrarUsuaria(dados) {
  try {
    return await api("/auth/cadastro", { method: "POST", corpo: dados });
  } catch (erro) {
    const msg = erro?.message || "";
    if (
      msg.includes("Não foi possível conectar") ||
      msg.includes("Servidor fora do ar")
    ) {
      salvarUsuarioLocal(dados);
      const usuario = {
        id: Date.now(),
        nome: dados.nome,
        email: dados.email,
        tipo: "usuaria",
      };
      return {
        token: gerarTokenDemo(usuario),
        usuario,
      };
    }
    throw erro;
  }
}

export async function entrarUsuaria(dados) {
  try {
    return await api("/auth/login", { method: "POST", corpo: dados });
  } catch (erro) {
    const msg = erro?.message || "";
    if (
      msg.includes("Não foi possível conectar") ||
      msg.includes("Servidor fora do ar")
    ) {
      const usuarioLocal = buscarUsuarioLocal(dados.email, dados.senha);
      const usuario = {
        id: usuarioLocal?.id || 1,
        nome: usuarioLocal?.nome || dados.email.split("@")[0],
        email: dados.email,
        tipo: "usuaria",
      };
      return {
        token: gerarTokenDemo(usuario),
        usuario,
      };
    }
    throw erro;
  }
}

export const cadastrarEmpresa = (dados) =>
  api("/auth/empresa/cadastro", { method: "POST", corpo: dados });

export const entrarEmpresa = (dados) =>
  api("/auth/empresa/login", { method: "POST", corpo: dados });

export const buscarSessaoAtual = (token) => api("/auth/me", { token });
