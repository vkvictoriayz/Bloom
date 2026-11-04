import { Op } from "sequelize";
import { Notificacao } from "../models/Interacao.js";

// Cria uma notificação. Com "chave", não repete o aviso enquanto o anterior
// com a mesma chave não for lido (ex.: uma conversa com várias mensagens
// novas gera um aviso só). Falha aqui nunca derruba a ação principal.
export async function notificar({ tipoConta, contaId, tipo, texto, link = null, chave = null }) {
  try {
    if (chave) {
      const aberta = await Notificacao.findOne({ where: { tipoConta, contaId, chave, lidaEm: { [Op.is]: null } } });
      if (aberta) {
        await aberta.update({ texto: texto.slice(0, 300), criadaEm: new Date() });
        return;
      }
    }
    await Notificacao.create({ tipoConta, contaId, tipo, texto: texto.slice(0, 300), link, chave });
  } catch (e) {
    console.error("Falha ao criar notificação:", e.message);
  }
}
