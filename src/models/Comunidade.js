import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Tabelas da comunidade (rede social). Os nomes seguem o padrão do banco:
// MAIÚSCULAS e chaves id_*. São criadas automaticamente na primeira
// execução do servidor (sequelize.sync) e também estão em "banco bloom.sql".

const refUsuaria = { model: "CADASTRO_USUARIA", key: "id_usuario" };
const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });

// Como a pessoa aparece na comunidade (a foto é a inicial do nome, por ora).
export const PerfilComunidade = sequelize.define(
  "PerfilComunidade",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_perfil_comunidade" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_usuario", references: refUsuaria },
    area: { type: DataTypes.STRING(80) },
    interesses: { type: DataTypes.STRING(300) }, // separados por vírgula
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
    // Coluna da migration 003: quando a autora editou pela última vez.
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

// Quem acompanha quem (seguidora -> seguida).
export const Conexao = sequelize.define(
  "Conexao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_conexao" },
    seguidoraId: { type: DataTypes.INTEGER, allowNull: false, field: "id_seguidora", references: refUsuaria },
    seguidaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_seguida", references: refUsuaria },
  },
  { ...opcoes("CONEXAO"), indexes: [{ unique: true, fields: ["id_seguidora", "id_seguida"] }] }
);

// Cria só as tabelas que faltam; nunca altera nem apaga as existentes.
export async function prepararComunidade() {
  for (const modelo of [PerfilComunidade, Publicacao, Comentario, Curtida, Conexao]) {
    await modelo.sync();
  }
}
