import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Tabela CADASTRO_EMPRESA
export const Empresa = sequelize.define(
  "Empresa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_empresa" },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    cnpj: { type: DataTypes.STRING(14), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    telefone: { type: DataTypes.STRING(20) },
    senhaHash: { type: DataTypes.STRING(255), allowNull: false, field: "senha_hash" },
  },
  { tableName: "CADASTRO_EMPRESA", freezeTableName: true, timestamps: false }
);
