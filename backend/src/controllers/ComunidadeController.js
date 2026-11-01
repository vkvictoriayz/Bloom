import { Op } from "sequelize";
import { Comentario, Conexao, Curtida, PerfilComunidade, Publicacao } from "../models/Comunidade.js";
import { Usuaria } from "../models/index.js";

export const TIPOS = ["dica", "experiencia", "projeto", "conquista", "oportunidade", "duvida"];
const POR_PAGINA = 20;

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const listaInteresses = (s) => (s ? s.split(",").map((i) => i.trim()).filter(Boolean) : []);

// Só contas de usuária participam da comunidade.
function eu(req) {
  return req.auth.sub;
}

async function perfisPor(ids) {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return new Map();
  const [contas, perfis] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.in]: unicos } } }),
    PerfilComunidade.findAll({ where: { usuariaId: { [Op.in]: unicos } } }),
  ]);
  const porId = new Map(perfis.map((p) => [p.usuariaId, p]));
  return new Map(
    contas.map((c) => {
      const p = porId.get(c.id);
      return [c.id, { id: c.id, nome: c.nome, area: p?.area ?? "", interesses: listaInteresses(p?.interesses), bio: p?.bio ?? "" }];
    })
  );
}

async function montarPublicacoes(lista, meuId) {
  if (!lista.length) return [];
  const ids = lista.map((p) => p.id);
  const [autoras, curtidas, comentarios] = await Promise.all([
    perfisPor(lista.map((p) => p.usuariaId)),
    Curtida.findAll({ where: { publicacaoId: { [Op.in]: ids } } }),
    Comentario.findAll({ where: { publicacaoId: { [Op.in]: ids } } }),
  ]);
  return lista.map((p) => {
    const dela = curtidas.filter((c) => c.publicacaoId === p.id);
    return {
      id: p.id,
      tipo: p.tipo,
      texto: p.texto,
      criadaEm: p.criadaEm,
      autora: autoras.get(p.usuariaId) ?? { id: p.usuariaId, nome: "Integrante", area: "", interesses: [] },
      minha: p.usuariaId === meuId,
      curtidas: dela.length,
      curtiu: dela.some((c) => c.usuariaId === meuId),
      comentarios: comentarios.filter((c) => c.publicacaoId === p.id).length,
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

// GET /feed?filtro=todas|seguindo&tipo=dica&pagina=1
export const feed = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const where = {};

  if (req.query.tipo) {
    if (!TIPOS.includes(req.query.tipo)) return erro(res, 400, "Tipo de publicação inválido.");
    where.tipo = req.query.tipo;
  }
  if (req.query.filtro === "seguindo") {
    const seguidas = await Conexao.findAll({ where: { seguidoraId: meuId } });
    where.usuariaId = { [Op.in]: [meuId, ...seguidas.map((c) => c.seguidaId)] };
  }

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

// POST /publicacoes { texto, tipo }
export const publicar = comTratamento(async (req, res) => {
  const conteudo = texto(req.body.texto);
  const tipo = texto(req.body.tipo) || "dica";
  if (!conteudo) return erro(res, 400, "Escreva algo para publicar.", "texto");
  if (conteudo.length > 1000) return erro(res, 400, "A publicação pode ter até 1000 caracteres.", "texto");
  if (!TIPOS.includes(tipo)) return erro(res, 400, "Escolha um tipo de publicação válido.", "tipo");

  const criada = await Publicacao.create({ usuariaId: eu(req), tipo, texto: conteudo });
  const [publicacao] = await montarPublicacoes([criada], eu(req));
  return res.status(201).json({ publicacao });
});

// DELETE /publicacoes/:id (somente a autora)
export const excluir = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  const publicacao = id && (await Publicacao.findByPk(id));
  if (!publicacao) return erro(res, 404, "Publicação não encontrada.");
  if (publicacao.usuariaId !== eu(req)) return erro(res, 403, "Você só pode excluir suas próprias publicações.");

  await Comentario.destroy({ where: { publicacaoId: id } });
  await Curtida.destroy({ where: { publicacaoId: id } });
  await Publicacao.destroy({ where: { id } });
  return res.json({ ok: true });
});

// POST /publicacoes/:id/curtir (alterna)
export const curtir = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id || !(await Publicacao.findByPk(id))) return erro(res, 404, "Publicação não encontrada.");

  const existente = await Curtida.findOne({ where: { publicacaoId: id, usuariaId: eu(req) } });
  if (existente) await Curtida.destroy({ where: { id: existente.id } });
  else await Curtida.create({ publicacaoId: id, usuariaId: eu(req) });

  const total = await Curtida.count({ where: { publicacaoId: id } });
  return res.json({ curtiu: !existente, curtidas: total });
});

// GET /publicacoes/:id/comentarios
export const listarComentarios = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id || !(await Publicacao.findByPk(id))) return erro(res, 404, "Publicação não encontrada.");

  const linhas = await Comentario.findAll({ where: { publicacaoId: id }, order: [["criadoEm", "ASC"], ["id", "ASC"]] });
  const autoras = await perfisPor(linhas.map((c) => c.usuariaId));
  return res.json({
    comentarios: linhas.map((c) => ({
      id: c.id,
      texto: c.texto,
      criadoEm: c.criadoEm,
      autora: autoras.get(c.usuariaId) ?? { id: c.usuariaId, nome: "Integrante", area: "" },
    })),
  });
});

// POST /publicacoes/:id/comentarios { texto }
export const comentar = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id || !(await Publicacao.findByPk(id))) return erro(res, 404, "Publicação não encontrada.");

  const conteudo = texto(req.body.texto);
  if (!conteudo) return erro(res, 400, "Escreva um comentário.", "texto");
  if (conteudo.length > 500) return erro(res, 400, "O comentário pode ter até 500 caracteres.", "texto");

  const criado = await Comentario.create({ publicacaoId: id, usuariaId: eu(req), texto: conteudo });
  const autoras = await perfisPor([eu(req)]);
  const total = await Comentario.count({ where: { publicacaoId: id } });
  return res.status(201).json({
    comentario: { id: criado.id, texto: criado.texto, criadoEm: criado.criadoEm, autora: autoras.get(eu(req)) },
    comentarios: total,
  });
});

// GET /perfis?busca=&conectadas=1 — outras integrantes, com o estado da conexão
export const perfis = comTratamento(async (req, res) => {
  const meuId = eu(req);
  const busca = texto(req.query.busca).toLowerCase();
  const [contas, seguidas] = await Promise.all([
    Usuaria.findAll({ where: { id: { [Op.ne]: meuId } }, order: [["nome", "ASC"]], limit: 200 }),
    Conexao.findAll({ where: { seguidoraId: meuId } }),
  ]);
  const seguidasIds = new Set(seguidas.map((c) => c.seguidaId));
  const mapa = await perfisPor(contas.map((c) => c.id));

  let lista = contas.map((c) => ({ ...mapa.get(c.id), seguindo: seguidasIds.has(c.id) }));
  if (busca) {
    lista = lista.filter((p) => `${p.nome} ${p.area} ${p.interesses.join(" ")}`.toLowerCase().includes(busca));
  }
  if (req.query.conectadas === "1") lista = lista.filter((p) => p.seguindo);
  return res.json({ perfis: lista });
});

// POST /perfis/:id/seguir (alterna)
export const seguir = comTratamento(async (req, res) => {
  const id = idParam(req.params.id);
  if (!id) return erro(res, 404, "Perfil não encontrado.");
  if (id === eu(req)) return erro(res, 400, "Você não pode seguir a si mesma.");
  if (!(await Usuaria.findByPk(id))) return erro(res, 404, "Perfil não encontrado.");

  const existente = await Conexao.findOne({ where: { seguidoraId: eu(req), seguidaId: id } });
  if (existente) await Conexao.destroy({ where: { id: existente.id } });
  else await Conexao.create({ seguidoraId: eu(req), seguidaId: id });

  return res.json({ seguindo: !existente });
});

// GET /meu-perfil
export const meuPerfil = comTratamento(async (req, res) => {
  const mapa = await perfisPor([eu(req)]);
  const perfil = mapa.get(eu(req));
  if (!perfil) return erro(res, 401, "Sessão inválida. Faça login novamente.");
  const [seguindo, seguidoras, publicacoes] = await Promise.all([
    Conexao.count({ where: { seguidoraId: eu(req) } }),
    Conexao.count({ where: { seguidaId: eu(req) } }),
    Publicacao.count({ where: { usuariaId: eu(req) } }),
  ]);
  return res.json({ perfil, numeros: { seguindo, seguidoras, publicacoes } });
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
