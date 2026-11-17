import { Empresa } from "../models/index.js";
import { PerfilEmpresa } from "../models/Empresarial.js";
import { EmpresaCadastro } from "../models/Verificacao.js";

export const PROVEDORES_GRATUITOS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.com.br", "outlook.com", "outlook.com.br", "live.com", "msn.com",
  "yahoo.com", "yahoo.com.br", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "gmx.com", "gmx.net",
  "proton.me", "protonmail.com", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "zipmail.com.br", "r7.com",
  "zoho.com", "mail.com", "yandex.com", "tutanota.com",
]);

export function dominioDoSite(site) {
  const valor = String(site ?? "").trim();
  if (!valor) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(valor) ? valor : `https://${valor}`);
    return url.hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export const dominioDoEmail = (email) => String(email ?? "").toLowerCase().split("@")[1] || null;

export const mesmoDominio = (email, site) => Boolean(email && site && (email === site || email.endsWith(`.${site}`)));

export async function situacaoRepresentante(empresaId) {
  const [conta, cadastro, perfil] = await Promise.all([
    Empresa.findByPk(empresaId),
    EmpresaCadastro.findOne({ where: { empresaId } }),
    PerfilEmpresa.findOne({ where: { empresaId } }),
  ]);
  if (!conta || !cadastro) return null;
  const email = dominioDoEmail(conta.email);
  const site = dominioDoSite(perfil?.site);
  const requisitos = [
    { id: "cnpj", ok: cadastro.situacaoCadastral?.toUpperCase() === "ATIVA", texto: `CNPJ com situação ATIVA na Receita (hoje: ${cadastro.situacaoCadastral || "não informada"})` },
    { id: "email", ok: Boolean(conta.emailVerificadoEm), texto: "E-mail da conta confirmado pelo link enviado" },
    { id: "corporativo", ok: Boolean(email) && !PROVEDORES_GRATUITOS.has(email), texto: `E-mail corporativo, não de provedor gratuito (hoje: ${email ?? "—"})` },
    { id: "site", ok: Boolean(site), texto: site ? `Site da empresa informado no perfil (${site})` : "Site da empresa informado no perfil" },
    { id: "dominio", ok: mesmoDominio(email, site), texto: "O domínio do e-mail é o mesmo do site da empresa" },
  ];
  return {
    representante: cadastro.representanteStatus,
    metodo: cadastro.representanteMetodo ?? null,
    verificadoEm: cadastro.representanteVerificadoEm ?? null,
    responsavel: { nome: cadastro.responsavelNome, cargo: cadastro.responsavelCargo ?? "" },
    email: conta.email,
    requisitos,
    podeVerificar: cadastro.representanteStatus !== "verificado" && requisitos.every((r) => r.ok),
    cadastro,
  };
}

export async function empresasVerificadas(ids) {
  if (!ids.length) return new Set();
  const linhas = await EmpresaCadastro.findAll({ attributes: ["empresaId"], where: { empresaId: ids, representanteStatus: "verificado" } });
  return new Set(linhas.map((l) => l.empresaId));
}
