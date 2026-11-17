import { MENSAGEM_SUSPENSA } from "../services/suspensao.js";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Empresa, Usuaria } from "../models/index.js";
import { EmpresaCadastro, RedefinicaoSenha, UsuariaVerificacao, VerificacaoEmail } from "../models/Verificacao.js";
import { consultarCnpj, ErroConsultaCnpj } from "../services/cnpj.js";
import { consultaCpfAtiva, ErroConsultaCpf, verificarCpf } from "../services/cpf.js";
import { enviarEmail } from "../services/email.js";
import { excluirEmpresa, excluirUsuaria } from "../services/exclusaoConta.js";
import { Assinatura } from "../models/Premium.js";
import { validarCNPJ, validarCPF } from "../utils/documentos.js";
import { criarLimitador } from "../utils/limitador.js";
import { criarToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MINIMA = 8;
const VALIDADE_REDEFINICAO = 30 * 60 * 1000;
const VALIDADE_CONFIRMACAO = 24 * 60 * 60 * 1000;

const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");
const texto = (v) => (typeof v === "string" ? v.trim() : "");

const HASH_FICTICIO = bcrypt.hashSync("senha-que-nao-existe", SALT_ROUNDS);

const falhasLogin = criarLimitador({ janela: 15 * 60 * 1000, maximo: 5 });
const pedidosRedefinicao = criarLimitador({ janela: 60 * 60 * 1000, maximo: 3 });
const pedidosConfirmacao = criarLimitador({ janela: 60 * 60 * 1000, maximo: 3 });

function gerarSessao(conta, tipo) {
  const horas = Number(process.env.JWT_EXPIRES_HOURS ?? 8);
  const token = criarToken({ sub: conta.id, tipo, nome: conta.nome }, process.env.JWT_SECRET, horas * 3600);
  return { token, usuario: { id: conta.id, nome: conta.nome, email: conta.email, tipo, emailVerificado: Boolean(conta.emailVerificadoEm) } };
}

function erro(res, status, mensagem, campo) {
  return res.status(status).json({ erro: mensagem, campo });
}

function validarSenha(senha, confirmarSenha) {
  if (typeof senha !== "string" || senha.length < SENHA_MINIMA) return [`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`, "senha"];
  if (Buffer.byteLength(senha) > 72) return ["A senha pode ter até 72 caracteres.", "senha"];
  if (senha !== confirmarSenha) return ["As senhas não são iguais.", "confirmarSenha"];
  return null;
}

function validarEmail(email) {
  if (!email) return ["Informe o e-mail.", "email"];
  if (email.length > 150 || !EMAIL_REGEX.test(email)) return ["Digite um e-mail válido.", "email"];
  return null;
}

function validarTelefone(telefone) {
  if (telefone && (telefone.length < 10 || telefone.length > 11)) return ["Use DDD + número, com 10 ou 11 dígitos.", "telefone"];
  return null;
}

function validarNascimento(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return ["Informe a data de nascimento.", "nascimento"];
  const data = new Date(`${valor}T00:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) return ["Data de nascimento inválida.", "nascimento"];
  if (data > new Date() || data.getUTCFullYear() < 1900) return ["Data de nascimento inválida.", "nascimento"];
  return null;
}

export async function cadastrarUsuaria(req, res) {
  try {
    const nome = texto(req.body.nome);
    const email = texto(req.body.email).toLowerCase();
    const cpf = soDigitos(req.body.cpf);
    const nascimento = texto(req.body.nascimento);
    const telefone = soDigitos(req.body.telefone);
    const { senha, confirmarSenha } = req.body;

    if (nome.length < 2 || nome.length > 100) return erro(res, 400, "Informe seu nome completo.", "nome");
    if (!validarCPF(cpf)) return erro(res, 400, "CPF inválido. Confira os números.", "cpf");
    const falha = validarNascimento(nascimento) ?? validarEmail(email) ?? validarTelefone(telefone) ?? validarSenha(senha, confirmarSenha);
    if (falha) return erro(res, 400, ...falha);

    const existente = await Usuaria.findOne({ where: { [Op.or]: [{ email }, { cpf }] } });
    if (existente) {
      return existente.email === email
        ? erro(res, 409, "Este e-mail já está cadastrado.", "email")
        : erro(res, 409, "Este CPF já está cadastrado.", "cpf");
    }

    let verificacao = { cpfStatus: "nao_verificado", cpfFonte: null, cpfVerificadoEm: null };
    if (consultaCpfAtiva()) {
      try {
        const r = await verificarCpf({ cpf, nome, nascimento });
        verificacao = { cpfStatus: r.status, cpfFonte: r.fonte, cpfVerificadoEm: new Date() };
      } catch (e) {
        if (!(e instanceof ErroConsultaCpf)) throw e;
        if (e.tipo !== "indisponivel") return erro(res, 400, e.message, "cpf");
        verificacao = { cpfStatus: "pendente", cpfFonte: null, cpfVerificadoEm: null };
      }
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const usuaria = await sequelize.transaction(async (transaction) => {
      const conta = await Usuaria.create({ nome, cpf, email, telefone: telefone || null, senhaHash }, { transaction });
      await UsuariaVerificacao.create({ usuariaId: conta.id, ...verificacao }, { transaction });
      return conta;
    });

    const emailEnviado = await enviarConfirmacaoEmail("usuaria", usuaria);
    return res.status(201).json({ ...gerarSessao(usuaria, "usuaria"), verificacao: { cpf: verificacao.cpfStatus, emailEnviado } });
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function loginUsuaria(req, res) {
  return login(req, res, Usuaria, "usuaria");
}

function erroCnpj(res, e) {
  const status = { invalido: 400, nao_encontrado: 404, incompleto: 422, indisponivel: 503 }[e.tipo] ?? 503;
  return erro(res, status, e.message, "cnpj");
}

export async function consultarEmpresaPorCnpj(req, res) {
  const cnpj = soDigitos(req.params.cnpj);
  if (!validarCNPJ(cnpj)) return erro(res, 400, "CNPJ inválido. Confira os números.", "cnpj");
  try {
    return res.json({ empresa: await consultarCnpj(cnpj) });
  } catch (e) {
    if (e instanceof ErroConsultaCnpj) return erroCnpj(res, e);
    return tratarErro(res, e);
  }
}

export async function cadastrarEmpresa(req, res) {
  try {
    const cnpj = soDigitos(req.body.cnpj);
    const email = texto(req.body.email).toLowerCase();
    const telefone = soDigitos(req.body.telefone);
    const responsavelNome = texto(req.body.responsavelNome);
    const responsavelCargo = texto(req.body.responsavelCargo);
    const nomeExibicao = texto(req.body.nomeExibicao ?? req.body.nome);
    const { senha, confirmarSenha } = req.body;

    if (!validarCNPJ(cnpj)) return erro(res, 400, "CNPJ inválido. Confira os números.", "cnpj");
    if (responsavelNome.length < 2 || responsavelNome.length > 100) return erro(res, 400, "Informe o nome completo da pessoa responsável.", "responsavelNome");
    if (responsavelCargo.length > 80) return erro(res, 400, "O cargo pode ter até 80 caracteres.", "responsavelCargo");
    if (nomeExibicao.length > 150) return erro(res, 400, "O nome de exibição pode ter até 150 caracteres.", "nomeExibicao");
    const falha = validarEmail(email) ?? validarTelefone(telefone) ?? validarSenha(senha, confirmarSenha);
    if (falha) return erro(res, 400, ...falha);
    if (req.body.declaraRepresentacao !== true) {
      return erro(res, 400, "Confirme que você pode representar esta empresa.", "declaraRepresentacao");
    }

    const existente = await Empresa.findOne({ where: { [Op.or]: [{ email }, { cnpj }] } });
    if (existente) {
      return existente.email === email
        ? erro(res, 409, "Este e-mail já está cadastrado.", "email")
        : erro(res, 409, "Já existe uma conta para este CNPJ. Fale com a pessoa responsável por ela na sua empresa.", "cnpj");
    }

    let dados;
    try {
      dados = await consultarCnpj(cnpj);
    } catch (e) {
      if (e instanceof ErroConsultaCnpj) return erroCnpj(res, e);
      throw e;
    }
    if (!dados.ativa) {
      return erro(
        res,
        422,
        `A situação cadastral deste CNPJ é "${dados.situacao.descricao}". A Bloom aceita apenas empresas com CNPJ ativo. Se a situação já foi regularizada, escreva para contato@bloom.com.br.`,
        "cnpj"
      );
    }

    const nome = nomeExibicao || dados.nomeFantasia || dados.razaoSocial;
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const empresa = await sequelize.transaction(async (transaction) => {
      const conta = await Empresa.create({ nome: nome.slice(0, 150), cnpj, email, telefone: telefone || null, senhaHash }, { transaction });
      await EmpresaCadastro.create(
        {
          empresaId: conta.id,
          razaoSocial: dados.razaoSocial.slice(0, 200),
          nomeFantasia: dados.nomeFantasia.slice(0, 200) || null,
          situacaoCadastral: dados.situacao.descricao.slice(0, 30),
          cnaePrincipal: dados.cnaePrincipal?.codigo ?? null,
          cnaeDescricao: dados.cnaePrincipal?.descricao.slice(0, 255) ?? null,
          municipio: dados.municipio.slice(0, 100) || null,
          uf: dados.uf.slice(0, 2) || null,
          fonte: dados.fonte,
          consultadoEm: new Date(dados.consultadoEm),
          responsavelNome,
          responsavelCargo: responsavelCargo || null,
          declarouRepresentacaoEm: new Date(),
        },
        { transaction }
      );
      return conta;
    });

    const emailEnviado = await enviarConfirmacaoEmail("empresa", empresa);
    return res.status(201).json({ ...gerarSessao(empresa, "empresa"), verificacao: { representante: "pendente", emailEnviado } });
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function loginEmpresa(req, res) {
  return login(req, res, Empresa, "empresa");
}

async function login(req, res, Model, tipo) {
  try {
    const email = texto(req.body.email).toLowerCase();
    const { senha } = req.body;
    if (!email || typeof senha !== "string" || !senha) return erro(res, 400, "Preencha o e-mail e a senha.");

    const chave = `${tipo}:${req.ip}:${email}`;
    if (falhasLogin.bloqueado(chave)) {
      res.set("Retry-After", String(falhasLogin.espera(chave)));
      return erro(res, 429, "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.");
    }

    const conta = await Model.findOne({ where: { email } });
    const senhaOk = await bcrypt.compare(senha, conta?.senhaHash ?? HASH_FICTICIO);
    if (!conta || !senhaOk) {
      falhasLogin.registrar(chave);
      return erro(res, 401, "E-mail ou senha incorretos.");
    }

    falhasLogin.limpar(chave);
    if (conta.suspensaEm) return erro(res, 403, MENSAGEM_SUSPENSA);
    return res.json(gerarSessao(conta, tipo));
  } catch (e) {
    return tratarErro(res, e);
  }
}

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export async function enviarLinkRedefinicao(tipo, conta) {
  await RedefinicaoSenha.update({ usadoEm: new Date() }, { where: { tipoConta: tipo, contaId: conta.id, usadoEm: null } });
  const token = randomBytes(32).toString("hex");
  await RedefinicaoSenha.create({
    tipoConta: tipo,
    contaId: conta.id,
    tokenHash: hashToken(token),
    expiraEm: new Date(Date.now() + VALIDADE_REDEFINICAO),
  });

  const base = (process.env.FRONTEND_URL ?? "http://localhost:3006").replace(/\/$/, "");
  const link = `${base}/redefinir-senha?token=${token}`;
  return enviarEmail({
    para: conta.email,
    assunto: "Redefina sua senha da Bloom",
    texto: `Olá, ${conta.nome}.\n\nPara criar uma nova senha, acesse: ${link}\n\nO link vale por 30 minutos e só pode ser usado uma vez. Se você não pediu, ignore este e-mail.`,
    html: `<p>Olá, ${escaparHtml(conta.nome)}.</p><p><a href="${link}">Clique aqui para criar uma nova senha</a>.</p><p>O link vale por 30 minutos e só pode ser usado uma vez. Se você não pediu, ignore este e-mail.</p>`,
  });
}

export async function esqueciSenha(req, res) {
  const RESPOSTA = { mensagem: "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Ele vale por 30 minutos." };
  try {
    const email = texto(req.body.email).toLowerCase();
    const tipo = req.body.tipo === "empresa" ? "empresa" : "usuaria";
    const falha = validarEmail(email);
    if (falha) return erro(res, 400, ...falha);

    const chave = `${tipo}:${email}`;
    if (pedidosRedefinicao.bloqueado(chave)) return res.json(RESPOSTA);
    pedidosRedefinicao.registrar(chave);

    const Model = tipo === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findOne({ where: { email } });
    if (!conta) return res.json(RESPOSTA);

    await enviarLinkRedefinicao(tipo, conta);
    return res.json(RESPOSTA);
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function redefinirSenha(req, res) {
  try {
    const token = texto(req.body.token);
    const falha = validarSenha(req.body.senha, req.body.confirmarSenha);
    if (falha) return erro(res, 400, ...falha);

    const invalido = () => erro(res, 400, "Este link de redefinição é inválido ou expirou. Peça um novo.");
    if (!/^[0-9a-f]{64}$/.test(token)) return invalido();

    const pedido = await RedefinicaoSenha.findOne({ where: { tokenHash: hashToken(token) } });
    if (!pedido || pedido.usadoEm || pedido.expiraEm < new Date()) return invalido();

    const Model = pedido.tipoConta === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(pedido.contaId);
    if (!conta) return invalido();

    const senhaHash = await bcrypt.hash(req.body.senha, SALT_ROUNDS);
    await sequelize.transaction(async (transaction) => {
      await conta.update({ senhaHash }, { transaction });
      await pedido.update({ usadoEm: new Date() }, { transaction });
    });
    return res.json({ mensagem: "Senha redefinida. Entre com a nova senha.", tipo: pedido.tipoConta });
  } catch (e) {
    return tratarErro(res, e);
  }
}

async function enviarConfirmacaoEmail(tipo, conta) {
  try {
    await VerificacaoEmail.update({ usadoEm: new Date() }, { where: { tipoConta: tipo, contaId: conta.id, usadoEm: null } });
    const token = randomBytes(32).toString("hex");
    await VerificacaoEmail.create({
      tipoConta: tipo,
      contaId: conta.id,
      email: conta.email,
      tokenHash: hashToken(token),
      expiraEm: new Date(Date.now() + VALIDADE_CONFIRMACAO),
    });
    const base = (process.env.FRONTEND_URL ?? "http://localhost:3006").replace(/\/$/, "");
    const link = `${base}/confirmar-email?token=${token}`;
    return await enviarEmail({
      para: conta.email,
      assunto: "Confirme seu e-mail na Bloom",
      texto: `Olá, ${conta.nome}.\n\nPara confirmar que este e-mail é seu, acesse: ${link}\n\nO link vale por 24 horas. Se você não criou uma conta na Bloom, ignore este e-mail.`,
      html: `<p>Olá, ${escaparHtml(conta.nome)}.</p><p><a href="${link}">Clique aqui para confirmar seu e-mail</a>.</p><p>O link vale por 24 horas. Se você não criou uma conta na Bloom, ignore este e-mail.</p>`,
    });
  } catch (e) {
    console.error("Falha ao preparar a confirmação de e-mail:", e.message);
    return false;
  }
}

export async function confirmarEmail(req, res) {
  try {
    const token = texto(req.body.token);
    const invalido = () => erro(res, 400, "Este link de confirmação é inválido ou expirou. Entre na sua conta e peça um novo.");
    if (!/^[0-9a-f]{64}$/.test(token)) return invalido();

    const pedido = await VerificacaoEmail.findOne({ where: { tokenHash: hashToken(token) } });
    if (!pedido || pedido.usadoEm || pedido.expiraEm < new Date()) return invalido();

    const Model = pedido.tipoConta === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(pedido.contaId);
    if (!conta || conta.email !== pedido.email) return invalido();

    await sequelize.transaction(async (transaction) => {
      if (!conta.emailVerificadoEm) await conta.update({ emailVerificadoEm: new Date() }, { transaction });
      await pedido.update({ usadoEm: new Date() }, { transaction });
    });
    return res.json({ mensagem: "E-mail confirmado.", tipo: pedido.tipoConta });
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function reenviarConfirmacao(req, res) {
  try {
    const Model = req.auth.tipo === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");
    if (conta.emailVerificadoEm) return res.json({ mensagem: "Seu e-mail já está confirmado.", jaConfirmado: true });

    const chave = `${req.auth.tipo}:${conta.id}`;
    if (pedidosConfirmacao.bloqueado(chave)) return erro(res, 429, "Você já pediu alguns links. Aguarde um pouco e confira também a caixa de spam.");
    pedidosConfirmacao.registrar(chave);

    const enviado = await enviarConfirmacaoEmail(req.auth.tipo, conta);
    if (!enviado && process.env.NODE_ENV === "production") {
      return erro(res, 503, "Não foi possível enviar o e-mail agora. Tente de novo mais tarde.");
    }
    return res.json({ mensagem: `Enviamos um novo link para ${conta.email}. Ele vale por 24 horas.`, enviado });
  } catch (e) {
    return tratarErro(res, e);
  }
}

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export async function alterarSenha(req, res) {
  try {
    const Model = req.auth.tipo === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");

    const chave = `senha:${req.auth.tipo}:${conta.id}`;
    if (falhasLogin.bloqueado(chave)) return erro(res, 429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    if (typeof req.body.senhaAtual !== "string" || !(await bcrypt.compare(req.body.senhaAtual, conta.senhaHash))) {
      falhasLogin.registrar(chave);
      return erro(res, 400, "A senha atual não confere.", "senhaAtual");
    }
    const falha = validarSenha(req.body.novaSenha, req.body.confirmarSenha);
    if (falha) return erro(res, 400, falha[0], falha[1] === "senha" ? "novaSenha" : falha[1]);
    if (req.body.novaSenha === req.body.senhaAtual) return erro(res, 400, "A nova senha precisa ser diferente da atual.", "novaSenha");

    falhasLogin.limpar(chave);
    await conta.update({ senhaHash: await bcrypt.hash(req.body.novaSenha, SALT_ROUNDS) });
    return res.json({ mensagem: "Senha alterada." });
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function alterarEmail(req, res) {
  try {
    const Model = req.auth.tipo === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");

    const chave = `email:${req.auth.tipo}:${conta.id}`;
    if (falhasLogin.bloqueado(chave)) return erro(res, 429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    const email = texto(req.body.email).toLowerCase();
    if (email.length > 150 || !EMAIL_REGEX.test(email)) return erro(res, 400, "Digite um e-mail válido.", "email");
    if (email === conta.email) return erro(res, 400, "Este já é o e-mail da sua conta.", "email");
    if (typeof req.body.senha !== "string" || !(await bcrypt.compare(req.body.senha, conta.senhaHash))) {
      falhasLogin.registrar(chave);
      return erro(res, 400, "A senha não confere.", "senha");
    }
    if (await Model.findOne({ where: { email } })) return erro(res, 409, "Este e-mail já está cadastrado.", "email");

    falhasLogin.limpar(chave);
    await conta.update({ email, emailVerificadoEm: null });
    if (req.auth.tipo === "empresa") {
      await EmpresaCadastro.update(
        { representanteStatus: "pendente", representanteMetodo: null, representanteVerificadoEm: null },
        { where: { empresaId: conta.id, representanteMetodo: "dominio" } }
      );
    }
    const emailEnviado = await enviarConfirmacaoEmail(req.auth.tipo, conta);
    return res.json({
      mensagem: "E-mail alterado. Enviamos um link para confirmar o novo endereço.",
      emailEnviado,
      usuario: { id: conta.id, nome: conta.nome, email, tipo: req.auth.tipo, emailVerificado: false },
    });
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function excluirConta(req, res) {
  try {
    const Model = req.auth.tipo === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");

    const chave = `exclusao:${req.auth.tipo}:${conta.id}`;
    if (falhasLogin.bloqueado(chave)) return erro(res, 429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    if (req.body?.confirmacao !== "EXCLUIR") return erro(res, 400, 'Digite EXCLUIR para confirmar.', "confirmacao");
    if (typeof req.body.senha !== "string" || !(await bcrypt.compare(req.body.senha, conta.senhaHash))) {
      falhasLogin.registrar(chave);
      return erro(res, 400, "A senha não confere.", "senha");
    }

    const assinatura = await Assinatura.findOne({ where: { tipoConta: req.auth.tipo, contaId: conta.id, status: ["ativa", "pendente", "pausada"] } });
    if (assinatura) return erro(res, 409, "Cancele sua assinatura Premium (em Premium) antes de excluir a conta.");

    await (req.auth.tipo === "empresa" ? excluirEmpresa(conta.id) : excluirUsuaria(conta.id));
    return res.json({ mensagem: "Sua conta e seus dados foram excluídos." });
  } catch (e) {
    return tratarErro(res, e);
  }
}

export async function me(req, res) {
  try {
    const Model = req.auth.tipo === "empresa" ? Empresa : Usuaria;
    const conta = await Model.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");

    return res.json({
      usuario: { id: conta.id, nome: conta.nome, email: conta.email, tipo: req.auth.tipo, emailVerificado: Boolean(conta.emailVerificadoEm) },
    });
  } catch (e) {
    return tratarErro(res, e);
  }
}

function tratarErro(res, e) {
  if (e.name === "SequelizeUniqueConstraintError") {
    return erro(res, 409, "Já existe um cadastro com esses dados.");
  }
  console.error(e.name, e.message);
  return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
}
