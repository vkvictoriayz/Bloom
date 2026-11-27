import { Consentimento } from "../models/Identificacao.js";

// Versão vigente dos Termos de Uso e da Política de Privacidade (mesma data exibida nas páginas).
export const VERSAO_DOCUMENTOS = "2026-11-27";

// Os dois aceites do cadastro são obrigatórios; comunicações é opcional e registrado à parte.
export function lerConsentimentos(corpo) {
  return {
    aceiteTermos: corpo?.aceiteTermos === true,
    cienciaDados: corpo?.cienciaDados === true,
    comunicacoes: corpo?.comunicacoes === true,
  };
}

export function faltaConsentimento({ aceiteTermos, cienciaDados }) {
  if (!aceiteTermos) return ["Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.", "aceiteTermos"];
  if (!cienciaDados) return ["Confirme que está ciente do tratamento dos seus dados.", "cienciaDados"];
  return null;
}

export function registrarConsentimentos(tipoConta, contaId, { comunicacoes }, transaction) {
  const base = { tipoConta, contaId, versao: VERSAO_DOCUMENTOS };
  return Consentimento.bulkCreate(
    [
      { ...base, tipo: "termos_privacidade", aceito: true },
      { ...base, tipo: "ciencia_tratamento", aceito: true },
      { ...base, tipo: "comunicacoes", aceito: Boolean(comunicacoes) },
    ],
    { transaction }
  );
}
