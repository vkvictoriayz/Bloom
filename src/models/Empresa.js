import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Empresa = sequelize.define(
  "Empresa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_empresa" },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    cnpj: { type: DataTypes.STRING(14), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    telefone: { type: DataTypes.STRING(20) },
    senhaHash: { type: DataTypes.STRING(255), allowNull: false, field: "senha_hash" },
    suspensaEm: { type: DataTypes.DATE, field: "suspensa_em" },
    motivoSuspensao: { type: DataTypes.STRING(300), field: "motivo_suspensao" },
    emailVerificadoEm: { type: DataTypes.DATE, field: "email_verificado_em" },
  },
  { tableName: "CADASTRO_EMPRESA", freezeTableName: true, timestamps: false }
);
