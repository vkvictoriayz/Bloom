import bcrypt from "bcrypt";
import { fn, col, Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Admin, DashboardAdmin, LogAdmin, NIVEIS_ADMIN, registrarAcao } from "../models/Admin.js";
import { Comentario, Curtida, Publicacao } from "../models/Comunidade.js";
import { Candidatura, PerfilEmpresa, PublicacaoEmpresa, Vaga } from "../models/Empresarial.js";
import { Comunidade, ComunidadeMembro, ComunidadePublicacao } from "../models/Grupos.js";
import { Empresa, Usuaria } from "../models/index.js";
import { Assinatura, Pagamento, Plano } from "../models/Premium.js";
import { PublicacaoImagem } from "../models/RedeSocial.js";
import { EmpresaCadastro, UsuariaVerificacao } from "../models/Verificacao.js";
import { excluirEmpresa, excluirUsuaria } from "../services/exclusaoConta.js";
import { notificar } from "../services/notificacoes.js";
import { limparCacheSuspensao } from "../services/suspensao.js";
import { criarToken } from "../utils/jwt.js";
import { criarLimitador } from "../utils/limitador.js";

// Área de administração (/api/admin). Toda ação que muda algo fica em LOGS_ADMIN.

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const texto = (v) => (typeof v === "string" ? v.trim() : "");
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const POR_PAGINA = 25;
// Hash de uma senha qualquer: o login confere contra ele quando o usuário não
// existe, para levar o mesmo tempo e não revelar quais usuários existem.
const HASH_FICTICIO = bcrypt.hashSync("bloom-admin-tempo-constante", 12);
const falhasLogin = criarLimitador({ janela: 15 * 60 * 1000, maximo: 5 });
const paraLike = (s) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const pagina = (req) => Math.max(1, Number(req.query.pagina) || 1);

const comTratamento = (f) => async (req, res) => {
  try {
    return await f(req, res);
  } catch (e) {
    console.error("Admin:", e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

const adminJson = (a) => ({ id: a.id, nome: a.nome, usuario: a.usuario, email: a.email, nivel: a.nivel, ativo: a.ativo, criadoEm: a.criadoEm, ultimoAcesso: a.ultimoAcesso });

// Motivo obrigatório nas ações que afetam outra pessoa (vai para o registro e para o aviso).
function lerMotivo(req, res) {
  const motivo = texto(req.body?.motivo);
  if (motivo.length < 5 || motivo.length > 300) {
    erro(res, 400, "Explique o motivo (de 5 a 300 caracteres). Ele fica no registro e é enviado à conta.", "motivo");
    return null;
  }
  return motivo;
}

// ------------------------------------------------------------ Sessão

// POST /api/admin/login { usuario (nome de usuário ou e-mail), senha }
export const login = comTratamento(async (req, res) => {
  const usuario = texto(req.body?.usuario).toLowerCase();
  const senha = req.body?.senha;
  if (!usuario || typeof senha !== "string" || !senha) return erro(res, 400, "Preencha o usuário e a senha.");
  const chave = `admin:${req.ip}:${usuario}`;
  if (falhasLogin.bloqueado(chave)) return erro(res, 429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");

  const admin = await Admin.findOne({ where: { [Op.or]: [{ usuario }, { email: usuario }] } });
  const senhaOk = await bcrypt.compare(senha, admin?.senhaHash ?? HASH_FICTICIO);
  if (!admin || !senhaOk || !admin.ativo) {
    falhasLogin.registrar(chave);
    return erro(res, 401, "Usuário ou senha incorretos.");
  }
  falhasLogin.limpar(chave);
  await admin.update({ ultimoAcesso: new Date() });
  await registrarAcao(admin.id, "Entrou no painel", "ADMINS", admin.id);
  const horas = 4; // sessão de administração mais curta que a das contas
  const token = criarToken({ sub: admin.id, tipo: "admin", nome: admin.nome }, process.env.JWT_SECRET, horas * 3600);
  return res.json({ token, usuario: { id: admin.id, nome: admin.nome, email: admin.email, tipo: "admin", nivel: admin.nivel } });
});

// GET /api/admin/me
export const me = comTratamento(async (req, res) => res.json({ admin: adminJson(req.admin) }));

// PUT /api/admin/senha { senhaAtual, novaSenha, confirmarSenha }
export const alterarSenha = comTratamento(async (req, res) => {
  const { senhaAtual, novaSenha, confirmarSenha } = req.body ?? {};
  if (typeof senhaAtual !== "string" || !(await bcrypt.compare(senhaAtual, req.admin.senhaHash))) return erro(res, 400, "A senha atual não confere.", "senhaAtual");
  if (typeof novaSenha !== "string" || novaSenha.length < 10 || Buffer.byteLength(novaSenha) > 72) return erro(res, 400, "A nova senha precisa ter de 10 a 72 caracteres.", "novaSenha");
  if (novaSenha !== confirmarSenha) return erro(res, 400, "As senhas novas não são iguais.", "confirmarSenha");
  await req.admin.update({ senhaHash: await bcrypt.hash(novaSenha, 12) });
  await registrarAcao(req.admin.id, "Trocou a própria senha", "ADMINS", req.admin.id);
  return res.json({ mensagem: "Senha alterada." });
});

// ------------------------------------------------------------ Painel

async function totais() {
  const [usuarias, empresas, vagas, vagasAbertas, candidaturas, publicacoes, publicacoesEmpresa, comunidades] = await Promise.all([
    Usuaria.count(),
    Empresa.count(),
    Vaga.count(),
    Vaga.count({ where: { status: "Aberta" } }),
    Candidatura.count(),
    Publicacao.count(),
    PublicacaoEmpresa.count(),
    Comunidade.count(),
  ]);
  return { usuarias, empresas, vagas, vagasAbertas, candidaturas, publicacoes: publicacoes + publicacoesEmpresa, comunidades };
}

// Grava (ou atualiza) a foto do dia em DASHBOARD_ADMIN. As novidades do dia
// são a diferença para o último dia anterior registrado.
export async function registrarFotoDoDia() {
  const t = await totais();
  const hoje = new Date().toISOString().slice(0, 10);
  const anterior = await DashboardAdmin.findOne({ where: { data: { [Op.lt]: hoje } }, order: [["data", "DESC"]] });
  const novos = (atual, campo) => (anterior ? Math.max(0, atual - (anterior[campo] ?? 0)) : 0);
  const dados = {
    totalUsuarias: t.usuarias,
    totalEmpresas: t.empresas,
    totalVagas: t.vagas,
    totalCandidaturas: t.candidaturas,
    novasUsuarias: novos(t.usuarias, "totalUsuarias"),
    novasEmpresas: novos(t.empresas, "totalEmpresas"),
    novasVagas: novos(t.vagas, "totalVagas"),
    novasCandidaturas: novos(t.candidaturas, "totalCandidaturas"),
    atualizadoEm: new Date(),
  };
  const [linha, criada] = await DashboardAdmin.findOrCreate({ where: { data: hoje }, defaults: { data: hoje, ...dados } });
  if (!criada) await linha.update(dados);
  return t;
}

// GET /api/admin/dashboard
export const dashboard = comTratamento(async (req, res) => {
  const t = await registrarFotoDoDia();
  const [porStatus, cpfs, pendentes, suspensasU, suspensasE, assinaturasAtivas, receita, historico, recentes] = await Promise.all([
    Candidatura.findAll({ attributes: ["status", [fn("COUNT", col("id_candidatura")), "total"]], group: ["status"], raw: true }),
    UsuariaVerificacao.findAll({ attributes: ["cpfStatus", [fn("COUNT", sequelize.literal("*")), "total"]], group: ["cpfStatus"], raw: true }),
    EmpresaCadastro.count({ where: { representanteStatus: "pendente" } }),
    Usuaria.count({ where: { suspensaEm: { [Op.ne]: null } } }),
    Empresa.count({ where: { suspensaEm: { [Op.ne]: null } } }),
    Assinatura.count({ where: { status: "ativa" } }),
    Pagamento.sum("valor", { where: { status: "approved" } }),
    DashboardAdmin.findAll({ order: [["data", "DESC"]], limit: 30 }),
    LogAdmin.findAll({ order: [["id", "DESC"]], limit: 8 }),
  ]);
  const nomes = await nomesDosAdmins(recentes.map((l) => l.adminId));
  return res.json({
    totais: t,
    candidaturasPorStatus: Object.fromEntries(porStatus.map((l) => [l.status, Number(l.total)])),
    cpf: Object.fromEntries(cpfs.map((l) => [l.cpfStatus, Number(l.total)])),
    pendencias: { representantes: pendentes },
    suspensas: { usuarias: suspensasU, empresas: suspensasE },
    premium: { assinaturasAtivas, receitaAprovada: Number(receita ?? 0) },
    historico: historico.reverse().map((h) => ({
      data: h.data,
      usuarias: h.totalUsuarias,
      empresas: h.totalEmpresas,
      vagas: h.totalVagas,
      candidaturas: h.totalCandidaturas,
      novasUsuarias: h.novasUsuarias,
      novasEmpresas: h.novasEmpresas,
    })),
    acoesRecentes: recentes.map((l) => logJson(l, nomes)),
  });
});

// ------------------------------------------------------------ Contas

const mascararCpf = (cpf) => (cpf && cpf.length === 11 ? `***.***.${cpf.slice(6, 9)}-${cpf.slice(9)}` : "");
const formatarCnpj = (c) => (c && c.length === 14 ? `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}` : c ?? "");

function filtroConta(req, campos) {
  const where = {};
  const busca = texto(req.query.busca).slice(0, 100);
  if (busca) where[Op.or] = campos.map((c) => ({ [c]: { [Op.like]: paraLike(busca) } }));
  if (req.query.situacao === "suspensas") where.suspensaEm = { [Op.ne]: null };
  if (req.query.situacao === "ativas") where.suspensaEm = null;
  return where;
}

// GET /api/admin/candidatas?busca=&situacao=ativas|suspensas&pagina=
export const listarCandidatas = comTratamento(async (req, res) => {
  const where = filtroConta(req, ["nome", "email"]);
  const { rows, count } = await Usuaria.findAndCountAll({ where, order: [["id", "DESC"]], limit: POR_PAGINA, offset: (pagina(req) - 1) * POR_PAGINA });
  const ids = rows.map((u) => u.id);
  const [verif, cands, pubs, premium] = await Promise.all([
    UsuariaVerificacao.findAll({ where: { usuariaId: { [Op.in]: ids.length ? ids : [0] } } }),
    Candidatura.findAll({ attributes: ["usuariaId", [fn("COUNT", col("id_candidatura")), "n"]], where: { usuariaId: { [Op.in]: ids.length ? ids : [0] } }, group: ["usuariaId"], raw: true }),
    Publicacao.findAll({ attributes: ["usuariaId", [fn("COUNT", col("id_publicacao")), "n"]], where: { usuariaId: { [Op.in]: ids.length ? ids : [0] } }, group: ["usuariaId"], raw: true }),
    Assinatura.findAll({ attributes: ["contaId"], where: { tipoConta: "usuaria", status: "ativa", contaId: { [Op.in]: ids.length ? ids : [0] } } }),
  ]);
  const v = new Map(verif.map((x) => [x.usuariaId, x.cpfStatus]));
  const c = new Map(cands.map((x) => [x.usuariaId, Number(x.n)]));
  const p = new Map(pubs.map((x) => [x.usuariaId, Number(x.n)]));
  const pr = new Set(premium.map((x) => x.contaId));
  return res.json({
    total: count,
    porPagina: POR_PAGINA,
    candidatas: rows.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      cpf: mascararCpf(u.cpf),
      cpfStatus: v.get(u.id) ?? "nao_verificado",
      candidaturas: c.get(u.id) ?? 0,
      publicacoes: p.get(u.id) ?? 0,
      premium: pr.has(u.id),
      suspensaEm: u.suspensaEm,
      motivoSuspensao: u.motivoSuspensao,
    })),
  });
});

// GET /api/admin/candidatas/:id
export const verCandidata = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const u = id && (await Usuaria.findByPk(id));
  if (!u) return erro(res, 404, "Candidata não encontrada.");
  const [verif, cands, pubs, assinatura] = await Promise.all([
    UsuariaVerificacao.findOne({ where: { usuariaId: id } }),
    Candidatura.findAll({ where: { usuariaId: id }, order: [["id", "DESC"]], limit: 20 }),
    Publicacao.findAll({ where: { usuariaId: id }, order: [["criadaEm", "DESC"]], limit: 10 }),
    Assinatura.findOne({ where: { tipoConta: "usuaria", contaId: id }, order: [["id", "DESC"]] }),
  ]);
  const vagas = new Map((await Vaga.findAll({ where: { id: { [Op.in]: cands.map((c) => c.vagaId).concat(0) } } })).map((v) => [v.id, v.titulo]));
  return res.json({
    candidata: {
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone ?? "",
      cpf: mascararCpf(u.cpf),
      cpfStatus: verif?.cpfStatus ?? "nao_verificado",
      suspensaEm: u.suspensaEm,
      motivoSuspensao: u.motivoSuspensao,
      assinatura: assinatura ? { status: assinatura.status, criadaEm: assinatura.criadaEm } : null,
    },
    candidaturas: cands.map((c) => ({ id: c.id, vaga: vagas.get(c.vagaId) ?? "Vaga removida", status: c.status, data: c.data })),
    publicacoes: pubs.map((p) => ({ id: p.id, tipo: p.tipo, texto: p.texto, criadaEm: p.criadaEm })),
  });
});

// GET /api/admin/empresas?busca=&situacao=&representante=pendente&pagina=
export const listarEmpresas = comTratamento(async (req, res) => {
  const where = filtroConta(req, ["nome", "email", "cnpj"]);
  if (req.query.representante === "pendente") {
    const pend = await EmpresaCadastro.findAll({ attributes: ["empresaId"], where: { representanteStatus: "pendente" } });
    where.id = { [Op.in]: pend.map((p) => p.empresaId).concat(0) };
  }
  const { rows, count } = await Empresa.findAndCountAll({ where, order: [["id", "DESC"]], limit: POR_PAGINA, offset: (pagina(req) - 1) * POR_PAGINA });
  const ids = rows.map((e) => e.id).concat(0);
  const [cad, perfis, premium] = await Promise.all([
    EmpresaCadastro.findAll({ where: { empresaId: { [Op.in]: ids } } }),
    PerfilEmpresa.findAll({ where: { empresaId: { [Op.in]: ids } } }),
    Assinatura.findAll({ attributes: ["contaId"], where: { tipoConta: "empresa", status: "ativa", contaId: { [Op.in]: ids } } }),
  ]);
  const vagas = await Vaga.findAll({
    attributes: ["perfilEmpresaId", [fn("COUNT", col("id_vaga")), "n"]],
    where: { perfilEmpresaId: { [Op.in]: perfis.map((p) => p.id).concat(0) } },
    group: ["perfilEmpresaId"],
    raw: true,
  });
  const c = new Map(cad.map((x) => [x.empresaId, x]));
  const perfilDe = new Map(perfis.map((p) => [p.empresaId, p.id]));
  const nVagas = new Map(vagas.map((v) => [v.perfilEmpresaId, Number(v.n)]));
  const pr = new Set(premium.map((x) => x.contaId));
  return res.json({
    total: count,
    porPagina: POR_PAGINA,
    empresas: rows.map((e) => ({
      id: e.id,
      nome: e.nome,
      email: e.email,
      cnpj: formatarCnpj(e.cnpj),
      situacaoCadastral: c.get(e.id)?.situacaoCadastral ?? "",
      representante: c.get(e.id)?.representanteStatus ?? "pendente",
      vagas: nVagas.get(perfilDe.get(e.id)) ?? 0,
      premium: pr.has(e.id),
      suspensaEm: e.suspensaEm,
      motivoSuspensao: e.motivoSuspensao,
    })),
  });
});

// GET /api/admin/empresas/:id
export const verEmpresa = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const e = id && (await Empresa.findByPk(id));
  if (!e) return erro(res, 404, "Empresa não encontrada.");
  const [cad, perfil, assinatura] = await Promise.all([
    EmpresaCadastro.findOne({ where: { empresaId: id } }),
    PerfilEmpresa.findOne({ where: { empresaId: id } }),
    Assinatura.findOne({ where: { tipoConta: "empresa", contaId: id }, order: [["id", "DESC"]] }),
  ]);
  const vagas = perfil ? await Vaga.findAll({ where: { perfilEmpresaId: perfil.id }, order: [["id", "DESC"]], limit: 30 }) : [];
  return res.json({
    empresa: {
      id: e.id,
      nome: e.nome,
      email: e.email,
      telefone: e.telefone ?? "",
      cnpj: formatarCnpj(e.cnpj),
      suspensaEm: e.suspensaEm,
      motivoSuspensao: e.motivoSuspensao,
      assinatura: assinatura ? { status: assinatura.status, criadaEm: assinatura.criadaEm } : null,
    },
    cadastro: cad
      ? {
          razaoSocial: cad.razaoSocial,
          nomeFantasia: cad.nomeFantasia ?? "",
          situacaoCadastral: cad.situacaoCadastral,
          cnae: [cad.cnaePrincipal, cad.cnaeDescricao].filter(Boolean).join(" · "),
          municipio: [cad.municipio, cad.uf].filter(Boolean).join("/"),
          responsavelNome: cad.responsavelNome,
          responsavelCargo: cad.responsavelCargo ?? "",
          representante: cad.representanteStatus,
          declarouEm: cad.declarouRepresentacaoEm,
          consultadoEm: cad.consultadoEm,
        }
      : null,
    perfil: perfil ? { site: perfil.site ?? "", localizacao: perfil.localizacao ?? "", descricao: perfil.descricao ?? "" } : null,
    vagas: vagas.map((v) => ({ id: v.id, titulo: v.titulo, status: v.status, dataPublicacao: v.dataPublicacao })),
  });
});

const MODELOS = { candidatas: { Model: Usuaria, tabela: "CADASTRO_USUARIA", tipo: "usuaria", rotulo: "candidata" }, empresas: { Model: Empresa, tabela: "CADASTRO_EMPRESA", tipo: "empresa", rotulo: "empresa" } };

// POST /api/admin/:tipo/:id/suspender { motivo } — bloqueia o login e as sessões abertas.
// Empresa suspensa: as vagas abertas são pausadas (ela pode reabrir quando voltar).
export const suspender = comTratamento(async (req, res) => {
  const cfg = MODELOS[req.params.tipo];
  const id = idParam(req.params.id);
  const conta = cfg && id && (await cfg.Model.findByPk(id));
  if (!conta) return erro(res, 404, "Conta não encontrada.");
  if (conta.suspensaEm) return erro(res, 409, "Esta conta já está suspensa.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  let pausadas = 0;
  await sequelize.transaction(async (transaction) => {
    await conta.update({ suspensaEm: new Date(), motivoSuspensao: motivo }, { transaction });
    if (cfg.tipo === "empresa") {
      const perfil = await PerfilEmpresa.findOne({ where: { empresaId: id }, transaction });
      if (perfil) [pausadas] = await Vaga.update({ status: "Pausada" }, { where: { perfilEmpresaId: perfil.id, status: "Aberta" }, transaction });
    }
  });
  limparCacheSuspensao();
  await registrarAcao(req.admin.id, `Suspendeu ${cfg.rotulo}`, cfg.tabela, id, `${conta.nome}: ${motivo}${pausadas ? ` (${pausadas} vaga(s) pausada(s))` : ""}`);
  return res.json({ suspensaEm: conta.suspensaEm, motivoSuspensao: motivo, vagasPausadas: pausadas });
});

// POST /api/admin/:tipo/:id/reativar
export const reativar = comTratamento(async (req, res) => {
  const cfg = MODELOS[req.params.tipo];
  const id = idParam(req.params.id);
  const conta = cfg && id && (await cfg.Model.findByPk(id));
  if (!conta) return erro(res, 404, "Conta não encontrada.");
  if (!conta.suspensaEm) return erro(res, 409, "Esta conta não está suspensa.");
  await conta.update({ suspensaEm: null, motivoSuspensao: null });
  limparCacheSuspensao();
  await registrarAcao(req.admin.id, `Reativou ${cfg.rotulo}`, cfg.tabela, id, conta.nome);
  await notificar({ tipoConta: cfg.tipo, contaId: id, tipo: "plataforma", texto: "Sua conta foi reativada pela equipe da Bloom." });
  return res.json({ suspensaEm: null });
});

// DELETE /api/admin/:tipo/:id { motivo, confirmacao: "EXCLUIR" } — só "super".
export const excluirConta = comTratamento(async (req, res) => {
  const cfg = MODELOS[req.params.tipo];
  const id = idParam(req.params.id);
  const conta = cfg && id && (await cfg.Model.findByPk(id));
  if (!conta) return erro(res, 404, "Conta não encontrada.");
  if (req.body?.confirmacao !== "EXCLUIR") return erro(res, 400, "Digite EXCLUIR para confirmar.", "confirmacao");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  const aberta = await Assinatura.findOne({ where: { tipoConta: cfg.tipo, contaId: id, status: ["ativa", "pendente", "pausada"] } });
  if (aberta) return erro(res, 409, "A conta tem uma assinatura Premium em aberto. Cancele no Mercado Pago antes de excluir.");
  if (cfg.tipo === "empresa") await excluirEmpresa(id);
  else await excluirUsuaria(id);
  limparCacheSuspensao();
  await registrarAcao(req.admin.id, `Excluiu ${cfg.rotulo}`, cfg.tabela, id, `${conta.nome} <${conta.email}>: ${motivo}`);
  return res.status(204).end();
});

// PATCH /api/admin/empresas/:id/representante { status: "verificado" | "pendente" }
export const definirRepresentante = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const cad = id && (await EmpresaCadastro.findOne({ where: { empresaId: id } }));
  if (!cad) return erro(res, 404, "Esta empresa não tem dados de cadastro da Receita.");
  const status = texto(req.body?.status);
  if (!["verificado", "pendente"].includes(status)) return erro(res, 400, "Situação inválida.", "status");
  await cad.update({ representanteStatus: status });
  await registrarAcao(req.admin.id, status === "verificado" ? "Confirmou o representante da empresa" : "Voltou o representante para pendente", "EMPRESA_DADOS_CADASTRAIS", id, `${cad.razaoSocial} · ${cad.responsavelNome}`);
  if (status === "verificado") {
    await notificar({ tipoConta: "empresa", contaId: id, tipo: "plataforma", texto: "A equipe da Bloom confirmou o vínculo de quem administra a conta da empresa." });
  }
  return res.json({ representante: status });
});

// ------------------------------------------------------------ Vagas

// GET /api/admin/vagas?busca=&status=&pagina=
export const listarVagas = comTratamento(async (req, res) => {
  const where = {};
  const busca = texto(req.query.busca).slice(0, 100);
  if (busca) where.titulo = { [Op.like]: paraLike(busca) };
  if (["Rascunho", "Aberta", "Pausada", "Encerrada"].includes(req.query.status)) where.status = req.query.status;
  const { rows, count } = await Vaga.findAndCountAll({ where, order: [["id", "DESC"]], limit: POR_PAGINA, offset: (pagina(req) - 1) * POR_PAGINA });
  const perfis = await PerfilEmpresa.findAll({ where: { id: { [Op.in]: rows.map((v) => v.perfilEmpresaId).concat(0) } } });
  const empresas = await Empresa.findAll({ where: { id: { [Op.in]: perfis.map((p) => p.empresaId).concat(0) } } });
  const empresaDoPerfil = new Map(perfis.map((p) => [p.id, empresas.find((e) => e.id === p.empresaId)]));
  const cands = await Candidatura.findAll({
    attributes: ["vagaId", [fn("COUNT", col("id_candidatura")), "n"]],
    where: { vagaId: { [Op.in]: rows.map((v) => v.id).concat(0) } },
    group: ["vagaId"],
    raw: true,
  });
  const n = new Map(cands.map((c) => [c.vagaId, Number(c.n)]));
  return res.json({
    total: count,
    porPagina: POR_PAGINA,
    vagas: rows.map((v) => {
      const e = empresaDoPerfil.get(v.perfilEmpresaId);
      return { id: v.id, titulo: v.titulo, status: v.status, dataPublicacao: v.dataPublicacao, modalidade: v.modalidade, empresa: e ? { id: e.id, nome: e.nome } : null, candidaturas: n.get(v.id) ?? 0 };
    }),
  });
});

// PATCH /api/admin/vagas/:id/status { status: "Pausada" | "Encerrada", motivo }
export const moderarVaga = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const vaga = id && (await Vaga.findByPk(id));
  if (!vaga) return erro(res, 404, "Vaga não encontrada.");
  const status = texto(req.body?.status);
  if (!["Pausada", "Encerrada"].includes(status)) return erro(res, 400, "A administração pode pausar ou encerrar a vaga.", "status");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await vaga.update({ status });
  const perfil = await PerfilEmpresa.findByPk(vaga.perfilEmpresaId);
  await registrarAcao(req.admin.id, status === "Pausada" ? "Pausou vaga" : "Encerrou vaga", "VAGAS", id, `${vaga.titulo}: ${motivo}`);
  if (perfil) {
    await notificar({
      tipoConta: "empresa",
      contaId: perfil.empresaId,
      tipo: "plataforma",
      texto: `A equipe da Bloom ${status === "Pausada" ? "pausou" : "encerrou"} a vaga "${vaga.titulo}". Motivo: ${motivo}`.slice(0, 300),
      link: `/empresa/vagas/${id}`,
    });
  }
  return res.json({ vaga: { id, status } });
});

// ------------------------------------------------------------ Conteúdo

// GET /api/admin/publicacoes?origem=candidatas|empresas&busca=&pagina=
export const listarPublicacoes = comTratamento(async (req, res) => {
  const busca = texto(req.query.busca).slice(0, 100);
  const where = busca ? { texto: { [Op.like]: paraLike(busca) } } : {};
  const offset = (pagina(req) - 1) * POR_PAGINA;
  if (req.query.origem === "empresas") {
    const { rows, count } = await PublicacaoEmpresa.findAndCountAll({ where, order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: POR_PAGINA, offset });
    const empresas = new Map((await Empresa.findAll({ where: { id: { [Op.in]: rows.map((p) => p.empresaId).concat(0) } } })).map((e) => [e.id, e.nome]));
    return res.json({
      total: count,
      porPagina: POR_PAGINA,
      publicacoes: rows.map((p) => ({ id: p.id, origem: "empresa", tipo: p.tipo, texto: p.texto, criadaEm: p.criadaEm, autor: { id: p.empresaId, nome: empresas.get(p.empresaId) ?? "Empresa removida" }, comentarios: 0, imagem: null })),
    });
  }
  const { rows, count } = await Publicacao.findAndCountAll({ where, order: [["criadaEm", "DESC"], ["id", "DESC"]], limit: POR_PAGINA, offset });
  const ids = rows.map((p) => p.id).concat(0);
  const [autoras, comentarios, imagens, vinculos] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: rows.map((p) => p.usuariaId).concat(0) } } }),
    Comentario.findAll({ attributes: ["publicacaoId", [fn("COUNT", col("id_comentario")), "n"]], where: { publicacaoId: { [Op.in]: ids } }, group: ["publicacaoId"], raw: true }),
    PublicacaoImagem.findAll({ attributes: ["publicacaoId", "chave"], where: { publicacaoId: { [Op.in]: ids } } }),
    ComunidadePublicacao.findAll({ where: { publicacaoId: { [Op.in]: ids } } }),
  ]);
  const comunidades = new Map((await Comunidade.findAll({ where: { id: { [Op.in]: vinculos.map((v) => v.comunidadeId).concat(0) } } })).map((c) => [c.id, c.nome]));
  const nome = new Map(autoras.map((u) => [u.id, u.nome]));
  const nComent = new Map(comentarios.map((c) => [c.publicacaoId, Number(c.n)]));
  const img = new Map(imagens.map((i) => [i.publicacaoId, `/imagens/${i.chave}`]));
  const comunidadeDa = new Map(vinculos.map((v) => [v.publicacaoId, comunidades.get(v.comunidadeId)]));
  return res.json({
    total: count,
    porPagina: POR_PAGINA,
    publicacoes: rows.map((p) => ({
      id: p.id,
      origem: "candidata",
      tipo: p.tipo,
      texto: p.texto,
      criadaEm: p.criadaEm,
      autor: { id: p.usuariaId, nome: nome.get(p.usuariaId) ?? "Conta removida" },
      comentarios: nComent.get(p.id) ?? 0,
      imagem: img.get(p.id) ?? null,
      comunidade: comunidadeDa.get(p.id) ?? null,
    })),
  });
});

// GET /api/admin/publicacoes/:id/comentarios
export const listarComentarios = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id || !(await Publicacao.findByPk(id))) return erro(res, 404, "Publicação não encontrada.");
  const lista = await Comentario.findAll({ where: { publicacaoId: id }, order: [["criadoEm", "ASC"]] });
  const nome = new Map((await Usuaria.findAll({ where: { id: { [Op.in]: lista.map((c) => c.usuariaId).concat(0) } } })).map((u) => [u.id, u.nome]));
  return res.json({ comentarios: lista.map((c) => ({ id: c.id, texto: c.texto, criadoEm: c.criadoEm, autor: { id: c.usuariaId, nome: nome.get(c.usuariaId) ?? "Conta removida" } })) });
});

// DELETE /api/admin/publicacoes/:id { motivo } — publicação de candidata.
export const removerPublicacao = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const pub = id && (await Publicacao.findByPk(id));
  if (!pub) return erro(res, 404, "Publicação não encontrada.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await sequelize.transaction(async (transaction) => {
    await PublicacaoImagem.destroy({ where: { publicacaoId: id }, transaction });
    await Comentario.destroy({ where: { publicacaoId: id }, transaction });
    await Curtida.destroy({ where: { publicacaoId: id }, transaction });
    await ComunidadePublicacao.destroy({ where: { publicacaoId: id }, transaction });
    await pub.destroy({ transaction });
  });
  await registrarAcao(req.admin.id, "Removeu publicação", "PUBLICACAO", id, `"${pub.texto.slice(0, 120)}": ${motivo}`);
  await notificar({ tipoConta: "usuaria", contaId: pub.usuariaId, tipo: "plataforma", texto: `Uma publicação sua foi removida pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.status(204).end();
});

// DELETE /api/admin/publicacoes-empresa/:id { motivo }
export const removerPublicacaoEmpresa = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const pub = id && (await PublicacaoEmpresa.findByPk(id));
  if (!pub) return erro(res, 404, "Publicação não encontrada.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await pub.destroy();
  await registrarAcao(req.admin.id, "Removeu publicação de empresa", "PUBLICACAO_EMPRESA", id, `"${pub.texto.slice(0, 120)}": ${motivo}`);
  await notificar({ tipoConta: "empresa", contaId: pub.empresaId, tipo: "plataforma", texto: `Uma publicação da empresa foi removida pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.status(204).end();
});

// DELETE /api/admin/comentarios/:id { motivo }
export const removerComentario = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const c = id && (await Comentario.findByPk(id));
  if (!c) return erro(res, 404, "Comentário não encontrado.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await c.destroy();
  await registrarAcao(req.admin.id, "Removeu comentário", "COMENTARIO", id, `"${c.texto.slice(0, 120)}": ${motivo}`);
  await notificar({ tipoConta: "usuaria", contaId: c.usuariaId, tipo: "plataforma", texto: `Um comentário seu foi removido pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.json({ comentarios: await Comentario.count({ where: { publicacaoId: c.publicacaoId } }) });
});

// GET /api/admin/comunidades?busca=
export const listarComunidades = comTratamento(async (req, res) => {
  const busca = texto(req.query.busca).slice(0, 100);
  const where = busca ? { [Op.or]: [{ nome: { [Op.like]: paraLike(busca) } }, { tema: { [Op.like]: paraLike(busca) } }] } : {};
  const lista = await Comunidade.findAll({ where, order: [["id", "DESC"]], limit: 200 });
  const ids = lista.map((c) => c.id).concat(0);
  const [membros, pubs, criadoras] = await Promise.all([
    ComunidadeMembro.findAll({ attributes: ["comunidadeId", [fn("COUNT", col("id_membro")), "n"]], where: { comunidadeId: { [Op.in]: ids } }, group: ["comunidadeId"], raw: true }),
    ComunidadePublicacao.findAll({ attributes: ["comunidadeId", [fn("COUNT", col("id_vinculo")), "n"]], where: { comunidadeId: { [Op.in]: ids } }, group: ["comunidadeId"], raw: true }),
    Usuaria.findAll({ where: { id: { [Op.in]: lista.map((c) => c.criadoraId).concat(0) } } }),
  ]);
  const m = new Map(membros.map((x) => [x.comunidadeId, Number(x.n)]));
  const p = new Map(pubs.map((x) => [x.comunidadeId, Number(x.n)]));
  const nome = new Map(criadoras.map((u) => [u.id, u.nome]));
  return res.json({
    comunidades: lista.map((c) => ({ id: c.id, nome: c.nome, tema: c.tema, descricao: c.descricao, icone: c.icone ?? null, criadaEm: c.criadaEm, participantes: m.get(c.id) ?? 0, publicacoes: p.get(c.id) ?? 0, criadora: { id: c.criadoraId, nome: nome.get(c.criadoraId) ?? "Conta removida" } })),
  });
});

// DELETE /api/admin/comunidades/:id { motivo } — as publicações continuam no feed.
export const removerComunidade = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const c = id && (await Comunidade.findByPk(id));
  if (!c) return erro(res, 404, "Comunidade não encontrada.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await sequelize.transaction(async (transaction) => {
    await ComunidadePublicacao.destroy({ where: { comunidadeId: id }, transaction });
    await ComunidadeMembro.destroy({ where: { comunidadeId: id }, transaction });
    await c.destroy({ transaction });
  });
  await registrarAcao(req.admin.id, "Removeu comunidade", "COMUNIDADE", id, `${c.nome}: ${motivo}`);
  await notificar({ tipoConta: "usuaria", contaId: c.criadoraId, tipo: "plataforma", texto: `A comunidade "${c.nome}" foi removida pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.status(204).end();
});

// ------------------------------------------------------------ Pagamentos (leitura)

// GET /api/admin/pagamentos
export const pagamentos = comTratamento(async (req, res) => {
  const [assinaturas, lista, planos] = await Promise.all([
    Assinatura.findAll({ order: [["id", "DESC"]], limit: 100 }),
    Pagamento.findAll({ order: [["id", "DESC"]], limit: 100 }),
    Plano.findAll(),
  ]);
  const plano = new Map(planos.map((p) => [p.id, p.nome]));
  const idsU = [...assinaturas, ...lista].filter((x) => x.tipoConta === "usuaria").map((x) => x.contaId).concat(0);
  const idsE = [...assinaturas, ...lista].filter((x) => x.tipoConta === "empresa").map((x) => x.contaId).concat(0);
  const [us, es] = await Promise.all([Usuaria.findAll({ where: { id: { [Op.in]: idsU } } }), Empresa.findAll({ where: { id: { [Op.in]: idsE } } })]);
  const nome = (tipo, id) => (tipo === "empresa" ? es : us).find((x) => x.id === id)?.nome ?? "Conta removida";
  return res.json({
    assinaturas: assinaturas.map((a) => ({ id: a.id, conta: { tipo: a.tipoConta, id: a.contaId, nome: nome(a.tipoConta, a.contaId) }, plano: plano.get(a.planoId) ?? "", status: a.status, criadaEm: a.criadaEm, proximoPagamento: a.proximoPagamento })),
    pagamentos: lista.map((p) => ({ id: p.id, conta: { tipo: p.tipoConta, id: p.contaId, nome: nome(p.tipoConta, p.contaId) }, plano: plano.get(p.planoId) ?? "", status: p.status, valor: Number(p.valor), pagoEm: p.pagoEm, registradoEm: p.registradoEm })),
  });
});

// ------------------------------------------------------------ Administradores (só "super")

// GET /api/admin/admins
export const listarAdmins = comTratamento(async (req, res) => {
  const lista = await Admin.findAll({ order: [["id", "ASC"]] });
  return res.json({ admins: lista.map(adminJson) });
});

// POST /api/admin/admins { nome, usuario, email, senha, nivel }
export const criarAdmin = comTratamento(async (req, res) => {
  const nome = texto(req.body?.nome);
  const usuario = texto(req.body?.usuario).toLowerCase();
  const email = texto(req.body?.email).toLowerCase();
  const senha = req.body?.senha;
  const nivel = NIVEIS_ADMIN.includes(req.body?.nivel) ? req.body.nivel : "moderador";
  if (nome.length < 2 || nome.length > 100) return erro(res, 400, "Informe o nome (2 a 100 caracteres).", "nome");
  if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) return erro(res, 400, "Usuário: de 3 a 40 letras minúsculas, números, ponto, hífen ou sublinhado.", "usuario");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) return erro(res, 400, "Digite um e-mail válido.", "email");
  if (typeof senha !== "string" || senha.length < 10 || Buffer.byteLength(senha) > 72) return erro(res, 400, "A senha inicial precisa ter de 10 a 72 caracteres.", "senha");
  if (await Admin.findOne({ where: { [Op.or]: [{ usuario }, { email }] } })) return erro(res, 409, "Já existe um administrador com esse usuário ou e-mail.", "usuario");
  const novo = await Admin.create({ nome, usuario, email, nivel, senhaHash: await bcrypt.hash(senha, 12), ativo: true });
  await registrarAcao(req.admin.id, "Criou administrador", "ADMINS", novo.id, `${usuario} (${nivel})`);
  return res.status(201).json({ admin: adminJson(novo) });
});

// PATCH /api/admin/admins/:id { ativo?, nivel? } — ninguém tira o próprio acesso
// e sempre fica pelo menos um "super" ativo.
export const alterarAdmin = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const alvo = id && (await Admin.findByPk(id));
  if (!alvo) return erro(res, 404, "Administrador não encontrado.");
  if (alvo.id === req.admin.id) return erro(res, 400, "Você não pode mudar o seu próprio acesso.");
  const mudancas = {};
  if (typeof req.body?.ativo === "boolean") mudancas.ativo = req.body.ativo;
  if (req.body?.nivel !== undefined) {
    if (!NIVEIS_ADMIN.includes(req.body.nivel)) return erro(res, 400, "Nível inválido.", "nivel");
    mudancas.nivel = req.body.nivel;
  }
  const deixaDeSerSuper = alvo.nivel === "super" && alvo.ativo && (mudancas.ativo === false || (mudancas.nivel && mudancas.nivel !== "super"));
  if (deixaDeSerSuper && (await Admin.count({ where: { nivel: "super", ativo: true } })) <= 1) return erro(res, 400, "Precisa haver pelo menos um administrador com acesso total.");
  await alvo.update(mudancas);
  await registrarAcao(req.admin.id, "Alterou administrador", "ADMINS", id, `${alvo.usuario}: ${JSON.stringify(mudancas)}`);
  return res.json({ admin: adminJson(alvo) });
});

// ------------------------------------------------------------ Registro

async function nomesDosAdmins(ids) {
  const lista = await Admin.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: [...new Set(ids)].concat(0) } } });
  return new Map(lista.map((a) => [a.id, a.nome]));
}
const logJson = (l, nomes) => ({ id: l.id, admin: nomes.get(l.adminId) ?? "Administrador", acao: l.acao, tabela: l.tabela, registroId: l.registroId, detalhes: l.detalhes ?? "", em: l.em });

// GET /api/admin/registro?pagina=&busca=
export const registro = comTratamento(async (req, res) => {
  const busca = texto(req.query.busca).slice(0, 100);
  const where = busca ? { [Op.or]: [{ acao: { [Op.like]: paraLike(busca) } }, { detalhes: { [Op.like]: paraLike(busca) } }] } : {};
  const { rows, count } = await LogAdmin.findAndCountAll({ where, order: [["id", "DESC"]], limit: 50, offset: (pagina(req) - 1) * 50 });
  const nomes = await nomesDosAdmins(rows.map((l) => l.adminId));
  return res.json({ total: count, porPagina: 50, registros: rows.map((l) => logJson(l, nomes)) });
});
