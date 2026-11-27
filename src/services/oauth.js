import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { verificarToken } from "../utils/jwt.js";

// Login com Google e GitHub (OAuth 2.0, fluxo "authorization code").
// Credenciais no .env: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET e GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.
// APP_URL é o endereço do site (o mesmo que abre no navegador). Em desenvolvimento, o Vite repassa /api para a API.

export const ContaOauth = sequelize.define(
  "ContaOauth",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_conta_oauth" },
    tipoConta: { type: DataTypes.ENUM("usuaria", "empresa"), allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    provedor: { type: DataTypes.ENUM("google", "github"), allowNull: false },
    idProvedor: { type: DataTypes.STRING(100), allowNull: false, field: "id_provedor" },
    criadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "criado_em" },
  },
  { tableName: "CONTA_OAUTH", freezeTableName: true, timestamps: false }
);

const TEMPO_LIMITE = 8000;

// Endereços dos provedores. Só os testes automatizados mudam estes valores (para um provedor simulado local).
const URL = {
  googleAutorizar: process.env.OAUTH_GOOGLE_AUTH_URL ?? "https://accounts.google.com/o/oauth2/v2/auth",
  googleToken: process.env.OAUTH_GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token",
  googlePerfil: process.env.OAUTH_GOOGLE_USERINFO_URL ?? "https://openidconnect.googleapis.com/v1/userinfo",
  githubAutorizar: process.env.OAUTH_GITHUB_AUTH_URL ?? "https://github.com/login/oauth/authorize",
  githubToken: process.env.OAUTH_GITHUB_TOKEN_URL ?? "https://github.com/login/oauth/access_token",
  githubApi: (process.env.OAUTH_GITHUB_API_URL ?? "https://api.github.com").replace(/\/$/, ""),
};

export const urlApp = () => (process.env.APP_URL ?? "http://localhost:3006").replace(/\/$/, "");
const urlRetorno = (provedor) => `${urlApp()}/api/auth/oauth/${provedor}/retorno`;

export const PROVEDORES = {
  google: {
    nome: "Google",
    configurado: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    urlAutorizacao: (state) =>
      `${URL.googleAutorizar}?${new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: urlRetorno("google"),
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
      })}`,
    async perfil(code) {
      const token = await pedirJson(URL.googleToken, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: urlRetorno("google"),
          grant_type: "authorization_code",
        }),
      });
      const p = await pedirJson(URL.googlePerfil, { headers: { Authorization: `Bearer ${token.access_token}` } });
      return { id: String(p.sub), email: String(p.email ?? "").toLowerCase(), emailVerificado: p.email_verified === true, nome: p.name ?? "" };
    },
  },
  github: {
    nome: "GitHub",
    configurado: () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    urlAutorizacao: (state) =>
      `${URL.githubAutorizar}?${new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: urlRetorno("github"),
        scope: "read:user user:email",
        state,
        allow_signup: "true",
      })}`,
    async perfil(code) {
      const token = await pedirJson(URL.githubToken, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: urlRetorno("github"),
        }),
      });
      if (!token.access_token) throw new Error("GitHub não devolveu o token de acesso.");
      const cabecalhos = { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "Bloom" };
      const [usuario, emails] = await Promise.all([
        pedirJson(`${URL.githubApi}/user`, { headers: cabecalhos }),
        pedirJson(`${URL.githubApi}/user/emails`, { headers: cabecalhos }),
      ]);
      const principal = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : null;
      return {
        id: String(usuario.id),
        email: String(principal?.email ?? "").toLowerCase(),
        emailVerificado: Boolean(principal),
        nome: usuario.name || usuario.login || "",
      };
    },
  },
};

// Usado pelo cadastro: valida o token de pré-cadastro emitido no retorno do provedor.
export function lerPreCadastro(token, tipo) {
  const p = verificarToken(String(token ?? ""), process.env.JWT_SECRET);
  if (!p || p.uso !== "oauth_cadastro" || p.conta !== tipo || !PROVEDORES[p.provedor]) return null;
  return p;
}

async function pedirJson(url, opcoes) {
  const resposta = await fetch(url, { ...opcoes, signal: AbortSignal.timeout(TEMPO_LIMITE) });
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok || !dados) throw new Error(`HTTP ${resposta.status} em ${new URL(url).host}`);
  return dados;
}
