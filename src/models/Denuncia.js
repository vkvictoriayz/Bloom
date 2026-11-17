import { DataTypes, Op } from "sequelize";
import { sequelize } from "../config/database.js";

export const ALVOS_DENUNCIA = ["publicacao", "publicacao_empresa", "comentario", "perfil", "empresa", "vaga", "comunidade"];
export const MOTIVOS_DENUNCIA = {
  spam: "Spam ou propaganda enganosa",
  assedio: "Assédio, ofensa ou discurso de ódio",
  improprio: "Conteúdo impróprio",
  golpe: "Golpe, vaga falsa ou informação enganosa",
  dados: "Exposição de dados pessoais",
  outro: "Outro motivo",
};

export const Denuncia = sequelize.define(
  "Denuncia",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_denuncia" },
    tipoConta: { type: DataTypes.ENUM("usuaria", "empresa"), allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    alvoTipo: { type: DataTypes.ENUM(...ALVOS_DENUNCIA), allowNull: false, field: "alvo_tipo" },
    alvoId: { type: DataTypes.INTEGER, allowNull: false, field: "alvo_id" },
    motivo: { type: DataTypes.STRING(30), allowNull: false },
    descricao: { type: DataTypes.STRING(500) },
    status: { type: DataTypes.ENUM("aberta", "resolvida", "descartada"), allowNull: false, defaultValue: "aberta" },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    adminId: { type: DataTypes.INTEGER, field: "id_admin" },
    resolucao: { type: DataTypes.STRING(300) },
    resolvidaEm: { type: DataTypes.DATE, field: "resolvida_em" },
  },
  { tableName: "DENUNCIA", freezeTableName: true, timestamps: false }
);

export async function fecharDenunciasDoAlvo(alvoTipo, alvoId, adminId, resolucao, status = "resolvida") {
  const abertas = await Denuncia.findAll({ where: { alvoTipo, alvoId, status: "aberta" } });
  if (!abertas.length) return [];
  await Denuncia.update(
    { status, adminId, resolucao: String(resolucao ?? "").slice(0, 300) || null, resolvidaEm: new Date() },
    { where: { id: { [Op.in]: abertas.map((d) => d.id) } } }
  );
  return abertas;
}
