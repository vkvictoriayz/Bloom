import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Tabela CADASTRO_USUARIA
export const Usuaria = sequelize.define(
  "Usuaria",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_usuario" },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    cpf: { type: DataTypes.STRING(11), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    telefone: { type: DataTypes.STRING(20) },
    senhaHash: { type: DataTypes.STRING(255), allowNull: false, field: "senha_hash" },
    // Migration 005: suspensão feita pela administração.
    suspensaEm: { type: DataTypes.DATE, field: "suspensa_em" },
    motivoSuspensao: { type: DataTypes.STRING(300), field: "motivo_suspensao" },
  },
  { tableName: "CADASTRO_USUARIA", freezeTableName: true, timestamps: false }
);
