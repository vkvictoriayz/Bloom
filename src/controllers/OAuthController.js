import { randomBytes, timingSafeEqual } from "node:crypto";
import { Empresa, Usuaria } from "../models/index.js";
import { ContaOauth, PROVEDORES, urlApp } from "../services/oauth.js";
import { MENSAGEM_SUSPENSA } from "../services/suspensao.js";
import { criarToken, verificarToken } from "../utils/jwt.js";
import { criarLimitador } from "../utils/limitador.js";
import { gerarSessao } from "./AuthController.js";

// Fluxo:
// 1. GET /api/auth/oauth/:provedor/iniciar?tipo=usuaria|empresa
//    → guarda um nonce num cookie HttpOnly e manda para o provedor com um "state" assinado.
// 2. GET /api/auth/oauth/:provedor/retorno?code&state
//    → confere state + cookie, busca o perfil, e:
//      • conta já ligada (ou com o mesmo e-mail verificado) → volta ao site já logada (#token=…);
//      • sem conta → volta ao cadastro com nome e e-mail preenchidos (#oauth=…), para completar os dados.
// Os tokens vão no fragmento (#) da URL, que não é enviado a servidores nem fica em logs.

const COOKIE = "bloom_oauth";
const VALIDADE_ESTADO = 10 * 60;
const VALIDADE_PRE_CADASTRO = 30 * 60;

const tipoValido = (t) => (t === "empresa" ? "empresa" : "usuaria");
const paginaLogin = (tipo) => (tipo === "empresa" ? "/empresa/login" : "/login");
const paginaCadastro = (tipo) => (tipo === "empresa" ? "/empresa/cadastro" : "/cadastro");

function voltarComErro(res, tipo, mensagem) {
  return res.redirect(`${urlApp()}${paginaLogin(tipo)}#erro=${encodeURIComponent(mensagem)}`);
}

function lerCookie(req, nome) {
  const par = (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${nome}=`));
  return par ? decodeURIComponent(par.slice(nome.length + 1)) : "";
}

function cookie(valor, maxAge) {
  const seguro = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${valor}; Path=/api/auth/oauth; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${seguro}`;
}

const iguais = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Limite próprio do login social (separado do login por senha). Quando estoura, o navegador
// volta para a tela de login com um aviso, em vez de receber uma resposta técnica.
const tentativasSociais = criarLimitador({ janela: 60 * 1000, maximo: 30 });
export function limitarLoginSocial(req, res, next) {
  if (tentativasSociais.bloqueado(req.ip)) {
    const tipo = tipoValido(req.query.tipo ?? verificarToken(String(req.query.state ?? ""), process.env.JWT_SECRET)?.tipo);
    return voltarComErro(res, tipo, "Muitas tentativas de login. Aguarde um minuto e tente de novo.");
  }
  tentativasSociais.registrar(req.ip);
  next();
}

export function iniciar(req, res) {
  const tipo = tipoValido(req.query.tipo);
  const provedor = PROVEDORES[req.params.provedor];
  if (!provedor) return voltarComErro(res, tipo, "Forma de login desconhecida.");
  if (!provedor.configurado()) {
    return voltarComErro(res, tipo, `O login com ${provedor.nome} ainda não foi configurado nesta instalação da Bloom.`);
  }

  const nonce = randomBytes(16).toString("hex");
  const state = criarToken({ uso: "oauth_estado", nonce, tipo, provedor: req.params.provedor }, process.env.JWT_SECRET, VALIDADE_ESTADO);
  res.setHeader("Set-Cookie", cookie(nonce, VALIDADE_ESTADO));
  return res.redirect(provedor.urlAutorizacao(state));
}

export async function retorno(req, res) {
  const estado = verificarToken(String(req.query.state ?? ""), process.env.JWT_SECRET);
  const tipo = tipoValido(estado?.tipo);
  const nonce = lerCookie(req, COOKIE);
  res.setHeader("Set-Cookie", cookie("", 0));

  const nomeProvedor = req.params.provedor;
  const provedor = PROVEDORES[nomeProvedor];
  if (!provedor || !estado || estado.uso !== "oauth_estado" || estado.provedor !== nomeProvedor || !nonce || !iguais(nonce, estado.nonce)) {
    return voltarComErro(res, tipo, "Não foi possível confirmar o login. Tente de novo.");
  }
  if (req.query.error || !req.query.code) return voltarComErro(res, tipo, `Login com ${provedor.nome} cancelado.`);

  let perfil;
  try {
    perfil = await provedor.perfil(String(req.query.code));
  } catch (e) {
    console.error(`OAuth ${nomeProvedor}:`, e.message);
    return voltarComErro(res, tipo, `Não foi possível falar com o ${provedor.nome} agora. Tente de novo.`);
  }
  if (!perfil.email || !perfil.emailVerificado) {
    return voltarComErro(res, tipo, `Sua conta do ${provedor.nome} não tem um e-mail verificado. Use e-mail e senha.`);
  }

  try {
    const Model = tipo === "empresa" ? Empresa : Usuaria;
    const ligacao = await ContaOauth.findOne({ where: { provedor: nomeProvedor, tipoConta: tipo, idProvedor: perfil.id } });
    let conta = ligacao ? await Model.findByPk(ligacao.contaId) : null;

    // Primeira vez com este provedor: liga pelo e-mail (o provedor confirmou que o e-mail é da pessoa).
    if (!conta) {
      conta = await Model.findOne({ where: { email: perfil.email } });
      if (conta) {
        await ContaOauth.create({ tipoConta: tipo, contaId: conta.id, provedor: nomeProvedor, idProvedor: perfil.id });
        if (!conta.emailVerificadoEm) await conta.update({ emailVerificadoEm: new Date() });
      }
    }

    if (conta) {
      if (conta.suspensaEm) return voltarComErro(res, tipo, MENSAGEM_SUSPENSA);
      const { token } = gerarSessao(conta, tipo);
      return res.redirect(`${urlApp()}/entrar/social#token=${token}`);
    }

    // Sem conta: segue para o cadastro com os dados do provedor.
    const pre = criarToken(
      { uso: "oauth_cadastro", conta: tipo, provedor: nomeProvedor, idProvedor: perfil.id, email: perfil.email, nome: perfil.nome.slice(0, 100) },
      process.env.JWT_SECRET,
      VALIDADE_PRE_CADASTRO
    );
    return res.redirect(`${urlApp()}${paginaCadastro(tipo)}#oauth=${pre}`);
  } catch (e) {
    console.error("OAuth retorno:", e.name, e.message);
    return voltarComErro(res, tipo, "Erro interno. Tente novamente mais tarde.");
  }
}
