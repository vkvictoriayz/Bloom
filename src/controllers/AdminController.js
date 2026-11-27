import bcrypt from "bcrypt";
import { fn, col, Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Admin, Comunicado, DashboardAdmin, LogAdmin, NIVEIS_ADMIN, registrarAcao } from "../models/Admin.js";
import { Comentario, Curtida, Publicacao } from "../models/Comunidade.js";
import { Candidatura, PerfilEmpresa, PublicacaoEmpresa, Vaga } from "../models/Empresarial.js";
import { Comunidade, ComunidadeCapa, ComunidadeMembro, ComunidadePublicacao } from "../models/Grupos.js";
import { Empresa, Usuaria } from "../models/index.js";
import { Assinatura, Pagamento, Plano } from "../models/Premium.js";
import { PublicacaoImagem } from "../models/RedeSocial.js";
import { EmpresaCadastro, UsuariaVerificacao } from "../models/Verificacao.js";
import { UsuariaIdentificacao } from "../models/Identificacao.js";
import { excluirEmpresa, excluirUsuaria } from "../services/exclusaoConta.js";
import { notificar } from "../services/notificacoes.js";
import { limparCacheSuspensao } from "../services/suspensao.js";
import { criarToken, verificarToken } from "../utils/jwt.js";
import { cifrar, conferirCodigo, decifrar, enderecoOtp, novoSegredo, novosCodigosRecuperacao, usarCodigoRecuperacao } from "../utils/totp.js";
import { Denuncia, fecharDenunciasDoAlvo, MOTIVOS_DENUNCIA } from "../models/Denuncia.js";
import { enviarLinkRedefinicao } from "./AuthController.js";
import { criarLimitador } from "../utils/limitador.js";

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const texto = (v) => (typeof v === "string" ? v.trim() : "");
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const POR_PAGINA = 25;
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

const adminJson = (a) => ({
  id: a.id,
  nome: a.nome,
  usuario: a.usuario,
  email: a.email,
  nivel: a.nivel,
  ativo: a.ativo,
  criadoEm: a.criadoEm,
  ultimoAcesso: a.ultimoAcesso,
  doisFatores: Boolean(a.totpAtivo),
  deveTrocarSenha: Boolean(a.deveTrocarSenha),
});
const falhas2fa = criarLimitador({ janela: 15 * 60 * 1000, maximo: 5 });

async function abrirSessao(admin, res, comoEntrou = "Entrou no painel") {
  await admin.update({ ultimoAcesso: new Date() });
  await registrarAcao(admin.id, comoEntrou, "ADMINS", admin.id);
  const token = criarToken({ sub: admin.id, tipo: "admin", nome: admin.nome }, process.env.JWT_SECRET, 4 * 3600);
  return res.json({
    token,
    usuario: { id: admin.id, nome: admin.nome, email: admin.email, tipo: "admin", nivel: admin.nivel, deveTrocarSenha: Boolean(admin.deveTrocarSenha), doisFatores: Boolean(admin.totpAtivo) },
  });
}

async function conferirSegundoFator(admin, codigo) {
  if (!admin.totpAtivo || !admin.totpSegredo) return null;
  let segredo;
  try {
    segredo = decifrar(admin.totpSegredo);
  } catch {
    return null;
  }
  const passo = conferirCodigo(segredo, codigo, admin.totpUltimoPasso === null ? null : Number(admin.totpUltimoPasso));
  if (passo !== null) {
    await admin.update({ totpUltimoPasso: passo });
    return "app";
  }
  const restantes = usarCodigoRecuperacao(admin.codigosRecuperacao, codigo);
  if (restantes) {
    await admin.update({ codigosRecuperacao: JSON.stringify(restantes) });
    return `código de recuperação (restam ${restantes.length})`;
  }
  return null;
}

async function encerrarDenuncias(alvoTipo, alvoId, adminId, resolucao) {
  const fechadas = await fecharDenunciasDoAlvo(alvoTipo, alvoId, adminId, resolucao);
  for (const d of fechadas) {
    await notificar({ tipoConta: d.tipoConta, contaId: d.contaId, tipo: "plataforma", texto: "Analisamos a sua denúncia e tomamos uma providência. Obrigada por ajudar a cuidar da comunidade." });
  }
  return fechadas.length;
}

function lerMotivo(req, res) {
  const motivo = texto(req.body?.motivo);
  if (motivo.length < 5 || motivo.length > 300) {
    erro(res, 400, "Explique o motivo (de 5 a 300 caracteres). Ele fica no registro e é enviado à conta.", "motivo");
    return null;
  }
  return motivo;
}

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
  if (admin.totpAtivo) {
    const desafio = criarToken({ sub: admin.id, tipo: "admin-2fa" }, process.env.JWT_SECRET, 5 * 60);
    return res.json({ precisaCodigo: true, desafio });
  }
  return abrirSessao(admin, res);
});

export const loginCodigo = comTratamento(async (req, res) => {
  const desafio = verificarToken(String(req.body?.desafio ?? ""), process.env.JWT_SECRET);
  if (!desafio || desafio.tipo !== "admin-2fa") return erro(res, 401, "O tempo para digitar o código acabou. Entre de novo.");
  const chave = `admin2fa:${desafio.sub}`;
  if (falhas2fa.bloqueado(chave)) return erro(res, 429, "Muitos códigos errados. Aguarde alguns minutos e entre de novo.");
  const admin = await Admin.findByPk(desafio.sub);
  if (!admin || !admin.ativo || !admin.totpAtivo) return erro(res, 401, "Entre de novo.");
  const usado = await conferirSegundoFator(admin, req.body?.codigo);
  if (!usado) {
    falhas2fa.registrar(chave);
    return erro(res, 401, "Código inválido ou já usado. Confira o app autenticador.", "codigo");
  }
  falhas2fa.limpar(chave);
  return abrirSessao(admin, res, `Entrou no painel (duas etapas: ${usado})`);
});

export const me = comTratamento(async (req, res) => res.json({ admin: adminJson(req.admin) }));

export const alterarSenha = comTratamento(async (req, res) => {
  const { senhaAtual, novaSenha, confirmarSenha } = req.body ?? {};
  if (typeof senhaAtual !== "string" || !(await bcrypt.compare(senhaAtual, req.admin.senhaHash))) return erro(res, 400, "A senha atual não confere.", "senhaAtual");
  if (typeof novaSenha !== "string" || novaSenha.length < 10 || Buffer.byteLength(novaSenha) > 72) return erro(res, 400, "A nova senha precisa ter de 10 a 72 caracteres.", "novaSenha");
  if (novaSenha !== confirmarSenha) return erro(res, 400, "As senhas novas não são iguais.", "confirmarSenha");
  if (novaSenha === senhaAtual) return erro(res, 400, "A nova senha precisa ser diferente da atual.", "novaSenha");
  await req.admin.update({ senhaHash: await bcrypt.hash(novaSenha, 12), deveTrocarSenha: false });
  await registrarAcao(req.admin.id, "Trocou a própria senha", "ADMINS", req.admin.id);
  return res.json({ mensagem: "Senha alterada." });
});

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

export async function registrarFotoDoDia() {
  const t = await totais();
  const agora = new Date();
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
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

const PERIODOS = [7, 14, 30, 90];

async function graficosDoPainel(dias) {
  const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, type: QueryTypes.SELECT }));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const desde = new Date(hoje);
  desde.setDate(desde.getDate() - (dias - 1));
  const antes = new Date(desde);
  antes.setDate(antes.getDate() - dias);
  const fuso = -new Date().getTimezoneOffset();
  const dia = (d) => d.toLocaleDateString("sv-SE");
  const desdeDia = dia(antes);
  const r = { desde: antes, desdeDia, fuso };
  const local = (coluna) => `DATE(DATE_ADD(${coluna}, INTERVAL :fuso MINUTE))`;
  const [publicacoes, publicacoesEmpresa, comentarios, mensagensDiretas, mensagensEmpresas, candidaturas, vagasPublicadas, convites, vagasStatus, vagasArea, vagasModalidade, candidaturasArea, tiposPublicacao, denunciasMotivo, denunciasSituacao, comunidades, emailUsuarias, emailEmpresas, representantes, premiumPorTipo, contas] = await Promise.all([
    q(`SELECT ${local("criada_em")} dia, COUNT(*) n FROM PUBLICACAO WHERE criada_em >= :desde GROUP BY dia`, r),
    q(`SELECT ${local("criada_em")} dia, COUNT(*) n FROM PUBLICACAO_EMPRESA WHERE criada_em >= :desde GROUP BY dia`, r),
    q(`SELECT ${local("criado_em")} dia, COUNT(*) n FROM COMENTARIO WHERE criado_em >= :desde GROUP BY dia`, r),
    q(`SELECT ${local("enviada_em")} dia, COUNT(*) n FROM MENSAGEM_DIRETA WHERE enviada_em >= :desde GROUP BY dia`, r),
    q(`SELECT ${local("enviada_em")} dia, autor_tipo autor, COUNT(*) n FROM MENSAGEM WHERE enviada_em >= :desde GROUP BY dia, autor`, r),
    q("SELECT DATE(data_candidatura) dia, COUNT(*) n FROM CANDIDATURAS WHERE data_candidatura >= :desdeDia GROUP BY dia", r),
    q("SELECT DATE(data_publicacao) dia, COUNT(*) n FROM VAGAS WHERE data_publicacao >= :desdeDia GROUP BY dia", r),
    q(`SELECT ${local("criado_em")} dia, COUNT(*) n FROM CONVITE WHERE criado_em >= :desde GROUP BY dia`, r),
    q("SELECT COALESCE(status, 'Aberta') rotulo, COUNT(*) n FROM VAGAS GROUP BY rotulo"),
    q("SELECT COALESCE(NULLIF(area, ''), 'Não informada') rotulo, COUNT(*) n FROM VAGAS WHERE status = 'Aberta' GROUP BY rotulo ORDER BY n DESC LIMIT 6"),
    q("SELECT COALESCE(NULLIF(modalidade, ''), 'Não informada') rotulo, COUNT(*) n FROM VAGAS WHERE status = 'Aberta' GROUP BY rotulo ORDER BY n DESC"),
    q("SELECT COALESCE(NULLIF(v.area, ''), 'Não informada') rotulo, COUNT(*) n FROM CANDIDATURAS c JOIN VAGAS v ON v.id_vaga = c.id_vaga GROUP BY rotulo ORDER BY n DESC LIMIT 6"),
    q("SELECT tipo rotulo, COUNT(*) n FROM PUBLICACAO GROUP BY tipo ORDER BY n DESC"),
    q("SELECT motivo rotulo, COUNT(*) n FROM DENUNCIA GROUP BY motivo ORDER BY n DESC"),
    q("SELECT status rotulo, COUNT(*) n FROM DENUNCIA GROUP BY status"),
    q("SELECT c.nome rotulo, COUNT(m.id_membro) n FROM COMUNIDADE c LEFT JOIN COMUNIDADE_MEMBRO m ON m.id_comunidade = c.id_comunidade GROUP BY c.id_comunidade, c.nome ORDER BY n DESC, c.nome LIMIT 5"),
    q("SELECT SUM(email_verificado_em IS NOT NULL) confirmados, SUM(email_verificado_em IS NULL) pendentes FROM CADASTRO_USUARIA"),
    q("SELECT SUM(email_verificado_em IS NOT NULL) confirmados, SUM(email_verificado_em IS NULL) pendentes FROM CADASTRO_EMPRESA"),
    q("SELECT representante_status rotulo, COUNT(*) n FROM EMPRESA_DADOS_CADASTRAIS GROUP BY representante_status"),
    q("SELECT tipo_conta tipo, COUNT(DISTINCT id_conta) n FROM ASSINATURA WHERE status = 'ativa' GROUP BY tipo_conta"),
    q("SELECT (SELECT COUNT(*) FROM CADASTRO_USUARIA) usuarias, (SELECT COUNT(*) FROM CADASTRO_EMPRESA) empresas"),
  ]);

  const todosDias = Array.from({ length: dias * 2 }, (_, i) => {
    const d = new Date(antes);
    d.setDate(d.getDate() + i);
    return dia(d);
  });
  const chave = (v) => (typeof v === "string" ? v.slice(0, 10) : dia(new Date(v)));
  const serie = (linhas) => {
    const mapa = new Map();
    for (const l of linhas) mapa.set(chave(l.dia), (mapa.get(chave(l.dia)) ?? 0) + Number(l.n));
    return todosDias.map((d) => mapa.get(d) ?? 0);
  };
  const soma = (...listas) => todosDias.map((_, i) => listas.reduce((a, l) => a + l[i], 0));
  const atual = (s) => s.slice(dias);
  const total = (s) => s.reduce((a, b) => a + b, 0);
  const comparar = (s) => ({ atual: total(s.slice(dias)), anterior: total(s.slice(0, dias)) });

  const sPub = serie(publicacoes);
  const sPubE = serie(publicacoesEmpresa);
  const sCom = serie(comentarios);
  const sDir = serie(mensagensDiretas);
  const sMsgU = serie(mensagensEmpresas.filter((m) => m.autor !== "empresa"));
  const sMsgE = serie(mensagensEmpresas.filter((m) => m.autor === "empresa"));
  const sCand = serie(candidaturas);
  const sVagas = serie(vagasPublicadas);
  const sConv = serie(convites);
  const sMensagens = soma(sDir, sMsgU, sMsgE);
  const lista = (linhas) => linhas.map((l) => ({ rotulo: l.rotulo, total: Number(l.n) }));
  const premium = Object.fromEntries(premiumPorTipo.map((p) => [p.tipo, Number(p.n)]));
  const totalUsuarias = Number(contas[0]?.usuarias ?? 0);
  const totalEmpresas = Number(contas[0]?.empresas ?? 0);

  return {
    periodo: { dias, desde: dia(desde), ate: dia(hoje), anteriorDesde: dia(antes) },
    atividade: {
      dias: todosDias.slice(dias),
      publicacoes: atual(soma(sPub, sPubE)),
      comentarios: atual(sCom),
      mensagens: atual(sMensagens),
      candidaturas: atual(sCand),
    },
    vagasECandidaturas: { dias: todosDias.slice(dias), vagas: atual(sVagas), candidaturas: atual(sCand) },
    atividadePorConta: {
      dias: todosDias.slice(dias),
      candidatas: atual(soma(sPub, sCom, sDir, sMsgU, sCand)),
      empresas: atual(soma(sPubE, sMsgE, sVagas, sConv)),
    },
    comparativo: {
      candidaturas: comparar(sCand),
      vagas: comparar(sVagas),
      publicacoes: comparar(soma(sPub, sPubE)),
      mensagens: comparar(sMensagens),
    },
    contas: {
      usuarias: { premium: premium.usuaria ?? 0, gratuitas: Math.max(0, totalUsuarias - (premium.usuaria ?? 0)) },
      empresas: { premium: premium.empresa ?? 0, gratuitas: Math.max(0, totalEmpresas - (premium.empresa ?? 0)) },
    },
    vagasPorStatus: lista(vagasStatus),
    vagasPorArea: lista(vagasArea),
    vagasPorModalidade: lista(vagasModalidade),
    candidaturasPorArea: lista(candidaturasArea),
    publicacoesPorTipo: lista(tiposPublicacao),
    denunciasPorMotivo: lista(denunciasMotivo),
    denunciasPorSituacao: lista(denunciasSituacao),
    comunidadesMaisAtivas: lista(comunidades),
    emails: {
      usuarias: { confirmados: Number(emailUsuarias[0]?.confirmados ?? 0), pendentes: Number(emailUsuarias[0]?.pendentes ?? 0) },
      empresas: { confirmados: Number(emailEmpresas[0]?.confirmados ?? 0), pendentes: Number(emailEmpresas[0]?.pendentes ?? 0) },
    },
    representantes: lista(representantes),
  };
}

export const dashboard = comTratamento(async (req, res) => {
  const dias = PERIODOS.includes(Number(req.query.dias)) ? Number(req.query.dias) : 30;
  const t = await registrarFotoDoDia();
  const [porStatus, cpfs, pendentes, suspensasU, suspensasE, assinaturasAtivas, receita, historico, recentes, denunciasAbertas] = await Promise.all([
    Candidatura.findAll({ attributes: ["status", [fn("COUNT", col("id_candidatura")), "total"]], group: ["status"], raw: true }),
    UsuariaVerificacao.findAll({ attributes: ["cpfStatus", [fn("COUNT", sequelize.literal("*")), "total"]], group: ["cpfStatus"], raw: true }),
    EmpresaCadastro.count({ where: { representanteStatus: "pendente" } }),
    Usuaria.count({ where: { suspensaEm: { [Op.ne]: null } } }),
    Empresa.count({ where: { suspensaEm: { [Op.ne]: null } } }),
    Assinatura.count({ where: { status: "ativa" } }),
    Pagamento.sum("valor", { where: { status: "approved" } }),
    DashboardAdmin.findAll({ order: [["data", "DESC"]], limit: 90 }),
    LogAdmin.findAll({ order: [["id", "DESC"]], limit: 8 }),
    Denuncia.count({ where: { status: "aberta" } }),
  ]);
  const nomes = await nomesDosAdmins(recentes.map((l) => l.adminId));
  return res.json({
    totais: t,
    candidaturasPorStatus: Object.fromEntries(porStatus.map((l) => [l.status, Number(l.total)])),
    cpf: Object.fromEntries(cpfs.map((l) => [l.cpfStatus, Number(l.total)])),
    pendencias: { representantes: pendentes, denuncias: denunciasAbertas },
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
    graficos: await graficosDoPainel(dias),
  });
});

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
  // Nome civil é dado de identificação: mostrado ao painel só quando difere do nome exibido,
  // e cada consulta fica registrada. A identidade de gênero nunca é enviada ao painel.
  const ident = await UsuariaIdentificacao.findByPk(id, { attributes: ["nomeCivil"] });
  const nomeCivil = ident && ident.nomeCivil !== u.nome ? ident.nomeCivil : null;
  if (nomeCivil) await registrarAcao(req.admin.id, "ver_nome_civil", "CADASTRO_USUARIA", id);
  return res.json({
    candidata: {
      id: u.id,
      nome: u.nome,
      nomeCivil,
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
  await encerrarDenuncias(cfg.tipo === "empresa" ? "empresa" : "perfil", id, req.admin.id, `Conta suspensa: ${motivo}`);
  await registrarAcao(req.admin.id, `Suspendeu ${cfg.rotulo}`, cfg.tabela, id, `${conta.nome}: ${motivo}${pausadas ? ` (${pausadas} vaga(s) pausada(s))` : ""}`);
  return res.json({ suspensaEm: conta.suspensaEm, motivoSuspensao: motivo, vagasPausadas: pausadas });
});

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

export const definirRepresentante = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const cad = id && (await EmpresaCadastro.findOne({ where: { empresaId: id } }));
  if (!cad) return erro(res, 404, "Esta empresa não tem dados de cadastro da Receita.");
  const status = texto(req.body?.status);
  if (!["verificado", "pendente"].includes(status)) return erro(res, 400, "Situação inválida.", "status");
  await cad.update(
    status === "verificado"
      ? { representanteStatus: status, representanteMetodo: "equipe", representanteVerificadoEm: new Date() }
      : { representanteStatus: status, representanteMetodo: null, representanteVerificadoEm: null }
  );
  await registrarAcao(req.admin.id, status === "verificado" ? "Confirmou o representante da empresa" : "Voltou o representante para pendente", "EMPRESA_DADOS_CADASTRAIS", id, `${cad.razaoSocial} · ${cad.responsavelNome}`);
  if (status === "verificado") {
    await notificar({ tipoConta: "empresa", contaId: id, tipo: "plataforma", texto: "A equipe da Bloom confirmou o vínculo de quem administra a conta da empresa." });
  }
  return res.json({ representante: status });
});

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
  await encerrarDenuncias("vaga", id, req.admin.id, `Vaga ${status === "Pausada" ? "pausada" : "encerrada"}: ${motivo}`);
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

export const listarComentarios = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id || !(await Publicacao.findByPk(id))) return erro(res, 404, "Publicação não encontrada.");
  const lista = await Comentario.findAll({ where: { publicacaoId: id }, order: [["criadoEm", "ASC"]] });
  const nome = new Map((await Usuaria.findAll({ where: { id: { [Op.in]: lista.map((c) => c.usuariaId).concat(0) } } })).map((u) => [u.id, u.nome]));
  return res.json({ comentarios: lista.map((c) => ({ id: c.id, texto: c.texto, criadoEm: c.criadoEm, autor: { id: c.usuariaId, nome: nome.get(c.usuariaId) ?? "Conta removida" } })) });
});

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
  await encerrarDenuncias("publicacao", id, req.admin.id, `Publicação removida: ${motivo}`);
  await notificar({ tipoConta: "usuaria", contaId: pub.usuariaId, tipo: "plataforma", texto: `Uma publicação sua foi removida pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.status(204).end();
});

export const removerPublicacaoEmpresa = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const pub = id && (await PublicacaoEmpresa.findByPk(id));
  if (!pub) return erro(res, 404, "Publicação não encontrada.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await pub.destroy();
  await registrarAcao(req.admin.id, "Removeu publicação de empresa", "PUBLICACAO_EMPRESA", id, `"${pub.texto.slice(0, 120)}": ${motivo}`);
  await encerrarDenuncias("publicacao_empresa", id, req.admin.id, `Publicação removida: ${motivo}`);
  await notificar({ tipoConta: "empresa", contaId: pub.empresaId, tipo: "plataforma", texto: `Uma publicação da empresa foi removida pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.status(204).end();
});

export const removerComentario = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const c = id && (await Comentario.findByPk(id));
  if (!c) return erro(res, 404, "Comentário não encontrado.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await c.destroy();
  await registrarAcao(req.admin.id, "Removeu comentário", "COMENTARIO", id, `"${c.texto.slice(0, 120)}": ${motivo}`);
  await encerrarDenuncias("comentario", id, req.admin.id, `Comentário removido: ${motivo}`);
  await notificar({ tipoConta: "usuaria", contaId: c.usuariaId, tipo: "plataforma", texto: `Um comentário seu foi removido pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.json({ comentarios: await Comentario.count({ where: { publicacaoId: c.publicacaoId } }) });
});

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

export const removerComunidade = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const c = id && (await Comunidade.findByPk(id));
  if (!c) return erro(res, 404, "Comunidade não encontrada.");
  const motivo = lerMotivo(req, res);
  if (!motivo) return undefined;
  await sequelize.transaction(async (transaction) => {
    await ComunidadePublicacao.destroy({ where: { comunidadeId: id }, transaction });
    await ComunidadeMembro.destroy({ where: { comunidadeId: id }, transaction });
    await ComunidadeCapa.destroy({ where: { comunidadeId: id }, transaction });
    await c.destroy({ transaction });
  });
  await registrarAcao(req.admin.id, "Removeu comunidade", "COMUNIDADE", id, `${c.nome}: ${motivo}`);
  await encerrarDenuncias("comunidade", id, req.admin.id, `Comunidade removida: ${motivo}`);
  await notificar({ tipoConta: "usuaria", contaId: c.criadoraId, tipo: "plataforma", texto: `A comunidade "${c.nome}" foi removida pela equipe da Bloom. Motivo: ${motivo}`.slice(0, 300) });
  return res.status(204).end();
});

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

export const listarAdmins = comTratamento(async (req, res) => {
  const lista = await Admin.findAll({ order: [["id", "ASC"]] });
  return res.json({ admins: lista.map(adminJson) });
});

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
  const novo = await Admin.create({ nome, usuario, email, nivel, senhaHash: await bcrypt.hash(senha, 12), ativo: true, deveTrocarSenha: true });
  await registrarAcao(req.admin.id, "Criou administrador", "ADMINS", novo.id, `${usuario} (${nivel})`);
  return res.status(201).json({ admin: adminJson(novo) });
});

export const alterarAdmin = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const alvo = id && (await Admin.findByPk(id));
  if (!alvo) return erro(res, 404, "Administrador não encontrado.");
  if (alvo.id === req.admin.id) return erro(res, 400, "Você não pode mudar o seu próprio acesso.");
  const mudancas = {};
  if (typeof req.body?.ativo === "boolean") mudancas.ativo = req.body.ativo;
  if (req.body?.desligarDoisFatores === true) Object.assign(mudancas, { totpAtivo: false, totpSegredo: null, totpUltimoPasso: null, codigosRecuperacao: null });
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

async function nomesDosAdmins(ids) {
  const lista = await Admin.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: [...new Set(ids)].concat(0) } } });
  return new Map(lista.map((a) => [a.id, a.nome]));
}
const logJson = (l, nomes) => ({ id: l.id, admin: nomes.get(l.adminId) ?? "Administrador", acao: l.acao, tabela: l.tabela, registroId: l.registroId, detalhes: l.detalhes ?? "", em: l.em });

export const registro = comTratamento(async (req, res) => {
  const busca = texto(req.query.busca).slice(0, 100);
  const where = busca ? { [Op.or]: [{ acao: { [Op.like]: paraLike(busca) } }, { detalhes: { [Op.like]: paraLike(busca) } }] } : {};
  const { rows, count } = await LogAdmin.findAndCountAll({ where, order: [["id", "DESC"]], limit: 50, offset: (pagina(req) - 1) * 50 });
  const nomes = await nomesDosAdmins(rows.map((l) => l.adminId));
  return res.json({ total: count, porPagina: 50, registros: rows.map((l) => logJson(l, nomes)) });
});

export const enviarRedefinicao = comTratamento(async (req, res) => {
  const cfg = MODELOS[req.params.tipo];
  const id = idParam(req.params.id);
  const conta = cfg && id && (await cfg.Model.findByPk(id));
  if (!conta) return erro(res, 404, "Conta não encontrada.");
  const enviado = await enviarLinkRedefinicao(cfg.tipo, conta);
  await registrarAcao(req.admin.id, "Enviou link de redefinição de senha", cfg.tabela, id, conta.email);
  return res.json({
    enviado,
    mensagem: enviado
      ? `Link enviado para ${conta.email}. Ele vale por 30 minutos.`
      : "O link foi criado, mas o e-mail não está configurado (RESEND_API_KEY). Em desenvolvimento, o link aparece no terminal da API.",
  });
});

async function resumirAlvos(denuncias) {
  const ids = (tipo) => [...new Set(denuncias.filter((d) => d.alvoTipo === tipo).map((d) => d.alvoId))].concat(0);
  const [pubs, pubsEmpresa, comentarios, perfis, empresas, vagas, comunidades] = await Promise.all([
    Publicacao.findAll({ where: { id: { [Op.in]: ids("publicacao") } } }),
    PublicacaoEmpresa.findAll({ where: { id: { [Op.in]: ids("publicacao_empresa") } } }),
    Comentario.findAll({ where: { id: { [Op.in]: ids("comentario") } } }),
    Usuaria.findAll({ where: { id: { [Op.in]: ids("perfil") } } }),
    Empresa.findAll({ where: { id: { [Op.in]: ids("empresa") } } }),
    Vaga.findAll({ where: { id: { [Op.in]: ids("vaga") } } }),
    Comunidade.findAll({ where: { id: { [Op.in]: ids("comunidade") } } }),
  ]);
  const idsU = [...pubs.map((p) => p.usuariaId), ...comentarios.map((c) => c.usuariaId), ...comunidades.map((c) => c.criadoraId)];
  const perfisEmpresa = await PerfilEmpresa.findAll({ where: { id: { [Op.in]: vagas.map((v) => v.perfilEmpresaId).concat(0) } } });
  const idsE = [...pubsEmpresa.map((p) => p.empresaId), ...perfisEmpresa.map((p) => p.empresaId)];
  const [us, es] = await Promise.all([
    Usuaria.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: idsU.concat(0) } } }),
    Empresa.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: idsE.concat(0) } } }),
  ]);
  const nomeU = new Map(us.map((u) => [u.id, u.nome]));
  const nomeE = new Map(es.map((e) => [e.id, e.nome]));
  const mapa = new Map();
  for (const p of pubs) mapa.set(`publicacao:${p.id}`, { texto: p.texto || "(publicação só com imagem)", dono: { tipo: "usuaria", id: p.usuariaId, nome: nomeU.get(p.usuariaId) ?? "Conta removida" } });
  for (const p of pubsEmpresa) mapa.set(`publicacao_empresa:${p.id}`, { texto: p.texto, dono: { tipo: "empresa", id: p.empresaId, nome: nomeE.get(p.empresaId) ?? "Empresa removida" } });
  for (const c of comentarios) mapa.set(`comentario:${c.id}`, { texto: c.texto, publicacaoId: c.publicacaoId, dono: { tipo: "usuaria", id: c.usuariaId, nome: nomeU.get(c.usuariaId) ?? "Conta removida" } });
  for (const u of perfis) mapa.set(`perfil:${u.id}`, { texto: u.nome, dono: { tipo: "usuaria", id: u.id, nome: u.nome }, suspensa: Boolean(u.suspensaEm) });
  for (const e of empresas) mapa.set(`empresa:${e.id}`, { texto: e.nome, dono: { tipo: "empresa", id: e.id, nome: e.nome }, suspensa: Boolean(e.suspensaEm) });
  for (const v of vagas) {
    const empId = perfisEmpresa.find((p) => p.id === v.perfilEmpresaId)?.empresaId;
    mapa.set(`vaga:${v.id}`, { texto: v.titulo, status: v.status, dono: { tipo: "empresa", id: empId, nome: nomeE.get(empId) ?? "Empresa removida" } });
  }
  for (const c of comunidades) mapa.set(`comunidade:${c.id}`, { texto: `${c.nome} — ${c.descricao}`, dono: { tipo: "usuaria", id: c.criadoraId, nome: nomeU.get(c.criadoraId) ?? "Conta removida" } });
  return mapa;
}

export const listarDenuncias = comTratamento(async (req, res) => {
  const status = ["aberta", "resolvida", "descartada"].includes(req.query.status) ? req.query.status : "aberta";
  const { rows, count } = await Denuncia.findAndCountAll({
    where: { status },
    order: status === "aberta" ? [["criadaEm", "ASC"]] : [["resolvidaEm", "DESC"]],
    limit: POR_PAGINA,
    offset: (pagina(req) - 1) * POR_PAGINA,
  });
  const [alvos, abertasPorAlvo] = await Promise.all([
    resumirAlvos(rows),
    Denuncia.findAll({ attributes: ["alvoTipo", "alvoId", [fn("COUNT", col("id_denuncia")), "n"]], where: { status: "aberta" }, group: ["alvoTipo", "alvoId"], raw: true }),
  ]);
  const nAbertas = new Map(abertasPorAlvo.map((x) => [`${x.alvoTipo}:${x.alvoId}`, Number(x.n)]));
  const idsU = rows.filter((d) => d.tipoConta === "usuaria").map((d) => d.contaId).concat(0);
  const idsE = rows.filter((d) => d.tipoConta === "empresa").map((d) => d.contaId).concat(0);
  const [us, es, admins] = await Promise.all([
    Usuaria.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: idsU } } }),
    Empresa.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: idsE } } }),
    nomesDosAdmins(rows.map((d) => d.adminId).filter(Boolean)),
  ]);
  const quem = (d) => (d.tipoConta === "empresa" ? es : us).find((x) => x.id === d.contaId)?.nome ?? "Conta removida";
  return res.json({
    total: count,
    porPagina: POR_PAGINA,
    denuncias: rows.map((d) => ({
      id: d.id,
      alvo: { tipo: d.alvoTipo, id: d.alvoId, ...(alvos.get(`${d.alvoTipo}:${d.alvoId}`) ?? { removido: true }) },
      denunciasAbertasNoAlvo: nAbertas.get(`${d.alvoTipo}:${d.alvoId}`) ?? 0,
      motivo: d.motivo,
      motivoRotulo: MOTIVOS_DENUNCIA[d.motivo] ?? d.motivo,
      descricao: d.descricao ?? "",
      denunciante: { tipo: d.tipoConta, id: d.contaId, nome: quem(d) },
      status: d.status,
      criadaEm: d.criadaEm,
      resolucao: d.resolucao ?? "",
      resolvidaEm: d.resolvidaEm,
      resolvidaPor: d.adminId ? admins.get(d.adminId) ?? "Administrador" : null,
    })),
  });
});

export const decidirDenuncia = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const d = id && (await Denuncia.findByPk(id));
  if (!d) return erro(res, 404, "Denúncia não encontrada.");
  if (d.status !== "aberta") return erro(res, 409, "Esta denúncia já foi analisada.");
  const status = texto(req.body?.status);
  if (!["resolvida", "descartada"].includes(status)) return erro(res, 400, "Escolha resolver ou descartar.", "status");
  const resolucao = texto(req.body?.resolucao);
  if (resolucao.length < 5 || resolucao.length > 300) return erro(res, 400, "Explique a decisão (de 5 a 300 caracteres). Ela fica no registro.", "resolucao");
  const fechadas = await fecharDenunciasDoAlvo(d.alvoTipo, d.alvoId, req.admin.id, resolucao, status);
  const texto_ = status === "resolvida"
    ? "Analisamos a sua denúncia e tomamos uma providência. Obrigada por ajudar a cuidar da comunidade."
    : "Analisamos a sua denúncia e não encontramos violação das regras da Bloom. Obrigada por avisar.";
  for (const f of fechadas) await notificar({ tipoConta: f.tipoConta, contaId: f.contaId, tipo: "plataforma", texto: texto_ });
  await registrarAcao(req.admin.id, status === "resolvida" ? "Resolveu denúncia" : "Descartou denúncia", "DENUNCIA", id, `${d.alvoTipo} #${d.alvoId} (${fechadas.length} denúncia(s)): ${resolucao}`);
  return res.json({ fechadas: fechadas.length });
});

async function conferirSenhaAtual(req, res) {
  if (typeof req.body?.senha !== "string" || !(await bcrypt.compare(req.body.senha, req.admin.senhaHash))) {
    erro(res, 400, "A senha não confere.", "senha");
    return false;
  }
  return true;
}

export const iniciarDuasEtapas = comTratamento(async (req, res) => {
  if (req.admin.totpAtivo) return erro(res, 409, "A verificação em duas etapas já está ligada.");
  if (!(await conferirSenhaAtual(req, res))) return undefined;
  const segredo = novoSegredo();
  await req.admin.update({ totpSegredo: cifrar(segredo), totpAtivo: false, totpUltimoPasso: null });
  return res.json({ segredo, endereco: enderecoOtp(segredo, req.admin.usuario) });
});

export const ativarDuasEtapas = comTratamento(async (req, res) => {
  if (req.admin.totpAtivo) return erro(res, 409, "A verificação em duas etapas já está ligada.");
  if (!req.admin.totpSegredo) return erro(res, 400, "Comece a configuração de novo.");
  const passo = conferirCodigo(decifrar(req.admin.totpSegredo), req.body?.codigo);
  if (passo === null) return erro(res, 400, "Código inválido. Confira se o relógio do celular está certo e tente o código atual.", "codigo");
  const { codigos, hashes } = novosCodigosRecuperacao();
  await req.admin.update({ totpAtivo: true, totpUltimoPasso: passo, codigosRecuperacao: JSON.stringify(hashes) });
  await registrarAcao(req.admin.id, "Ligou a verificação em duas etapas", "ADMINS", req.admin.id);
  return res.json({ codigosRecuperacao: codigos });
});

export const desativarDuasEtapas = comTratamento(async (req, res) => {
  if (!req.admin.totpAtivo) return erro(res, 409, "A verificação em duas etapas não está ligada.");
  if (!(await conferirSenhaAtual(req, res))) return undefined;
  if (!(await conferirSegundoFator(req.admin, req.body?.codigo))) return erro(res, 400, "Código inválido.", "codigo");
  await req.admin.update({ totpAtivo: false, totpSegredo: null, totpUltimoPasso: null, codigosRecuperacao: null });
  await registrarAcao(req.admin.id, "Desligou a verificação em duas etapas", "ADMINS", req.admin.id);
  return res.json({ doisFatores: false });
});

export const novosCodigos = comTratamento(async (req, res) => {
  if (!req.admin.totpAtivo) return erro(res, 409, "A verificação em duas etapas não está ligada.");
  if (!(await conferirSenhaAtual(req, res))) return undefined;
  if (!(await conferirSegundoFator(req.admin, req.body?.codigo))) return erro(res, 400, "Código inválido.", "codigo");
  const { codigos, hashes } = novosCodigosRecuperacao();
  await req.admin.update({ codigosRecuperacao: JSON.stringify(hashes) });
  await registrarAcao(req.admin.id, "Gerou novos códigos de recuperação", "ADMINS", req.admin.id);
  return res.json({ codigosRecuperacao: codigos });
});

const PUBLICOS = { todos: "todas as contas", usuarias: "candidatas", empresas: "empresas" };

export const enviarComunicado = comTratamento(async (req, res) => {
  const publico = texto(req.body?.publico);
  const msg = texto(req.body?.texto);
  const link = texto(req.body?.link);
  if (!PUBLICOS[publico]) return erro(res, 400, "Escolha para quem enviar.", "publico");
  if (msg.length < 10 || msg.length > 300) return erro(res, 400, "O comunicado deve ter de 10 a 300 caracteres.", "texto");
  if (link && (link.startsWith("//") || !/^\/[A-Za-z0-9\-._~/?#=&%]*$/.test(link))) return erro(res, 400, "Use um caminho do próprio site, como /candidata/vagas.", "link");
  if (link.length > 200) return erro(res, 400, "O caminho pode ter até 200 caracteres.", "link");

  const destinos = [];
  if (publico !== "empresas") for (const u of await Usuaria.findAll({ attributes: ["id"], where: { suspensaEm: null } })) destinos.push(["usuaria", u.id]);
  if (publico !== "usuarias") for (const e of await Empresa.findAll({ attributes: ["id"], where: { suspensaEm: null } })) destinos.push(["empresa", e.id]);
  let enviados = 0;
  for (const [tipoConta, contaId] of destinos) {
    if (await notificar({ tipoConta, contaId, tipo: "plataforma", texto: msg, link: link || null })) enviados++;
  }
  const c = await Comunicado.create({ adminId: req.admin.id, publico, texto: msg, link: link || null, enviados });
  await registrarAcao(req.admin.id, "Enviou comunicado", "COMUNICADO", c.id, `Para ${PUBLICOS[publico]} (${enviados} de ${destinos.length}): ${msg}`);
  return res.status(201).json({ enviados, total: destinos.length });
});

export const listarComunicados = comTratamento(async (req, res) => {
  const lista = await Comunicado.findAll({ order: [["id", "DESC"]], limit: 100 });
  const nomes = await nomesDosAdmins(lista.map((c) => c.adminId));
  return res.json({
    comunicados: lista.map((c) => ({ id: c.id, publico: c.publico, texto: c.texto, link: c.link ?? "", enviados: c.enviados, criadoEm: c.criadoEm, admin: nomes.get(c.adminId) ?? "Administrador" })),
  });
});

function celula(v) {
  let t = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString().replace("T", " ").slice(0, 19) : String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}
const linhaCsv = (valores) => valores.map(celula).join(";");

async function dadosRelatorio(recurso) {
  switch (recurso) {
    case "candidatas": {
      const lista = await Usuaria.findAll({ order: [["id", "ASC"]] });
      const verif = new Map((await UsuariaVerificacao.findAll()).map((v) => [v.usuariaId, v.cpfStatus]));
      return [["id", "nome", "email", "cpf (mascarado)", "cpf_status", "suspensa_em", "motivo_suspensao"], ...lista.map((u) => [u.id, u.nome, u.email, mascararCpf(u.cpf), verif.get(u.id) ?? "nao_verificado", u.suspensaEm, u.motivoSuspensao])];
    }
    case "empresas": {
      const lista = await Empresa.findAll({ order: [["id", "ASC"]] });
      const cad = new Map((await EmpresaCadastro.findAll()).map((c) => [c.empresaId, c]));
      return [["id", "nome", "email", "cnpj", "razao_social", "situacao_receita", "representante", "suspensa_em", "motivo_suspensao"], ...lista.map((e) => [e.id, e.nome, e.email, formatarCnpj(e.cnpj), cad.get(e.id)?.razaoSocial, cad.get(e.id)?.situacaoCadastral, cad.get(e.id)?.representanteStatus, e.suspensaEm, e.motivoSuspensao])];
    }
    case "vagas": {
      const lista = await Vaga.findAll({ order: [["id", "ASC"]] });
      const perfis = new Map((await PerfilEmpresa.findAll()).map((p) => [p.id, p.empresaId]));
      const nomes = new Map((await Empresa.findAll({ attributes: ["id", "nome"] })).map((e) => [e.id, e.nome]));
      const cands = new Map((await Candidatura.findAll({ attributes: ["vagaId", [fn("COUNT", col("id_candidatura")), "n"]], group: ["vagaId"], raw: true })).map((c) => [c.vagaId, Number(c.n)]));
      return [["id", "titulo", "empresa", "status", "modalidade", "publicada_em", "candidaturas"], ...lista.map((v) => [v.id, v.titulo, nomes.get(perfis.get(v.perfilEmpresaId)) ?? "", v.status, v.modalidade, v.dataPublicacao, cands.get(v.id) ?? 0])];
    }
    case "denuncias": {
      const lista = await Denuncia.findAll({ order: [["id", "ASC"]] });
      return [["id", "alvo", "alvo_id", "motivo", "descricao", "status", "criada_em", "resolucao", "resolvida_em"], ...lista.map((d) => [d.id, d.alvoTipo, d.alvoId, MOTIVOS_DENUNCIA[d.motivo] ?? d.motivo, d.descricao, d.status, d.criadaEm, d.resolucao, d.resolvidaEm])];
    }
    case "pagamentos": {
      const lista = await Pagamento.findAll({ order: [["id", "ASC"]] });
      const planos = new Map((await Plano.findAll()).map((p) => [p.id, p.nome]));
      return [["id", "tipo_conta", "id_conta", "plano", "status", "valor", "moeda", "pago_em", "registrado_em"], ...lista.map((p) => [p.id, p.tipoConta, p.contaId, planos.get(p.planoId) ?? "", p.status, Number(p.valor).toFixed(2).replace(".", ","), p.moeda, p.pagoEm, p.registradoEm])];
    }
    case "registro": {
      const lista = await LogAdmin.findAll({ order: [["id", "ASC"]] });
      const nomes = await nomesDosAdmins(lista.map((l) => l.adminId));
      return [["id", "administrador", "acao", "tabela", "registro_id", "detalhes", "em"], ...lista.map((l) => [l.id, nomes.get(l.adminId) ?? "", l.acao, l.tabela, l.registroId, l.detalhes, l.em])];
    }
    default:
      return null;
  }
}

export const relatorio = comTratamento(async (req, res) => {
  const linhas = await dadosRelatorio(req.params.recurso);
  if (!linhas) return erro(res, 404, "Relatório não encontrado.");
  await registrarAcao(req.admin.id, "Exportou relatório", null, null, `${req.params.recurso} (${linhas.length - 1} linhas)`);
  const dia = new Date().toISOString().slice(0, 10);
  res.set({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="bloom-${req.params.recurso}-${dia}.csv"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  return res.send(`\uFEFF${linhas.map(linhaCsv).join("\r\n")}\r\n`);
});


export const resumoMenu = comTratamento(async (req, res) => {
  const [denuncias, representantes] = await Promise.all([Denuncia.count({ where: { status: "aberta" } }), EmpresaCadastro.count({ where: { representanteStatus: "pendente" } })]);
  return res.json({ denuncias, representantes });
});
