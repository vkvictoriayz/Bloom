import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Comentario, Conexao, Curtida, PerfilComunidade, Publicacao } from "../models/Comunidade.js";
import { imagensDe } from "../models/Imagem.js";
import { Usuaria } from "../models/index.js";
import { PublicacaoImagem } from "../models/RedeSocial.js";
import { Projeto } from "../models/Candidata.js";
import { notificar } from "../services/notificacoes.js";
import { perfisOcultos } from "../services/privacidade.js";
import { contasSuspensas } from "../services/suspensao.js";
import { lerImagem, novaChave } from "../utils/imagem.js";

export const TIPOS = ["dica", "experiencia", "projeto", "conquista", "oportunidade", "duvida"];
const POR_PAGINA = 20;
const LIMITE_IMAGEM = 2 * 1024 * 1024; // 2 MB (a tela reduz a foto antes de enviar)

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const listaInteresses = (s) => (s ? s.split(",").map((i) => i.trim()).filter(Boolean) : []);
const medida = (v) => (Number.isInteger(v) && v > 0 && v <= 10000 ? v : null);

// Só contas de usuária participam da comunidade.
function eu(req) {
  return req.auth.sub;
}

export async function perfisPor(ids) {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return new Map();
  const [contas, perfis, imagens] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: unicos } } }),
    PerfilComunidade.findAll({ where: { usuariaId: { [Op.in]: unicos } } }),
    imagensDe("usuaria", unicos),
  ]);
  const porId = new Map(perfis.map((p) => [p.usuariaId, p]));
  return new Map(
    contas.map((c) => {
      const p = porId.get(c.id);
      const { foto, capa } = imagens.get(c.id);
      return [c.id, { id: c.id, nome: c.nome, area: p?.area ?? "", interesses: listaInteresses(p?.interesses), bio: p?.bio ?? "", foto, capa }];
    })
  );
}

// ------------------------------------------------------------ Imagem

// Lê o corpo de uma publicação: texto, tipo e imagem.
// imagem: undefined = não mexe; null = remove; objeto = nova imagem.
export function lerPublicacao(body = {}, { exigirConteudo = true } = {}) {
  const conteudo = texto(body.texto);
  const tipo = texto(body.tipo) || "dica";
  let imagem;
  if (body.imagem === null) imagem = null;
  else if (body.imagem !== undefined) {
    const lida = lerImagem(body.imagem, LIMITE_IMAGEM);
    if (lida.erro) return { falha: [lida.erro, "imagem"] };
    imagem = { ...lida, largura: medida(body.largura), altura: medida(body.altura) };
  }
  if (conteudo.length > 1000) return { falha: ["A publicação pode ter até 1000 caracteres.", "texto"] };
  if (!TIPOS.includes(tipo)) return { falha: ["Escolha um tipo de publicação válido.", "tipo"] };
  if (exigirConteudo && !conteudo && !imagem) return { falha: ["Escreva algo ou adicione uma imagem para publicar.", "texto"] };
  return { conteudo, tipo, imagem };
}

// Grava (ou troca, ou remove) a imagem de uma publicação.
export async function gravarImagem(publicacaoId, imagem, transaction) {
  if (imagem === undefined) return;
  await PublicacaoImagem.destroy({ where: { publicacaoId }, transaction });
  if (imagem) {
    await PublicacaoImagem.create(
      { publicacaoId, chave: novaChave(), mime: imagem.mime, dados: imagem.dados, largura: imagem.largura, altura: imagem.altura },
      { transaction }
    );
  }
}

export async function montarPublicacoes(lista, meuId) {
  if (!lista.length) return [];
  const ids = lista.map((p) => p.id);
  const autorasIds = [...new Set(lista.map((p) => p.usuariaId))];
  const [autoras, curtidas, comentarios, imagens, sigo] = await Promise.all([
    perfisPor(autorasIds),
    Curtida.findAll({ where: { publicacaoId: { [Op.in]: ids } } }),
    Comentario.findAll({ attributes: ["publicacaoId", "usuariaId"], where: { publicacaoId: { [Op.in]: ids } } }),
    PublicacaoImagem.findAll({ attributes: ["publicacaoId", "chave", "largura", "altura"], where: { publicacaoId: { [Op.in]: ids } } }),
    meuId > 0 ? Conexao.findAll({ attributes: ["seguidaId"], where: { seguidoraId: meuId, seguidaId: { [Op.in]: autorasIds } } }) : [],
  ]);
  const imagemDa = new Map(imagens.map((i) => [i.publicacaoId, { url: `/imagens/${i.chave}`, largura: i.largura, altura: i.altura }]));
  const suspensas = await contasSuspensas("usuaria");
  const seguidas = new Set(sigo.map((c) => c.seguidaId));
  return lista.map((p) => {
    const dela = curtidas.filter((c) => c.publicacaoId === p.id);
    const autora = autoras.get(p.usuariaId) ?? { id: p.usuariaId, nome: "Integrante", area: "", interesses: [] };
    return {
      id: p.id,
      tipo: p.tipo,
      texto: p.texto,
      imagem: imagemDa.get(p.id) ?? null,
      criadaEm: p.criadaEm,
      editadaEm: p.editadaEm ?? null,
      autora: { ...autora, seguindo: seguidas.has(p.usuariaId) },
      minha: p.usuariaId === meuId,
      curtidas: dela.length,
      curtiu: dela.some((c) => c.usuariaId === meuId),
      comentarios: comentarios.filter((c) => c.publicacaoId === p.id && (!suspensas.has(c.usuariaId) || c.usuariaId === meuId)).length,
    };
  });
}

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

// Uma integrante que a pessoa logada pode ver (perfil oculto só para ela mesma).
async function integranteVisivel(id, meuId) {
  if (!id || !(await Usuaria.findByPk(id))) return false;
  if (id === meuId) return true;
  return !(await perfisOcultos()).has(id);
}

// ------------------------------------------------------------ Feed

// Texto para LIKE, sem curingas vindos da busca.
const paraLike = (s) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// GET /feed?filtro=todas|seguindo&autora=eu|<id>&tipo=dica&busca=&pagina=1
export const feed = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const where = {};

  if (req.query.tipo) {
    if (!TIPOS.includes(req.query.tipo)) return erro(res, 400, "Tipo de publicação inválido.");
    where.tipo = req.query.tipo;
  }
  // ?autora=eu (página "Meu perfil") ou ?autora=<id> (perfil de outra integrante).
  if (req.query.autora === "eu") {
    where.usuariaId = meuId;
  } else if (req.query.autora) {
    const id = idParam(req.query.autora);
    if (!(await integranteVisivel(id, meuId))) return erro(res, 404, "Perfil não encontrado.");
    where.usuariaId = id;
  } else if (req.query.filtro === "seguindo") {
    const seguidas = await Conexao.findAll({ where: { seguidoraId: meuId } });
    where.usuariaId = { [Op.in]: [meuId, ...seguidas.map((c) => c.seguidaId)] };
  }

  // Conta suspensa pela administração: as publicações dela somem do feed.
  const suspensas = [...(await contasSuspensas("usuaria"))].filter((i) => i !== meuId);
  if (suspensas.length) where[Op.and] = [{ usuariaId: { [Op.notIn]: suspensas } }];

  // ?busca= procura no texto das publicações (até 100 caracteres).
  const busca = texto(req.query.busca).slice(0, 100);
  if (busca) where.texto = { [Op.like]: paraLike(busca) };

  const linhas = await Publicacao.findAll({
    where,
    order: [["criadaEm", "DESC"], ["id", "DESC"]],
    limit: POR_PAGINA + 1,
    offset: (pagina - 1) * POR_PAGINA,
  });
  const temMais = linhas.length > POR_PAGINA;
  const publicacoes = await montarPublicacoes(linhas.slice(0, POR_PAGINA), meuId);
  return res.json({ publicacoes, temMais });
});

// POST /publicacoes { texto, tipo, imagem?, largura?, altura? }
export const publicar = comTratamento(async (req, res) => {
  const lida = lerPublicacao(req.body);
  if (lida.falha) return erro(res, 400, ...lida.falha);

  const criada = await sequelize.transaction(async (transaction) => {
    const p = await Publicacao.create({ usuariaId: eu(req), tipo: lida.tipo, texto: lida.conteudo }, { transaction });
    await gravarImagem(p.id, lida.imagem ?? undefined, transaction);
    return p;
  });
  const [publicacao] = await montarPublicacoes([criada], eu(req));
  return res.status(201).json({ publicacao });
});

// PUT /publicacoes/:id { texto, tipo, imagem? } — só a autora.
// imagem: data URL troca; null remove; ausente mantém a atual.
export const editar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const publicacao = id && (await Publicacao.findByPk(id));
  if (!publicacao) return erro(res, 404, "Publicação não encontrada.");
  if (publicacao.usuariaId !== eu(req)) return erro(res, 403, "Você só pode editar suas próprias publicações.");

  const lida = lerPublicacao(req.body, { exigirConteudo: false });
  if (lida.falha) return erro(res, 400, ...lida.falha);
  const ficaComImagem = lida.imagem === undefined ? Boolean(await PublicacaoImagem.count({ where: { publicacaoId: id } })) : Boolean(lida.imagem);
  if (!lida.conteudo && !ficaComImagem) return erro(res, 400, "A publicação precisa de um texto ou de uma imagem.", "texto");

  await sequelize.transaction(async (transaction) => {
    await publicacao.update({ texto: lida.conteudo, tipo: lida.tipo, editadaEm: new Date() }, { transaction });
    await gravarImagem(id, lida.imagem, transaction);
  });
  const [atualizada] = await montarPublicacoes([await Publicacao.findByPk(id)], eu(req));
  return res.json({ publicacao: atualizada });
});

// DELETE /publicacoes/:id (somente a autora)
export const excluir = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const publicacao = id && (await Publicacao.findByPk(id));
  if (!publicacao) return erro(res, 404, "Publicação não encontrada.");
  if (publicacao.usuariaId !== eu(req)) return erro(res, 403, "Você só pode excluir suas próprias publicações.");

  await sequelize.transaction(async (transaction) => {
    await PublicacaoImagem.destroy({ where: { publicacaoId: id }, transaction });
    await Comentario.destroy({ where: { publicacaoId: id }, transaction });
    await Curtida.destroy({ where: { publicacaoId: id }, transaction });
    await sequelize.query("DELETE FROM COMUNIDADE_PUBLICACAO WHERE id_publicacao = ?", { replacements: [id], transaction });
    await Publicacao.destroy({ where: { id }, transaction });
  });
  return res.json({ ok: true });
});

// POST /publicacoes/:id/curtir (alterna)
export const curtir = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const publicacao = id && (await Publicacao.findByPk(id));
  if (!publicacao) return erro(res, 404, "Publicação não encontrada.");

  const existente = await Curtida.findOne({ where: { publicacaoId: id, usuariaId: eu(req) } });
  if (existente) await Curtida.destroy({ where: { id: existente.id } });
  else {
    await Curtida.create({ publicacaoId: id, usuariaId: eu(req) });
    await avisarAutora(publicacao, req, "curtida", "curtiu sua publicação");
  }

  const total = await Curtida.count({ where: { publicacaoId: id } });
  return res.json({ curtiu: !existente, curtidas: total });
});

// Avisa a autora de uma publicação (nunca ela mesma). Curtidas e comentários
// da mesma publicação se juntam num aviso só até ela ler.
async function avisarAutora(publicacao, req, tipo, acao) {
  if (publicacao.usuariaId === eu(req)) return;
  const quem = await Usuaria.findByPk(eu(req));
  await notificar({
    tipoConta: "usuaria",
    contaId: publicacao.usuariaId,
    tipo,
    texto: `${quem?.nome ?? "Uma integrante"} ${acao}.`,
    link: "/candidata/feed",
    chave: `${tipo}-publicacao-${publicacao.id}`,
  });
}

// ------------------------------------------------------- Comentários

function comentarioJson(c, autoras, publicacao, meuId) {
  return {
    id: c.id,
    texto: c.texto,
    criadoEm: c.criadoEm,
    autora: autoras.get(c.usuariaId) ?? { id: c.usuariaId, nome: "Integrante", area: "" },
    // Quem escreveu exclui o próprio; a autora da publicação modera todos.
    podeExcluir: c.usuariaId === meuId || publicacao.usuariaId === meuId,
    minha: c.usuariaId === meuId,
  };
}

// GET /publicacoes/:id/comentarios
export const listarComentarios = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const publicacao = id && (await Publicacao.findByPk(id));
  if (!publicacao) return erro(res, 404, "Publicação não encontrada.");

  const suspensas = await contasSuspensas("usuaria");
  const linhas = (await Comentario.findAll({ where: { publicacaoId: id }, order: [["criadoEm", "ASC"], ["id", "ASC"]] })).filter(
    (c) => !suspensas.has(c.usuariaId) || c.usuariaId === eu(req)
  );
  const autoras = await perfisPor(linhas.map((c) => c.usuariaId));
  return res.json({ comentarios: linhas.map((c) => comentarioJson(c, autoras, publicacao, eu(req))) });
});

// POST /publicacoes/:id/comentarios { texto }
export const comentar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const publicacao = id && (await Publicacao.findByPk(id));
  if (!publicacao) return erro(res, 404, "Publicação não encontrada.");

  const conteudo = texto(req.body.texto);
  if (!conteudo) return erro(res, 400, "Escreva um comentário.", "texto");
  if (conteudo.length > 500) return erro(res, 400, "O comentário pode ter até 500 caracteres.", "texto");

  const criado = await Comentario.create({ publicacaoId: id, usuariaId: eu(req), texto: conteudo });
  await avisarAutora(publicacao, req, "comentario", "comentou sua publicação");
  const autoras = await perfisPor([eu(req)]);
  const total = await Comentario.count({ where: { publicacaoId: id } });
  return res.status(201).json({ comentario: comentarioJson(criado, autoras, publicacao, eu(req)), comentarios: total });
});

// DELETE /comentarios/:id — quem escreveu ou a autora da publicação.
export const excluirComentario = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const comentario = id && (await Comentario.findByPk(id));
  if (!comentario) return erro(res, 404, "Comentário não encontrado.");
  const publicacao = await Publicacao.findByPk(comentario.publicacaoId);
  if (comentario.usuariaId !== eu(req) && publicacao?.usuariaId !== eu(req)) {
    return erro(res, 403, "Você só pode excluir seus comentários ou comentários nas suas publicações.");
  }
  await comentario.destroy();
  const total = await Comentario.count({ where: { publicacaoId: comentario.publicacaoId } });
  return res.json({ comentarios: total });
});

// ---------------------------------------------------- Perfis e conexões

// GET /perfis?busca=&conectadas=1 — outras integrantes, com o estado da conexão
export const perfis = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const busca = texto(req.query.busca).toLowerCase();
  const [contasTodas, seguidas, ocultos] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.ne]: meuId } }, order: [["nome", "ASC"]], limit: 200 }),
    Conexao.findAll({ where: { seguidoraId: meuId } }),
    perfisOcultos(),
  ]);
  // Quem escondeu o perfil não aparece em buscas nem em sugestões.
  const contas = contasTodas.filter((c) => !ocultos.has(c.id));
  const seguidasIds = new Set(seguidas.map((c) => c.seguidaId));
  const mapa = await perfisPor(contas.map((c) => c.id));

  let lista = contas.map((c) => ({ ...mapa.get(c.id), seguindo: seguidasIds.has(c.id) }));
  if (busca) {
    lista = lista.filter((p) => `${p.nome} ${p.area} ${p.interesses.join(" ")}`.toLowerCase().includes(busca));
  }
  if (req.query.conectadas === "1") lista = lista.filter((p) => p.seguindo);
  return res.json({ perfis: lista });
});

async function numerosDe(id) {
  const [seguindo, seguidoras, publicacoes] = await Promise.all([
    Conexao.count({ where: { seguidoraId: id } }),
    Conexao.count({ where: { seguidaId: id } }),
    Publicacao.count({ where: { usuariaId: id } }),
  ]);
  return { seguindo, seguidoras, publicacoes };
}

// GET /perfis/:id — perfil de uma integrante, números e se eu sigo.
export const perfilPublico = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const meuId = eu(req);
  if (!(await integranteVisivel(id, meuId))) return erro(res, 404, "Perfil não encontrado.");
  const [mapa, numeros, eu_sigo, me_segue] = await Promise.all([
    perfisPor([id]),
    numerosDe(id),
    Conexao.count({ where: { seguidoraId: meuId, seguidaId: id } }),
    Conexao.count({ where: { seguidoraId: id, seguidaId: meuId } }),
  ]);
  return res.json({ perfil: mapa.get(id), numeros, seguindo: Boolean(eu_sigo), segueVoce: Boolean(me_segue), souEu: id === meuId });
});

// GET /perfis/:id/seguidoras | /perfis/:id/seguindo — listas de conexões
// (sem perfis ocultos), com o estado da conexão de quem está vendo.
const listaConexoes = (lado) =>
  comTratamento(async (req, res) => {
    const id = idParam(req.params.id);
    const meuId = eu(req);
    if (!(await integranteVisivel(id, meuId))) return erro(res, 404, "Perfil não encontrado.");
    const linhas =
      lado === "seguidoras"
        ? (await Conexao.findAll({ where: { seguidaId: id }, order: [["id", "DESC"]], limit: 500 })).map((c) => c.seguidoraId)
        : (await Conexao.findAll({ where: { seguidoraId: id }, order: [["id", "DESC"]], limit: 500 })).map((c) => c.seguidaId);
    const ocultos = await perfisOcultos();
    const ids = linhas.filter((i) => i === meuId || !ocultos.has(i));
    const [mapa, minhas] = await Promise.all([perfisPor(ids), Conexao.findAll({ where: { seguidoraId: meuId, seguidaId: { [Op.in]: ids.length ? ids : [0] } } })]);
    const sigo = new Set(minhas.map((c) => c.seguidaId));
    return res.json({ perfis: ids.filter((i) => mapa.has(i)).map((i) => ({ ...mapa.get(i), seguindo: sigo.has(i), souEu: i === meuId })) });
  });
export const seguidoras = listaConexoes("seguidoras");
export const seguindo = listaConexoes("seguindo");

async function avisarNovaSeguidora(req, id) {
  const quem = await Usuaria.findByPk(eu(req));
  await notificar({
    tipoConta: "usuaria",
    contaId: id,
    tipo: "conexao",
    texto: `${quem?.nome ?? "Uma integrante"} começou a seguir você.`,
    link: `/candidata/pessoas/${eu(req)}`,
  });
}

// Começa a seguir (sem duplicar: índice único + findOrCreate).
async function comecarASeguir(req, id) {
  try {
    const [, criada] = await Conexao.findOrCreate({ where: { seguidoraId: eu(req), seguidaId: id } });
    if (criada) await avisarNovaSeguidora(req, id);
  } catch (e) {
    if (e.name !== "SequelizeUniqueConstraintError") throw e; // duas abas ao mesmo tempo
  }
}

async function alvoDeConexao(req, res) {
  const id = idParam(req.params.id);
  if (!id) return erro(res, 404, "Perfil não encontrado.");
  if (id === eu(req)) return erro(res, 400, "Você não pode seguir a si mesma.");
  if (!(await integranteVisivel(id, eu(req)))) return erro(res, 404, "Perfil não encontrado.");
  return id;
}

async function respostaConexao(res, req, id) {
  const [seguindoAgora, numeros] = await Promise.all([Conexao.count({ where: { seguidoraId: eu(req), seguidaId: id } }), numerosDe(id)]);
  return res.json({ seguindo: Boolean(seguindoAgora), seguidoras: numeros.seguidoras });
}

// PUT /perfis/:id/seguir — segue (idempotente).
export const seguir = comTratamento(async (req, res) => {
  const id = await alvoDeConexao(req, res);
  if (typeof id !== "number") return id;
  await comecarASeguir(req, id);
  return respostaConexao(res, req, id);
});

// DELETE /perfis/:id/seguir — deixa de seguir (idempotente).
export const deixarDeSeguir = comTratamento(async (req, res) => {
  const id = await alvoDeConexao(req, res);
  if (typeof id !== "number") return id;
  await Conexao.destroy({ where: { seguidoraId: eu(req), seguidaId: id } });
  return respostaConexao(res, req, id);
});

// POST /perfis/:id/seguir — alterna (mantido para compatibilidade).
export const alternarSeguir = comTratamento(async (req, res) => {
  const id = await alvoDeConexao(req, res);
  if (typeof id !== "number") return id;
  const existente = await Conexao.findOne({ where: { seguidoraId: eu(req), seguidaId: id } });
  if (existente) await existente.destroy();
  else await comecarASeguir(req, id);
  return respostaConexao(res, req, id);
});

// GET /meu-perfil
export const meuPerfil = comTratamento(async (req, res) => {
  const mapa = await perfisPor([eu(req)]);
  const perfil = mapa.get(eu(req));
  if (!perfil) return erro(res, 401, "Sessão inválida. Faça login novamente.");
  return res.json({ perfil, numeros: await numerosDe(eu(req)) });
});

// PUT /meu-perfil { area, interesses: [], bio }
export const atualizarPerfil = comTratamento(async (req, res) => {
  const area = texto(req.body.area);
  const bio = texto(req.body.bio);
  const interesses = (Array.isArray(req.body.interesses) ? req.body.interesses : [])
    .map(texto)
    .filter(Boolean)
    .map((i) => i.replace(/,/g, " "))
    .slice(0, 10);

  if (area.length > 80) return erro(res, 400, "A área pode ter até 80 caracteres.", "area");
  if (bio.length > 280) return erro(res, 400, "A apresentação pode ter até 280 caracteres.", "bio");
  const junto = interesses.join(", ");
  if (junto.length > 300) return erro(res, 400, "Há interesses demais. Reduza a lista.", "interesses");

  const dados = { area: area || null, bio: bio || null, interesses: junto || null };
  const existente = await PerfilComunidade.findOne({ where: { usuariaId: eu(req) } });
  if (existente) await existente.update(dados);
  else await PerfilComunidade.create({ usuariaId: eu(req), ...dados });

  const mapa = await perfisPor([eu(req)]);
  return res.json({ perfil: mapa.get(eu(req)) });
});

// ------------------------------------------------------------ Projetos

const projetoPublico = (p, autora) => ({
  id: String(p.id),
  nome: p.nome,
  descricao: p.descricao ?? "",
  imagem: p.imagem ?? "",
  tecnologias: p.tecnologias ?? [],
  repositorio: p.repositorio ?? "",
  demo: p.demo ?? "",
  inicio: p.inicio ?? "",
  fim: p.fim ?? "",
  autora,
});

// GET /projetos?busca=&autora=<id> — projetos de outras integrantes (perfis
// ocultos ficam de fora). Busca no nome, na descrição e nas tecnologias.
export const projetos = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const where = {};
  if (req.query.autora) {
    const id = idParam(req.query.autora);
    if (!(await integranteVisivel(id, meuId))) return erro(res, 404, "Perfil não encontrado.");
    where.usuariaId = id;
  } else {
    const ocultos = [...(await perfisOcultos())].filter((i) => i !== meuId);
    if (ocultos.length) where.usuariaId = { [Op.notIn]: ocultos };
  }
  const busca = texto(req.query.busca).slice(0, 100);
  if (busca) {
    where[Op.or] = [
      { nome: { [Op.like]: paraLike(busca) } },
      { descricao: { [Op.like]: paraLike(busca) } },
      sequelize.where(sequelize.cast(sequelize.col("tecnologias"), "CHAR"), { [Op.like]: paraLike(busca) }),
    ];
  }
  const lista = await Projeto.findAll({ where, order: [["criadoEm", "DESC"], ["id", "DESC"]], limit: 24 });
  const autoras = await perfisPor(lista.map((p) => p.usuariaId));
  return res.json({
    projetos: lista
      .filter((p) => autoras.has(p.usuariaId))
      .map((p) => {
        const a = autoras.get(p.usuariaId);
        return projetoPublico(p, { id: a.id, nome: a.nome, area: a.area, foto: a.foto });
      }),
  });
});

