import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Models da área empresarial.
//
// PERFIL_EMPRESA, VAGAS e CANDIDATURAS seguem exatamente "banco bloom.sql"
// (mesmos nomes de tabela, colunas e ENUMs). Duas tabelas são novas:
//  - CANDIDATURA_ENVIO: o que a candidata enviou junto com a candidatura
//    (apresentação, links, título e competências), já que CANDIDATURAS não
//    tem colunas para isso;
//  - PUBLICACAO_EMPRESA: publicações feitas por empresas (PUBLICACAO só
//    aceita usuárias).
// prepararEmpresarial() cria só o que faltar; nunca altera nem apaga tabelas.

const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });
const refEmpresa = { model: "CADASTRO_EMPRESA", key: "id_empresa" };
const refUsuaria = { model: "CADASTRO_USUARIA", key: "id_usuario" };

// Valores depois da migration 001 (backend/migrations/001_area_empresa.sql).
export const STATUS_VAGA = ["Rascunho", "Aberta", "Pausada", "Encerrada"];
export const STATUS_CANDIDATURA = ["Recebida", "Em análise", "Em entrevista", "Aprovada", "Reprovada"];

export const PerfilEmpresa = sequelize.define(
  "PerfilEmpresa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_perfil_empresa" },
    empresaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_empresa", references: refEmpresa },
    logo: { type: DataTypes.STRING(255) },
    descricao: { type: DataTypes.STRING(500) },
    localizacao: { type: DataTypes.STRING(150) },
    site: { type: DataTypes.STRING(255) },
    // Colunas da migration 001
    areaAtuacao: { type: DataTypes.STRING(100), field: "area_atuacao" },
    linkedin: { type: DataTypes.STRING(255) },
    emailContato: { type: DataTypes.STRING(150), field: "email_contato" },
    informacoes: { type: DataTypes.STRING(1000) },
  },
  opcoes("PERFIL_EMPRESA")
);

export const Vaga = sequelize.define(
  "Vaga",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_vaga" },
    perfilEmpresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_perfil_empresa",
      references: { model: "PERFIL_EMPRESA", key: "id_perfil_empresa" },
    },
    titulo: { type: DataTypes.STRING(150), allowNull: false },
    descricao: { type: DataTypes.STRING(500), allowNull: false },
    requisitos: { type: DataTypes.STRING(500) },
    area: { type: DataTypes.STRING(100) },
    localizacao: { type: DataTypes.STRING(150) },
    modalidade: { type: DataTypes.STRING(50) },
    tipoContrato: { type: DataTypes.STRING(50), field: "tipo_contrato" },
    salario: { type: DataTypes.DECIMAL(10, 2) }, // salário (ou mínimo da faixa)
    dataPublicacao: { type: DataTypes.DATEONLY, field: "data_publicacao" },
    status: { type: DataTypes.ENUM(...STATUS_VAGA) },
    // Colunas da migration 001
    nivel: { type: DataTypes.STRING(30) },
    beneficios: { type: DataTypes.STRING(500) },
    salarioMax: { type: DataTypes.DECIMAL(10, 2), field: "salario_max" },
  },
  opcoes("VAGAS")
);

export const Candidatura = sequelize.define(
  "Candidatura",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_candidatura" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: refUsuaria },
    vagaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_vaga", references: { model: "VAGAS", key: "id_vaga" } },
    data: { type: DataTypes.DATEONLY, field: "data_candidatura" },
    status: { type: DataTypes.ENUM(...STATUS_CANDIDATURA), allowNull: false, defaultValue: "Recebida" },
  },
  { ...opcoes("CANDIDATURAS"), indexes: [{ unique: true, fields: ["id_usuario", "id_vaga"] }] }
);

export const CandidaturaEnvio = sequelize.define(
  "CandidaturaEnvio",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_candidatura_envio" },
    candidaturaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "id_candidatura",
      references: { model: "CANDIDATURAS", key: "id_candidatura" },
    },
    titulo: { type: DataTypes.STRING(100) },
    competencias: { type: DataTypes.STRING(500) }, // separadas por vírgula
    apresentacao: { type: DataTypes.STRING(1000) },
    links: { type: DataTypes.STRING(1500) }, // JSON: [{ rotulo, url }]
  },
  opcoes("CANDIDATURA_ENVIO")
);

export const PublicacaoEmpresa = sequelize.define(
  "PublicacaoEmpresa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_publicacao_empresa" },
    empresaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_empresa", references: refEmpresa },
    tipo: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "oportunidade" },
    texto: { type: DataTypes.STRING(1000), allowNull: false },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    editadaEm: { type: DataTypes.DATE, field: "editada_em" },
  },
  opcoes("PUBLICACAO_EMPRESA")
);

// Cria só as tabelas que faltam, na ordem das chaves estrangeiras.
export async function prepararEmpresarial() {
  for (const modelo of [PerfilEmpresa, Vaga, Candidatura, CandidaturaEnvio, PublicacaoEmpresa]) {
    await modelo.sync();
  }
}
