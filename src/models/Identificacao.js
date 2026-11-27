import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });

export const IDENTIDADES_GENERO = ["mulher_cis", "mulher_trans", "nao_informar"];

// Dados de identificação: acesso restrito (só a própria candidata).
export const UsuariaIdentificacao = sequelize.define(
  "UsuariaIdentificacao",
  {
    usuariaId: { type: DataTypes.INTEGER, primaryKey: true, field: "id_usuario" },
    nomeCivil: { type: DataTypes.STRING(100), allowNull: false, field: "nome_civil" },
    nomeSocial: { type: DataTypes.STRING(100), field: "nome_social" },
    identidadeGenero: { type: DataTypes.ENUM(...IDENTIDADES_GENERO), allowNull: false, defaultValue: "nao_informar", field: "identidade_genero" },
    atualizadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "atualizado_em" },
  },
  opcoes("USUARIA_IDENTIFICACAO")
);

export const Consentimento = sequelize.define(
  "Consentimento",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_consentimento" },
    tipoConta: { type: DataTypes.ENUM("usuaria", "empresa"), allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    tipo: { type: DataTypes.ENUM("termos_privacidade", "ciencia_tratamento", "comunicacoes"), allowNull: false },
    versao: { type: DataTypes.STRING(20), allowNull: false },
    aceito: { type: DataTypes.BOOLEAN, allowNull: false },
    registradoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "registrado_em" },
  },
  opcoes("CONSENTIMENTO")
);
