import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const opcoes = (tableName, extra = {}) => ({ tableName, freezeTableName: true, timestamps: false, ...extra });
const refUsuaria = { model: "CADASTRO_USUARIA", key: "id_usuario" };
const refComunidade = { model: "COMUNIDADE", key: "id_comunidade" };

export const Comunidade = sequelize.define(
  "Comunidade",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_comunidade" },
    nome: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    tema: { type: DataTypes.STRING(60), allowNull: false },
    descricao: { type: DataTypes.STRING(500), allowNull: false },
    criadoraId: { type: DataTypes.INTEGER, allowNull: false, field: "id_criadora", references: refUsuaria },
    icone: { type: DataTypes.STRING(40) },
    regras: { type: DataTypes.STRING(1000) },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
  },
  opcoes("COMUNIDADE")
);

export const ComunidadeMembro = sequelize.define(
  "ComunidadeMembro",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_membro" },
    comunidadeId: { type: DataTypes.INTEGER, allowNull: false, field: "id_comunidade", references: refComunidade },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: refUsuaria },
    entrouEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "entrou_em" },
  },
  opcoes("COMUNIDADE_MEMBRO", { indexes: [{ unique: true, fields: ["id_comunidade", "id_usuario"] }] })
);

export const ComunidadePublicacao = sequelize.define(
  "ComunidadePublicacao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_vinculo" },
    comunidadeId: { type: DataTypes.INTEGER, allowNull: false, field: "id_comunidade", references: refComunidade },
    publicacaoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "id_publicacao",
      references: { model: "PUBLICACAO", key: "id_publicacao" },
    },
  },
  opcoes("COMUNIDADE_PUBLICACAO")
);

export const ComunidadeCapa = sequelize.define(
  "ComunidadeCapa",
  {
    comunidadeId: { type: DataTypes.INTEGER, primaryKey: true, field: "id_comunidade", references: refComunidade },
    chave: { type: DataTypes.CHAR(32), allowNull: false, unique: true },
    mime: { type: DataTypes.STRING(20), allowNull: false },
    dados: { type: DataTypes.BLOB("medium"), allowNull: false },
    atualizadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "atualizada_em" },
  },
  opcoes("COMUNIDADE_CAPA")
);

export async function prepararGrupos() {
  for (const modelo of [Comunidade, ComunidadeMembro, ComunidadePublicacao]) {
    await modelo.sync();
  }
}
