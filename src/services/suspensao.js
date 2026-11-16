import { Op } from "sequelize";
import { Empresa, Usuaria } from "../models/index.js";

// Contas suspensas pela administração. A lista fica em memória por alguns
// segundos para o login de cada requisição não consultar o banco toda vez;
// ao suspender ou reativar, a administração limpa o cache na hora.
const VALIDADE = 10 * 1000;
const cache = new Map(); // tipo -> { ate, ids }

export async function contasSuspensas(tipo) {
  const atual = cache.get(tipo);
  if (atual && atual.ate > Date.now()) return atual.ids;
  const Model = tipo === "empresa" ? Empresa : Usuaria;
  const linhas = await Model.findAll({ attributes: ["id"], where: { suspensaEm: { [Op.ne]: null } } });
  const ids = new Set(linhas.map((l) => l.id));
  cache.set(tipo, { ate: Date.now() + VALIDADE, ids });
  return ids;
}

export function limparCacheSuspensao() {
  cache.clear();
}

export const MENSAGEM_SUSPENSA = "Esta conta está suspensa. Para saber o motivo ou pedir a revisão, escreva para contato@bloom.com.br.";
