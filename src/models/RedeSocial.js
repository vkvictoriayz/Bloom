import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });

export const PublicacaoImagem = sequelize.define(
  "PublicacaoImagem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_imagem" },
    publicacaoId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_publicacao" },
    chave: { type: DataTypes.CHAR(32), allowNull: false, unique: true },
    mime: { type: DataTypes.STRING(20), allowNull: false },
    dados: { type: DataTypes.BLOB("medium"), allowNull: false },
    largura: { type: DataTypes.INTEGER },
    altura: { type: DataTypes.INTEGER },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
  },
  opcoes("PUBLICACAO_IMAGEM")
);

export const IconePerfil = sequelize.define(
  "IconePerfil",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_icone" },
    donoTipo: { type: DataTypes.ENUM("usuaria", "empresa"), allowNull: false, field: "dono_tipo" },
    donoId: { type: DataTypes.INTEGER, allowNull: false, field: "dono_id" },
    icone: { type: DataTypes.STRING(40), allowNull: false },
    atualizadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "atualizado_em" },
  },
  opcoes("ICONE_PERFIL")
);

export const ConversaDireta = sequelize.define(
  "ConversaDireta",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_conversa_direta" },
    usuariaA: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuaria_a" },
    usuariaB: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuaria_b" },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    atualizadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "atualizada_em" },
  },
  opcoes("CONVERSA_DIRETA")
);

export const MensagemDireta = sequelize.define(
  "MensagemDireta",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_mensagem_direta" },
    conversaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conversa_direta" },
    autoraId: { type: DataTypes.INTEGER, allowNull: false, field: "id_autora" },
    texto: { type: DataTypes.STRING(1000), allowNull: false },
    publicacaoRef: { type: DataTypes.STRING(20), field: "publicacao_ref" },
    enviadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "enviada_em" },
    lidaEm: { type: DataTypes.DATE, field: "lida_em" },
    apagadaEm: { type: DataTypes.DATE, field: "apagada_em" },
  },
  opcoes("MENSAGEM_DIRETA")
);

export const MensagemImagem = sequelize.define(
  "MensagemImagem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_imagem" },
    origem: { type: DataTypes.ENUM("empresa", "direta"), allowNull: false },
    mensagemId: { type: DataTypes.INTEGER, allowNull: false, field: "id_mensagem" },
    chave: { type: DataTypes.CHAR(32), allowNull: false, unique: true },
    mime: { type: DataTypes.STRING(20), allowNull: false },
    dados: { type: DataTypes.BLOB("medium"), allowNull: false },
    largura: { type: DataTypes.INTEGER },
    altura: { type: DataTypes.INTEGER },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
  },
  opcoes("MENSAGEM_IMAGEM")
);

export const Bloqueio = sequelize.define(
  "Bloqueio",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_bloqueio" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuaria" },
    bloqueadaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_bloqueada" },
    criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criado_em" },
  },
  opcoes("BLOQUEIO")
);
