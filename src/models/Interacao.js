import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Notificações e mensagens (tabelas novas). Valem para os dois tipos de
// conta: "tipo_conta" + "id_conta" dizem de quem é cada registro.

const opcoes = (tableName, extra = {}) => ({ tableName, freezeTableName: true, timestamps: false, ...extra });
const TIPO_CONTA = DataTypes.ENUM("usuaria", "empresa");

export const Notificacao = sequelize.define(
  "Notificacao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_notificacao" },
    tipoConta: { type: TIPO_CONTA, allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    // candidatura | conexao | curtida | comentario | mensagem
    tipo: { type: DataTypes.STRING(20), allowNull: false },
    texto: { type: DataTypes.STRING(300), allowNull: false },
    link: { type: DataTypes.STRING(200) },
    // Agrupa avisos repetidos (ex.: várias mensagens da mesma conversa).
    chave: { type: DataTypes.STRING(60) },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    lidaEm: { type: DataTypes.DATE, field: "lida_em" },
  },
  opcoes("NOTIFICACAO", { indexes: [{ fields: ["tipo_conta", "id_conta", "lida_em"] }] })
);

// Conversa entre uma candidata e uma empresa, sempre ligada a uma
// candidatura: só conversa quem tem um processo seletivo em comum.
export const Conversa = sequelize.define(
  "Conversa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_conversa" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: { model: "CADASTRO_USUARIA", key: "id_usuario" } },
    empresaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_empresa", references: { model: "CADASTRO_EMPRESA", key: "id_empresa" } },
    candidaturaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "id_candidatura",
      references: { model: "CANDIDATURAS", key: "id_candidatura" },
    },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    atualizadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "atualizada_em" },
  },
  opcoes("CONVERSA")
);

export const Mensagem = sequelize.define(
  "Mensagem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_mensagem" },
    conversaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conversa", references: { model: "CONVERSA", key: "id_conversa" } },
    autorTipo: { type: TIPO_CONTA, allowNull: false, field: "autor_tipo" },
    texto: { type: DataTypes.STRING(1000), allowNull: false },
    enviadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "enviada_em" },
    lidaEm: { type: DataTypes.DATE, field: "lida_em" },
    // Migration 011: quando quem enviou apagou a mensagem (o texto sai do banco).
    apagadaEm: { type: DataTypes.DATE, field: "apagada_em" },
  },
  opcoes("MENSAGEM", { indexes: [{ fields: ["id_conversa", "enviada_em"] }] })
);

export async function prepararInteracao() {
  for (const modelo of [Notificacao, Conversa, Mensagem]) {
    await modelo.sync();
  }
}
