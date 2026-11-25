import { Op } from "sequelize";
import { Bloqueio, MensagemImagem, PublicacaoImagem } from "../models/RedeSocial.js";
import { Publicacao } from "../models/Comunidade.js";
import { PublicacaoEmpresa } from "../models/Empresarial.js";
import { Empresa, Usuaria } from "../models/index.js";
import { imagensDe as imagensDePerfil } from "../models/Imagem.js";
import { contasSuspensas } from "./suspensao.js";
import { lerImagem, novaChave } from "../utils/imagem.js";

const LIMITE_IMAGEM = 2 * 1024 * 1024;
const medida = (v) => (Number.isInteger(v) && v > 0 && v <= 10000 ? v : null);

export function lerMensagem(body = {}, limiteTexto = 1000) {
  const texto = typeof body.texto === "string" ? body.texto.trim() : "";
  if (texto.length > limiteTexto) return { falha: [`Use até ${limiteTexto} caracteres.`, "texto"] };
  let imagem = null;
  if (body.imagem) {
    const lida = lerImagem(body.imagem, LIMITE_IMAGEM);
    if (lida.erro) return { falha: [lida.erro, "imagem"] };
    imagem = { mime: lida.mime, dados: lida.dados, largura: medida(body.largura), altura: medida(body.altura) };
  }
  let publicacao = null;
  if (body.publicacao !== undefined && body.publicacao !== null && body.publicacao !== "") {
    publicacao = String(body.publicacao);
    if (!/^[ue][1-9]\d{0,9}$/.test(publicacao)) return { falha: ["Publicação inválida.", "publicacao"] };
  }
  if (!texto && !imagem && !publicacao) return { falha: ["Escreva uma mensagem ou escolha uma imagem.", "texto"] };
  return { texto, imagem, publicacao };
}

const separar = (refs) => {
  const unicas = [...new Set(refs.filter(Boolean))];
  return {
    unicas,
    integrantes: unicas.filter((r) => r[0] === "u").map((r) => Number(r.slice(1))),
    empresas: unicas.filter((r) => r[0] === "e").map((r) => Number(r.slice(1))),
  };
};

export async function publicacoesCompartilhadas(refs) {
  const { integrantes, empresas } = separar(refs);
  const mapa = new Map();
  if (!integrantes.length && !empresas.length) return mapa;
  const [pubs, pubsE, suspU, suspE] = await Promise.all([
    integrantes.length ? Publicacao.findAll({ where: { id: { [Op.in]: integrantes } } }) : [],
    empresas.length ? PublicacaoEmpresa.findAll({ where: { id: { [Op.in]: empresas } } }) : [],
    contasSuspensas("usuaria"),
    contasSuspensas("empresa"),
  ]);
  const idsU = [...new Set(pubs.map((p) => p.usuariaId))];
  const idsE = [...new Set(pubsE.map((p) => p.empresaId))];
  const [contasU, contasE, fotosU, fotosE, imagens] = await Promise.all([
    idsU.length ? Usuaria.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: idsU } } }) : [],
    idsE.length ? Empresa.findAll({ attributes: ["id", "nome"], where: { id: { [Op.in]: idsE } } }) : [],
    imagensDePerfil("usuaria", idsU),
    imagensDePerfil("empresa", idsE),
    pubs.length ? PublicacaoImagem.findAll({ attributes: ["publicacaoId", "chave", "largura", "altura"], where: { publicacaoId: { [Op.in]: pubs.map((p) => p.id) } } }) : [],
  ]);
  const nomeU = new Map(contasU.map((c) => [c.id, c.nome]));
  const nomeE = new Map(contasE.map((c) => [c.id, c.nome]));
  const imagemDa = new Map(imagens.map((i) => [i.publicacaoId, { url: `/imagens/${i.chave}`, largura: i.largura, altura: i.altura }]));
  const trecho = (t) => (t && t.length > 280 ? `${t.slice(0, 280)}…` : t ?? "");
  for (const p of pubs) {
    if (suspU.has(p.usuariaId)) continue;
    mapa.set(`u${p.id}`, {
      ref: `u${p.id}`,
      origem: "integrante",
      id: p.id,
      tipo: p.tipo,
      texto: trecho(p.texto),
      imagem: imagemDa.get(p.id) ?? null,
      criadaEm: p.criadaEm,
      autor: { id: p.usuariaId, nome: nomeU.get(p.usuariaId) ?? "Integrante", foto: fotosU.get(p.usuariaId)?.foto ?? null },
    });
  }
  for (const p of pubsE) {
    if (suspE.has(p.empresaId)) continue;
    mapa.set(`e${p.id}`, {
      ref: `e${p.id}`,
      origem: "empresa",
      id: p.id,
      tipo: p.tipo,
      texto: trecho(p.texto),
      imagem: null,
      criadaEm: p.criadaEm,
      autor: { id: p.empresaId, nome: nomeE.get(p.empresaId) ?? "Empresa", foto: fotosE.get(p.empresaId)?.foto ?? null },
    });
  }
  return mapa;
}

export const cartaoPublicacao = (m, mapa) => (m.apagadaEm || !m.publicacaoRef ? null : mapa.get(m.publicacaoRef) ?? { ref: m.publicacaoRef, indisponivel: true });

export async function gravarImagem(origem, mensagemId, imagem, transaction) {
  if (!imagem) return null;
  const chave = novaChave();
  await MensagemImagem.create({ origem, mensagemId, chave, ...imagem }, { transaction });
  return { chave, largura: imagem.largura, altura: imagem.altura };
}

export async function imagensDe(origem, ids) {
  if (!ids.length) return new Map();
  const linhas = await MensagemImagem.findAll({ attributes: ["mensagemId", "chave", "largura", "altura"], where: { origem, mensagemId: { [Op.in]: ids } } });
  return new Map(linhas.map((l) => [l.mensagemId, { chave: l.chave, largura: l.largura, altura: l.altura }]));
}

export const apagarImagens = (origem, ids, transaction) =>
  ids.length ? MensagemImagem.destroy({ where: { origem, mensagemId: { [Op.in]: ids } }, transaction }) : 0;

export function previa(m, minha, imagem) {
  if (m.apagadaEm) return "Mensagem apagada";
  const corpo = m.texto || (imagem ? "📷 Foto" : m.publicacaoRef ? "Compartilhou uma publicação" : "");
  return `${minha ? "Você: " : ""}${imagem && m.texto ? "📷 " : ""}${corpo}`;
}

export async function bloqueioEntre(meuId, outraId) {
  const linhas = await Bloqueio.findAll({
    where: { [Op.or]: [{ usuariaId: meuId, bloqueadaId: outraId }, { usuariaId: outraId, bloqueadaId: meuId }] },
  });
  return { euBloqueei: linhas.some((l) => l.usuariaId === meuId), meBloqueou: linhas.some((l) => l.usuariaId === outraId) };
}

export async function bloqueadasPor(meuId) {
  const linhas = await Bloqueio.findAll({ where: { [Op.or]: [{ usuariaId: meuId }, { bloqueadaId: meuId }] } });
  return {
    euBloqueei: new Set(linhas.filter((l) => l.usuariaId === meuId).map((l) => l.bloqueadaId)),
    meBloquearam: new Set(linhas.filter((l) => l.bloqueadaId === meuId).map((l) => l.usuariaId)),
  };
}
