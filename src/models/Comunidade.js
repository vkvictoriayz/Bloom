import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const refUsuaria = { model: "CADASTRO_USUARIA", key: "id_usuario" };
const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });

export const PerfilComunidade = sequelize.define(
  "PerfilComunidade",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_perfil_comunidade" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_usuario", references: refUsuaria },
    area: { type: DataTypes.STRING(80) },
    interesses: { type: DataTypes.STRING(300) },
    bio: { type: DataTypes.STRING(280) },
  },
  opcoes("PERFIL_COMUNIDADE")
);

export const Publicacao = sequelize.define(
  "Publicacao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_publicacao" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: refUsuaria },
    tipo: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "dica" },
    texto: { type: DataTypes.STRING(1000), allowNull: false },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    editadaEm: { type: DataTypes.DATE, field: "editada_em" },
  },
  opcoes("PUBLICACAO")
);

export const Comentario = sequelize.define(
  "Comentario",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_comentario" },
    publicacaoId: { type: DataTypes.INTEGER, allowNull: false, field: "id_publicacao" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: refUsuaria },
    texto: { type: DataTypes.STRING(500), allowNull: false },
    criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criado_em" },
  },
  opcoes("COMENTARIO")
);

export const Curtida = sequelize.define(
  "Curtida",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_curtida" },
    publicacaoId: { type: DataTypes.INTEGER, allowNull: false, field: "id_publicacao" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: refUsuaria },
  },
  { ...opcoes("CURTIDA"), indexes: [{ unique: true, fields: ["id_publicacao", "id_usuario"] }] }
);

export const Conexao = sequelize.define(
  "Conexao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_conexao" },
    seguidoraId: { type: DataTypes.INTEGER, allowNull: false, field: "id_seguidora", references: refUsuaria },
    seguidaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_seguida", references: refUsuaria },
  },
  { ...opcoes("CONEXAO"), indexes: [{ unique: true, fields: ["id_seguidora", "id_seguida"] }] }
);

export async function prepararComunidade() {
  for (const modelo of [PerfilComunidade, Publicacao, Comentario, Curtida, Conexao]) {
    await modelo.sync();
  }
}
