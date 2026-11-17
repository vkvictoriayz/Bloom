import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });

export const NIVEIS_ADMIN = ["super", "moderador"];

export const Admin = sequelize.define(
  "Admin",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_admin" },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    usuario: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "nome_usuario" },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    senhaHash: { type: DataTypes.STRING(255), allowNull: false, field: "senha_hash" },
    nivel: { type: DataTypes.STRING(50), field: "nivel_acesso" },
    criadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "data_criacao" },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ultimoAcesso: { type: DataTypes.DATE, field: "ultimo_acesso" },
    totpSegredo: { type: DataTypes.STRING(200), field: "totp_segredo" },
    totpAtivo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "totp_ativo" },
    totpUltimoPasso: { type: DataTypes.BIGINT, field: "totp_ultimo_passo" },
    codigosRecuperacao: { type: DataTypes.TEXT, field: "codigos_recuperacao" },
    deveTrocarSenha: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "deve_trocar_senha" },
  },
  opcoes("ADMINS")
);

export const LogAdmin = sequelize.define(
  "LogAdmin",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_log" },
    adminId: { type: DataTypes.INTEGER, allowNull: false, field: "id_admin" },
    acao: { type: DataTypes.STRING(100), allowNull: false },
    tabela: { type: DataTypes.STRING(100), field: "tabela_afetada" },
    registroId: { type: DataTypes.INTEGER, field: "registro_id" },
    detalhes: { type: DataTypes.STRING(500) },
    em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "data_acao" },
  },
  opcoes("LOGS_ADMIN")
);

export const DashboardAdmin = sequelize.define(
  "DashboardAdmin",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_dashboard" },
    data: { type: DataTypes.DATEONLY, allowNull: false, unique: true, field: "data_referencia" },
    totalUsuarias: { type: DataTypes.INTEGER, defaultValue: 0, field: "total_usuarios" },
    totalEmpresas: { type: DataTypes.INTEGER, defaultValue: 0, field: "total_empresas" },
    totalVagas: { type: DataTypes.INTEGER, defaultValue: 0, field: "total_vagas" },
    totalCandidaturas: { type: DataTypes.INTEGER, defaultValue: 0, field: "total_candidaturas" },
    novasUsuarias: { type: DataTypes.INTEGER, defaultValue: 0, field: "novos_usuarios_dia" },
    novasEmpresas: { type: DataTypes.INTEGER, defaultValue: 0, field: "novas_empresas_dia" },
    novasVagas: { type: DataTypes.INTEGER, defaultValue: 0, field: "novas_vagas_dia" },
    novasCandidaturas: { type: DataTypes.INTEGER, defaultValue: 0, field: "novas_candidaturas_dia" },
    atualizadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "atualizacao_em" },
  },
  opcoes("DASHBOARD_ADMIN")
);

export const Comunicado = sequelize.define(
  "Comunicado",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_comunicado" },
    adminId: { type: DataTypes.INTEGER, allowNull: false, field: "id_admin" },
    publico: { type: DataTypes.ENUM("todos", "usuarias", "empresas"), allowNull: false },
    texto: { type: DataTypes.STRING(300), allowNull: false },
    link: { type: DataTypes.STRING(200) },
    enviados: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criado_em" },
  },
  opcoes("COMUNICADO")
);

export function registrarAcao(adminId, acao, tabela = null, registroId = null, detalhes = null) {
  return LogAdmin.create({ adminId, acao, tabela, registroId, detalhes: detalhes ? String(detalhes).slice(0, 500) : null });
}
