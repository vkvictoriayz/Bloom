import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });
const arquivo = {
  nomeArquivo: { type: DataTypes.STRING(150), allowNull: false, field: "nome_arquivo" },
  mime: { type: DataTypes.STRING(100), allowNull: false },
  tamanho: { type: DataTypes.INTEGER, allowNull: false },
  dados: { type: DataTypes.BLOB("medium"), allowNull: false },
  enviadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "enviado_em" },
};

export const CurriculoCandidata = sequelize.define(
  "CurriculoCandidata",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_curriculo" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_usuario" },
    ...arquivo,
  },
  opcoes("CURRICULO_CANDIDATA")
);

export const CandidaturaCurriculo = sequelize.define(
  "CandidaturaCurriculo",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_candidatura_curriculo" },
    candidaturaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_candidatura" },
    ...arquivo,
  },
  opcoes("CANDIDATURA_CURRICULO")
);

export const resumoArquivo = (c) => (c ? { nome: c.nomeArquivo, tamanho: c.tamanho, enviadoEm: c.enviadoEm } : null);

export function enviarArquivo(res, c) {
  const nome = c.nomeArquivo.replace(/["\\\r\n]/g, "");
  res.set({
    "Content-Type": c.mime,
    "Content-Length": String(c.dados.length),
    "Content-Disposition": `attachment; filename="${nome.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  });
  return res.send(c.dados);
}
