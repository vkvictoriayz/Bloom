import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { Empresa, Usuaria } from "../models/index.js";
import { criarToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");
const texto = (v) => (typeof v === "string" ? v.trim() : "");

// Monta a resposta de sucesso: token + dados básicos (nunca a senha).
function gerarSessao(conta, tipo) {
  const horas = Number(process.env.JWT_EXPIRES_HOURS ?? 8);
  const token = criarToken(
    { sub: conta.id, tipo, nome: conta.nome },
    process.env.JWT_SECRET,
    horas * 3600
  );
  return { token, usuario: { id: conta.id, nome: conta.nome, email: conta.email, tipo } };
}

function erro(res, status, mensagem, campo) {
  return res.status(status).json({ erro: mensagem, campo });
}

// Validações simples, comuns às duas contas. Retorna mensagem de erro ou null.
function validarBasico({ nome, email, senha, confirmarSenha }) {
  if (!nome || !email || !senha) return ["Preencha todos os campos!"];
  if (!EMAIL_REGEX.test(email)) return ["Digite um e-mail válido!", "email"];
  if (senha.length < 6) return ["A senha deve ter pelo menos 6 caracteres!", "senha"];
  if (confirmarSenha !== undefined && senha !== confirmarSenha) {
    return ["As senhas não são iguais!", "confirmarSenha"];
  }
  return null;
}

// ---------------- Usuária ----------------

export async function cadastrarUsuaria(req, res) {
  try {
    const nome = texto(req.body.nome);
    const email = texto(req.body.email).toLowerCase();
    const cpf = soDigitos(req.body.cpf); // por enquanto qualquer CPF é aceito
    const telefone = soDigitos(req.body.telefone);
    const { senha, confirmarSenha } = req.body;

    const falha = validarBasico({ nome, email, senha, confirmarSenha });
    if (falha) return erro(res, 400, ...falha);
    if (!cpf || cpf.length > 11) return erro(res, 400, "Digite o CPF!", "cpf");

    const existente = await Usuaria.findOne({ where: { [Op.or]: [{ email }, { cpf }] } });
    if (existente) {
      return existente.email === email
        ? erro(res, 409, "Este e-mail já está cadastrado!", "email")
        : erro(res, 409, "Este CPF já está cadastrado!", "cpf");
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const usuaria = await Usuaria.create({ nome, cpf, email, telefone: telefone || null, senhaHash });

    return res.status(201).json(gerarSessao(usuaria, "usuaria"));
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function loginUsuaria(req, res) {
  return login(req, res, Usuaria, "usuaria");
}

// ---------------- Empresa ----------------

export async function cadastrarEmpresa(req, res) {
  try {
    const nome = texto(req.body.nome);
    const email = texto(req.body.email).toLowerCase();
    const cnpj = soDigitos(req.body.cnpj);
    const { senha, confirmarSenha } = req.body;

    const falha = validarBasico({ nome, email, senha, confirmarSenha });
    if (falha) return erro(res, 400, ...falha);
    if (!cnpj || cnpj.length > 14) return erro(res, 400, "Digite o CNPJ!", "cnpj");

    const existente = await Empresa.findOne({ where: { [Op.or]: [{ email }, { cnpj }] } });
    if (existente) {
      return existente.email === email
        ? erro(res, 409, "Este e-mail já está cadastrado!", "email")
        : erro(res, 409, "Este CNPJ já está cadastrado!", "cnpj");
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const empresa = await Empresa.create({ nome, cnpj, email, senhaHash });

    return res.status(201).json(gerarSessao(empresa, "empresa"));
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function loginEmpresa(req, res) {
  return login(req, res, Empresa, "empresa");
}

// ---------------- Compartilhado ----------------

async function login(req, res, Model, tipo) {
  try {
    const email = texto(req.body.email).toLowerCase();
    const { senha } = req.body;

    if (!email || typeof senha !== "string" || !senha) {
      return erro(res, 400, "Preencha todos os campos!");
    }

    const conta = await Model.findOne({ where: { email } });
    const senhaOk = conta ? await bcrypt.compare(senha, conta.senhaHash) : false;

    if (!senhaOk) return erro(res, 401, "E-mail ou senha incorretos!");

    return res.json(gerarSessao(conta, tipo));
  } catch (e) {
    return tratarErro(res, e);
  }
}

// Quem está logada (usa o token validado pelo middleware).
export async function me(req, res) {
  try {
    const Model = req.auth.tipo === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");

    return res.json({
      usuario: { id: conta.id, nome: conta.nome, email: conta.email, tipo: req.auth.tipo },
    });
  } catch (e) {
    return tratarErro(res, e);
  }
}

function tratarErro(res, e) {
  // Duas requisições ao mesmo tempo com o mesmo e-mail/CPF/CNPJ
  if (e.name === "SequelizeUniqueConstraintError") {
    return erro(res, 409, "Já existe um cadastro com esses dados.");
  }
  console.error(e);
  return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
}
