import { Op } from "sequelize";
import { Bloqueio, MensagemImagem } from "../models/RedeSocial.js";
import { lerImagem, novaChave } from "../utils/imagem.js";

// Peças do chat usadas pelas conversas com empresas (InteracaoController) e
// entre candidatas (MensagemDiretaController).

const LIMITE_IMAGEM = 2 * 1024 * 1024; // 2 MB (a tela reduz a foto antes de enviar)
const medida = (v) => (Number.isInteger(v) && v > 0 && v <= 10000 ? v : null);

// Lê { texto, imagem?, largura?, altura? }: precisa de texto ou imagem.
// Devolve { texto, imagem } ou { falha: [mensagem, campo] }.
export function lerMensagem(body = {}, limiteTexto = 1000) {
  const texto = typeof body.texto === "string" ? body.texto.trim() : "";
  if (texto.length > limiteTexto) return { falha: [`Use até ${limiteTexto} caracteres.`, "texto"] };
  let imagem = null;
  if (body.imagem) {
    const lida = lerImagem(body.imagem, LIMITE_IMAGEM);
    if (lida.erro) return { falha: [lida.erro, "imagem"] };
    imagem = { mime: lida.mime, dados: lida.dados, largura: medida(body.largura), altura: medida(body.altura) };
  }
  if (!texto && !imagem) return { falha: ["Escreva uma mensagem ou escolha uma imagem.", "texto"] };
  return { texto, imagem };
}

export async function gravarImagem(origem, mensagemId, imagem, transaction) {
  if (!imagem) return null;
  const chave = novaChave();
  await MensagemImagem.create({ origem, mensagemId, chave, ...imagem }, { transaction });
  return { chave, largura: imagem.largura, altura: imagem.altura };
}

// Imagens de várias mensagens: Map(idMensagem -> { chave, largura, altura }).
export async function imagensDe(origem, ids) {
  if (!ids.length) return new Map();
  const linhas = await MensagemImagem.findAll({ attributes: ["mensagemId", "chave", "largura", "altura"], where: { origem, mensagemId: { [Op.in]: ids } } });
  return new Map(linhas.map((l) => [l.mensagemId, { chave: l.chave, largura: l.largura, altura: l.altura }]));
}

export const apagarImagens = (origem, ids, transaction) =>
  ids.length ? MensagemImagem.destroy({ where: { origem, mensagemId: { [Op.in]: ids } }, transaction }) : 0;

// Prévia da última mensagem na lista de conversas.
export function previa(m, minha, imagem) {
  if (m.apagadaEm) return "Mensagem apagada";
  const corpo = m.texto || (imagem ? "📷 Foto" : "");
  return `${minha ? "Você: " : ""}${imagem && m.texto ? "📷 " : ""}${corpo}`;
}

// Bloqueio entre duas candidatas, nos dois sentidos.
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
