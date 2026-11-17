import { Op } from "sequelize";
import { Notificacao } from "../models/Interacao.js";
import { PreferenciaNotificacao } from "../models/Premium.js";

const CATEGORIA = {
  vaga: "vagasCompativeis",
  candidatura: "candidaturas",
  mensagem: "mensagens",
  convite: "convites",
  curtida: "comunidade",
  comentario: "comunidade",
  conexao: "comunidade",
  comunidade: "comunidade",
  plataforma: "plataforma",
};

export const CATEGORIAS = {
  usuaria: ["vagasCompativeis", "candidaturas", "mensagens", "convites", "comunidade", "plataforma"],
  empresa: ["candidaturas", "mensagens", "plataforma"],
};

export async function preferenciasDe(tipoConta, contaId) {
  const linha = await PreferenciaNotificacao.findOne({ where: { tipoConta, contaId } });
  return Object.fromEntries(CATEGORIAS[tipoConta].map((c) => [c, linha ? linha[c] !== false : true]));
}

export async function notificar({ tipoConta, contaId, tipo, texto, link = null, chave = null }) {
  try {
    const categoria = CATEGORIA[tipo];
    if (categoria) {
      const prefs = await PreferenciaNotificacao.findOne({ where: { tipoConta, contaId } });
      if (prefs && prefs[categoria] === false) return false;
    }
    if (chave) {
      const aberta = await Notificacao.findOne({ where: { tipoConta, contaId, chave, lidaEm: { [Op.is]: null } } });
      if (aberta) {
        await aberta.update({ texto: texto.slice(0, 300), criadaEm: new Date() });
        return true;
      }
    }
    await Notificacao.create({ tipoConta, contaId, tipo, texto: texto.slice(0, 300), link, chave });
    return true;
  } catch (e) {
    console.error("Falha ao criar notificação:", e.message);
    return false;
  }
}
