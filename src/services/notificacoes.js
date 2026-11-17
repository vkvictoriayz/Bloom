import { Op } from "sequelize";
import { Notificacao } from "../models/Interacao.js";
import { PreferenciaNotificacao } from "../models/Premium.js";

// Categoria de preferência de cada tipo de notificação.
const CATEGORIA = {
  vaga: "vagasCompativeis",
  candidatura: "candidaturas",
  mensagem: "mensagens",
  convite: "convites",
  curtida: "comunidade",
  comentario: "comunidade",
  conexao: "comunidade",
  plataforma: "plataforma",
};

// Categorias que fazem sentido para cada tipo de conta.
export const CATEGORIAS = {
  usuaria: ["vagasCompativeis", "candidaturas", "mensagens", "convites", "comunidade", "plataforma"],
  empresa: ["candidaturas", "mensagens", "plataforma"],
};

// Preferências salvas (sem linha, tudo ligado).
export async function preferenciasDe(tipoConta, contaId) {
  const linha = await PreferenciaNotificacao.findOne({ where: { tipoConta, contaId } });
  return Object.fromEntries(CATEGORIAS[tipoConta].map((c) => [c, linha ? linha[c] !== false : true]));
}

// Cria uma notificação, se a conta não desligou a categoria dela. Com
// "chave", não repete o aviso enquanto o anterior com a mesma chave não for
// lido (ex.: várias mensagens da mesma conversa geram um aviso só). Falha
// aqui nunca derruba a ação principal.
// Devolve true se o aviso foi criado (false: a pessoa desligou a categoria ou deu erro).
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
