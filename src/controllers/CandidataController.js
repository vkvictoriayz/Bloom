import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Usuaria } from "../models/index.js";
import { ConfigUsuaria, Experiencia, Favorito, Formacao, Habilidade, PerfilDetalhes, PerfilHabilidade, PerfilUsuaria, Projeto } from "../models/Candidata.js";
import { deLinha } from "../services/privacidade.js";
import { Vaga } from "../models/Empresarial.js";
import { CurriculoCandidata, enviarArquivo, resumoArquivo } from "../models/Curriculo.js";
import { lerCurriculo } from "../utils/curriculo.js";
import { sincronizarNomeExibido } from "./IdentificacaoController.js";

const eu = (req) => req.auth.sub;
const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

class ErroValidacao extends Error {
  constructor(mensagem, campo) {
    super(mensagem);
    this.campo = campo;
  }
}
const falhar = (mensagem, campo) => {
  throw new ErroValidacao(mensagem, campo);
};

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    if (e instanceof ErroValidacao) return erro(res, 400, e.message, e.campo);
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

function curto(valor, max, campo, rotulo, obrigatorio = false) {
  const v = texto(valor);
  if (obrigatorio && !v) falhar(`Informe ${rotulo}.`, campo);
  if (v.length > max) falhar(`${rotulo[0].toUpperCase()}${rotulo.slice(1)} pode ter até ${max} caracteres.`, campo);
  return v;
}

function endereco(valor, campo) {
  const v = texto(valor);
  if (!v) return "";
  try {
    const u = new URL(v);
    if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".") || v.length > 255) throw new Error();
    return u.href;
  } catch {
    return falhar("Use um endereço completo (https://...).", campo);
  }
}

function mes(valor, campo) {
  const v = texto(valor);
  if (v && !MES.test(v)) falhar("Use o formato mês/ano.", campo);
  return v;
}

function listaTextos(valor, maxItens, maxTexto, campo) {
  if (!Array.isArray(valor)) falhar("Formato inválido.", campo);
  const itens = [...new Set(valor.map(texto).filter(Boolean))];
  if (itens.length > maxItens) falhar(`Use até ${maxItens} itens.`, campo);
  if (itens.some((i) => i.length > maxTexto)) falhar(`Cada item pode ter até ${maxTexto} caracteres.`, campo);
  return itens;
}

function listaObjetos(valor, maxItens, campo, ler) {
  if (!Array.isArray(valor)) falhar("Formato inválido.", campo);
  if (valor.length > maxItens) falhar(`Use até ${maxItens} itens.`, campo);
  return valor.map((item) => ler(item && typeof item === "object" ? item : {}));
}

const paraData = (m) => (m ? `${m}-01` : null);
const paraMes = (d) => (d ? String(d).slice(0, 7) : "");

async function meuPerfilUsuaria(usuariaId, transaction) {
  const [perfil] = await PerfilUsuaria.findOrCreate({ where: { usuariaId }, defaults: { usuariaId }, transaction });
  return perfil;
}

export async function perfilCompleto(usuariaId, { comContato = true } = {}) {
  const conta = await Usuaria.findByPk(usuariaId);
  if (!conta) return null;
  const [perfil, detalhes, projetos] = await Promise.all([
    PerfilUsuaria.findOne({ where: { usuariaId } }),
    PerfilDetalhes.findOne({ where: { usuariaId } }),
    Projeto.findAll({ where: { usuariaId }, order: [["criadoEm", "DESC"], ["id", "DESC"]] }),
  ]);
  const [experiencias, formacoes, habilidades] = perfil
    ? await Promise.all([
        Experiencia.findAll({ where: { perfilId: perfil.id }, order: [["inicio", "DESC"], ["id", "ASC"]] }),
        Formacao.findAll({ where: { perfilId: perfil.id }, order: [["inicio", "DESC"], ["id", "ASC"]] }),
        PerfilHabilidade.findAll({ where: { perfilId: perfil.id } }),
      ])
    : [[], [], []];
  const nomesHabilidades = habilidades.length
    ? (await Habilidade.findAll({ where: { id: { [Op.in]: habilidades.map((h) => h.habilidadeId) } } })).map((h) => h.nome)
    : [];

  return {
    nome: conta.nome,
    ...(comContato ? { email: conta.email, telefone: conta.telefone ?? "" } : {}),
    cargo: detalhes?.cargo ?? "",
    local: perfil?.localizacao ?? "",
    sobre: perfil?.descricao ?? "",
    objetivo: detalhes?.objetivo ?? "",
    links: { linkedin: "", github: "", portfolio: "", ...(detalhes?.links ?? {}) },
    preferencias: { modalidades: [], areas: [], disponibilidade: "", ...(detalhes?.preferencias ?? {}) },
    tecnicas: nomesHabilidades.sort((a, b) => a.localeCompare(b, "pt-BR")),
    comportamentais: detalhes?.comportamentais ?? [],
    experiencias: experiencias.map((x) => ({ cargo: x.cargo ?? "", empresa: x.empresa ?? "", inicio: paraMes(x.inicio), fim: paraMes(x.fim), descricao: x.descricao ?? "" })),
    formacoes: formacoes.map((x) => ({ curso: x.curso, instituicao: x.instituicao, nivel: x.nivel ?? "", inicio: paraMes(x.inicio), conclusao: paraMes(x.conclusao) })),
    cursos: detalhes?.cursos ?? [],
    projetos: projetos.map(projetoJson),
    atualizadoEm: detalhes?.atualizadoEm ?? null,
  };
}

export const perfil = comTratamento(async (req, res) => {
  const dados = await perfilCompleto(eu(req));
  if (!dados) return erro(res, 401, "Sessão inválida. Faça login novamente.");
  return res.json({ perfil: dados });
});

export const atualizarPerfil = comTratamento(async (req, res) => {
  const b = req.body ?? {};
  const tem = (chave) => Object.prototype.hasOwnProperty.call(b, chave);

  const conta = {};
  if (tem("nome")) conta.nome = curto(b.nome, 100, "nome", "o nome", true);
  if (conta.nome !== undefined && conta.nome.length < 2) falhar("Informe seu nome (ao menos 2 letras).", "nome");
  if (tem("telefone")) {
    const tel = String(b.telefone ?? "").replace(/\D/g, "");
    if (tel && (tel.length < 10 || tel.length > 11)) falhar("Use DDD + número, com 10 ou 11 dígitos.", "telefone");
    conta.telefone = tel || null;
  }

  const base = {};
  if (tem("local")) base.localizacao = curto(b.local, 150, "local", "a localização") || null;
  if (tem("sobre")) base.descricao = curto(b.sobre, 500, "sobre", "o resumo") || null;

  const detalhes = {};
  if (tem("cargo")) detalhes.cargo = curto(b.cargo, 100, "cargo", "o título") || null;
  if (tem("objetivo")) detalhes.objetivo = curto(b.objetivo, 500, "objetivo", "o objetivo") || null;
  if (tem("links")) {
    const l = b.links ?? {};
    detalhes.links = { linkedin: endereco(l.linkedin, "linkedin"), github: endereco(l.github, "github"), portfolio: endereco(l.portfolio, "portfolio") };
  }
  if (tem("comportamentais")) detalhes.comportamentais = listaTextos(b.comportamentais, 20, 60, "comportamentais");
  if (tem("preferencias")) {
    const p = b.preferencias ?? {};
    detalhes.preferencias = {
      modalidades: listaTextos(p.modalidades ?? [], 5, 30, "preferencias"),
      areas: listaTextos(p.areas ?? [], 15, 60, "preferencias"),
      disponibilidade: curto(p.disponibilidade, 100, "preferencias", "a disponibilidade"),
    };
  }
  if (tem("cursos")) {
    detalhes.cursos = listaObjetos(b.cursos, 30, "cursos", (c) => {
      const ano = texto(c.ano);
      if (ano && !/^\d{4}$/.test(ano)) falhar("Use o ano com 4 números.", "cursos");
      return { nome: curto(c.nome, 150, "cursos", "o nome do curso", true), instituicao: curto(c.instituicao, 150, "cursos", "a instituição"), ano, link: endereco(c.link, "cursos") };
    });
  }

  const tecnicas = tem("tecnicas") ? listaTextos(b.tecnicas, 40, 100, "tecnicas") : null;
  const experiencias = tem("experiencias")
    ? listaObjetos(b.experiencias, 30, "experiencias", (x) => ({
        cargo: curto(x.cargo, 100, "experiencias", "o cargo", true),
        empresa: curto(x.empresa, 100, "experiencias", "a empresa", true),
        descricao: curto(x.descricao, 250, "experiencias", "a descrição") || null,
        inicio: paraData(mes(x.inicio, "experiencias")),
        fim: paraData(mes(x.fim, "experiencias")),
      }))
    : null;
  const formacoes = tem("formacoes")
    ? listaObjetos(b.formacoes, 20, "formacoes", (x) => ({
        curso: curto(x.curso, 150, "formacoes", "o curso", true),
        instituicao: curto(x.instituicao, 150, "formacoes", "a instituição", true),
        nivel: curto(x.nivel, 50, "formacoes", "o nível") || null,
        inicio: paraData(mes(x.inicio, "formacoes")),
        conclusao: paraData(mes(x.conclusao, "formacoes")),
      }))
    : null;

  await sequelize.transaction(async (transaction) => {
    const usuariaId = eu(req);
    if (Object.keys(conta).length) await Usuaria.update(conta, { where: { id: usuariaId }, transaction });
    if (conta.nome !== undefined) await sincronizarNomeExibido(usuariaId, conta.nome, transaction);
    const perfilBase = await meuPerfilUsuaria(usuariaId, transaction);
    if (Object.keys(base).length) await perfilBase.update(base, { transaction });

    const [det] = await PerfilDetalhes.findOrCreate({ where: { usuariaId }, defaults: { usuariaId }, transaction });
    await det.update({ ...detalhes, atualizadoEm: new Date() }, { transaction });

    if (experiencias) {
      await Experiencia.destroy({ where: { perfilId: perfilBase.id }, transaction });
      await Experiencia.bulkCreate(experiencias.map((x) => ({ ...x, perfilId: perfilBase.id })), { transaction });
    }
    if (formacoes) {
      await Formacao.destroy({ where: { perfilId: perfilBase.id }, transaction });
      await Formacao.bulkCreate(formacoes.map((x) => ({ ...x, perfilId: perfilBase.id })), { transaction });
    }
    if (tecnicas) {
      const ids = [];
      for (const nome of tecnicas) {
        const existente = await Habilidade.findOne({ where: { nome }, transaction });
        ids.push((existente ?? (await Habilidade.create({ nome }, { transaction }))).id);
      }
      await PerfilHabilidade.destroy({ where: { perfilId: perfilBase.id }, transaction });
      await PerfilHabilidade.bulkCreate([...new Set(ids)].map((habilidadeId) => ({ perfilId: perfilBase.id, habilidadeId })), { transaction });
    }
  });

  return res.json({ perfil: await perfilCompleto(eu(req)) });
});

const LIMITE_IMAGEM_PROJETO = 400 * 1024;

function projetoJson(p) {
  return {
    id: String(p.id),
    nome: p.nome,
    descricao: p.descricao ?? "",
    imagem: p.imagem ?? "",
    tecnologias: p.tecnologias ?? [],
    repositorio: p.repositorio ?? "",
    demo: p.demo ?? "",
    inicio: p.inicio ?? "",
    fim: p.fim ?? "",
  };
}

function lerProjeto(b = {}) {
  let imagem = texto(b.imagem);
  if (imagem) {
    const partes = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imagem);
    if (!partes) falhar("A imagem deve ser JPG, PNG ou WebP.", "imagem");
    if (Buffer.from(partes[2], "base64").length > LIMITE_IMAGEM_PROJETO) falhar("A imagem deve ter até 400 KB.", "imagem");
  }
  const inicio = mes(b.inicio, "inicio");
  const fim = mes(b.fim, "fim");
  if (inicio && fim && fim < inicio) falhar("O fim não pode ser antes do início.", "fim");
  return {
    nome: curto(b.nome, 100, "nome", "o nome do projeto", true),
    descricao: curto(b.descricao, 1000, "descricao", "a descrição") || null,
    imagem: imagem || null,
    tecnologias: listaTextos(b.tecnologias ?? [], 15, 40, "tecnologias"),
    repositorio: endereco(b.repositorio, "repositorio") || null,
    demo: endereco(b.demo, "demo") || null,
    inicio: inicio || null,
    fim: fim || null,
  };
}

async function meuProjeto(req) {
  const id = idParam(req.params.id);
  return id ? Projeto.findOne({ where: { id, usuariaId: eu(req) } }) : null;
}

export const listarProjetos = comTratamento(async (req, res) => {
  const lista = await Projeto.findAll({ where: { usuariaId: eu(req) }, order: [["criadoEm", "DESC"], ["id", "DESC"]] });
  return res.json({ projetos: lista.map(projetoJson) });
});

export const criarProjeto = comTratamento(async (req, res) => {
  if ((await Projeto.count({ where: { usuariaId: eu(req) } })) >= 30) return erro(res, 400, "Você já tem 30 projetos. Exclua um para adicionar outro.");
  const projeto = await Projeto.create({ ...lerProjeto(req.body), usuariaId: eu(req) });
  return res.status(201).json({ projeto: projetoJson(projeto) });
});

export const editarProjeto = comTratamento(async (req, res) => {
  const projeto = await meuProjeto(req);
  if (!projeto) return erro(res, 404, "Projeto não encontrado.");
  await projeto.update(lerProjeto(req.body));
  return res.json({ projeto: projetoJson(projeto) });
});

export const excluirProjeto = comTratamento(async (req, res) => {
  const projeto = await meuProjeto(req);
  if (!projeto) return erro(res, 404, "Projeto não encontrado.");
  await projeto.destroy();
  return res.status(204).end();
});

export const listarSalvas = comTratamento(async (req, res) => {
  const lista = await Favorito.findAll({ where: { usuariaId: eu(req) }, order: [["id", "DESC"]] });
  return res.json({ vagas: lista.map((f) => f.vagaId) });
});

export const salvarVaga = comTratamento(async (req, res) => {
  const vagaId = idParam(req.params.vagaId);
  if (!vagaId || !(await Vaga.findByPk(vagaId))) return erro(res, 404, "Vaga não encontrada.");
  await Favorito.findOrCreate({
    where: { usuariaId: eu(req), vagaId },
    defaults: { usuariaId: eu(req), vagaId, data: new Date().toLocaleDateString("sv-SE") },
  });
  return res.status(204).end();
});

export const removerSalva = comTratamento(async (req, res) => {
  const vagaId = idParam(req.params.vagaId);
  if (vagaId) await Favorito.destroy({ where: { usuariaId: eu(req), vagaId } });
  return res.status(204).end();
});

export const privacidade = comTratamento(async (req, res) => {
  const config = await ConfigUsuaria.findOne({ where: { usuariaId: eu(req) } });
  return res.json({ privacidade: deLinha(config) });
});

export const atualizarPrivacidade = comTratamento(async (req, res) => {
  const mudancas = {};
  for (const chave of ["perfilPublico", "mostrarExperiencia", "mostrarContato"]) {
    if (req.body?.[chave] === undefined) continue;
    if (typeof req.body[chave] !== "boolean") return erro(res, 400, "Formato inválido.", chave);
    mudancas[chave] = req.body[chave];
  }
  const [config] = await ConfigUsuaria.findOrCreate({ where: { usuariaId: eu(req) }, defaults: { usuariaId: eu(req), perfilPublico: true, mostrarExperiencia: false, mostrarContato: false } });
  await config.update(mudancas);
  return res.json({ privacidade: deLinha(config) });
});

export const curriculo = comTratamento(async (req, res) => {
  const atual = await CurriculoCandidata.findOne({ attributes: ["nomeArquivo", "tamanho", "enviadoEm"], where: { usuariaId: eu(req) } });
  return res.json({ curriculo: resumoArquivo(atual) });
});

export const enviarCurriculo = comTratamento(async (req, res) => {
  const lido = lerCurriculo(req.body?.nome, req.body?.arquivo);
  if (lido.erro) return erro(res, 400, lido.erro, "curriculo");
  const valores = { nomeArquivo: lido.nomeArquivo, mime: lido.mime, tamanho: lido.dados.length, dados: lido.dados, enviadoEm: new Date() };
  const atual = await CurriculoCandidata.findOne({ where: { usuariaId: eu(req) } });
  if (atual) await atual.update(valores);
  else await CurriculoCandidata.create({ usuariaId: eu(req), ...valores });
  return res.json({ curriculo: resumoArquivo(valores) });
});

export const baixarCurriculo = comTratamento(async (req, res) => {
  const atual = await CurriculoCandidata.findOne({ where: { usuariaId: eu(req) } });
  if (!atual) return erro(res, 404, "Você ainda não enviou um currículo.");
  return enviarArquivo(res, atual);
});

export const removerCurriculo = comTratamento(async (req, res) => {
  await CurriculoCandidata.destroy({ where: { usuariaId: eu(req) } });
  return res.json({ curriculo: null });
});
