import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const opcoes = (tableName, extra = {}) => ({ tableName, freezeTableName: true, timestamps: false, ...extra });
const refUsuaria = { model: "CADASTRO_USUARIA", key: "id_usuario" };
const refPerfil = { model: "PERFIL_USUARIA", key: "id_perfil_usuaria" };

export const PerfilUsuaria = sequelize.define(
  "PerfilUsuaria",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_perfil_usuaria" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_usuario", references: refUsuaria },
    foto: { type: DataTypes.STRING(255) },
    descricao: { type: DataTypes.STRING(500) },
    localizacao: { type: DataTypes.STRING(150) },
    curriculo: { type: DataTypes.STRING(255) },
  },
  opcoes("PERFIL_USUARIA")
);

export const Experiencia = sequelize.define(
  "Experiencia",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_experiencia" },
    perfilId: { type: DataTypes.INTEGER, allowNull: false, field: "id_perfil_usuaria", references: refPerfil },
    empresa: { type: DataTypes.STRING(100), field: "nome_empresa" },
    cargo: { type: DataTypes.STRING(100) },
    descricao: { type: DataTypes.STRING(250) },
    inicio: { type: DataTypes.DATEONLY, field: "data_inicio" },
    fim: { type: DataTypes.DATEONLY, field: "data_fim" },
  },
  opcoes("EXPERIENCIA")
);

export const Formacao = sequelize.define(
  "Formacao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_formacao" },
    perfilId: { type: DataTypes.INTEGER, allowNull: false, field: "id_perfil_usuaria", references: refPerfil },
    instituicao: { type: DataTypes.STRING(150), allowNull: false },
    curso: { type: DataTypes.STRING(150), allowNull: false },
    nivel: { type: DataTypes.STRING(50) },
    inicio: { type: DataTypes.DATEONLY, field: "data_inicio" },
    conclusao: { type: DataTypes.DATEONLY, field: "data_conclusao" },
  },
  opcoes("FORMACAO")
);

export const Habilidade = sequelize.define(
  "Habilidade",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_habilidade" },
    nome: { type: DataTypes.STRING(100), allowNull: false },
  },
  opcoes("HABILIDADE")
);

export const PerfilHabilidade = sequelize.define(
  "PerfilHabilidade",
  {
    perfilId: { type: DataTypes.INTEGER, primaryKey: true, field: "id_perfil_usuaria", references: refPerfil },
    habilidadeId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: "id_habilidade",
      references: { model: "HABILIDADE", key: "id_habilidade" },
    },
  },
  opcoes("PERFIL_HABILIDADE")
);

export const Favorito = sequelize.define(
  "Favorito",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_favorito" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: refUsuaria },
    vagaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_vaga", references: { model: "VAGAS", key: "id_vaga" } },
    data: { type: DataTypes.DATEONLY, field: "data_favorito" },
  },
  opcoes("FAVORITOS", { indexes: [{ unique: true, fields: ["id_usuario", "id_vaga"] }] })
);

export const ConfigUsuaria = sequelize.define(
  "ConfigUsuaria",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_config_usu" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_usuaria", references: refUsuaria },
    perfilPublico: { type: DataTypes.BOOLEAN, field: "perfil_publico" },
    receberNotifEmail: { type: DataTypes.BOOLEAN, field: "receber_notif_email" },
    mostrarExperiencia: { type: DataTypes.BOOLEAN, field: "mostrar_experiencia" },
    mostrarContato: { type: DataTypes.BOOLEAN, field: "mostrar_contato" },
    idiomaPreferido: { type: DataTypes.STRING(50), field: "idioma_preferido" },
    modoNoturno: { type: DataTypes.BOOLEAN, field: "modo_noturno" },
  },
  opcoes("CONFIG_USUARIA")
);

export const PerfilDetalhes = sequelize.define(
  "PerfilDetalhes",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_detalhes" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_usuario", references: refUsuaria },
    cargo: { type: DataTypes.STRING(100) },
    objetivo: { type: DataTypes.STRING(500) },
    links: { type: DataTypes.JSON },
    preferencias: { type: DataTypes.JSON },
    comportamentais: { type: DataTypes.JSON },
    cursos: { type: DataTypes.JSON },
    atualizadoEm: { type: DataTypes.DATE, field: "atualizado_em" },
  },
  opcoes("PERFIL_CANDIDATA_DETALHES")
);

export const Projeto = sequelize.define(
  "Projeto",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_projeto" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario", references: refUsuaria },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    descricao: { type: DataTypes.STRING(1000) },
    imagem: { type: DataTypes.TEXT("medium") },
    tecnologias: { type: DataTypes.JSON },
    repositorio: { type: DataTypes.STRING(255) },
    demo: { type: DataTypes.STRING(255) },
    inicio: { type: DataTypes.STRING(7) },
    fim: { type: DataTypes.STRING(7) },
    criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criado_em" },
  },
  opcoes("PROJETO_CANDIDATA")
);

export async function prepararCandidata() {
  for (const modelo of [PerfilUsuaria, Experiencia, Formacao, Habilidade, PerfilHabilidade, Favorito, ConfigUsuaria, PerfilDetalhes, Projeto]) {
    await modelo.sync();
  }
}
