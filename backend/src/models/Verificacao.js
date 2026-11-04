import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Dados de verificação das contas, em tabelas próprias: CADASTRO_USUARIA e
// CADASTRO_EMPRESA continuam como estão. Criadas na primeira execução do
// servidor (sync só cria o que falta, nunca altera).

const opcoes = (tableName, extra = {}) => ({ tableName, freezeTableName: true, timestamps: false, ...extra });

// Resultado da verificação do CPF da candidata. Não guarda o documento de
// novo nem a data de nascimento: só o status e de onde ele veio.
export const UsuariaVerificacao = sequelize.define(
  "UsuariaVerificacao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_verificacao" },
    usuariaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "id_usuario",
      references: { model: "CADASTRO_USUARIA", key: "id_usuario" },
    },
    // verificado: confirmado pelo serviço oficial
    // nao_verificado: consulta não configurada no servidor
    // pendente: o serviço estava fora do ar no cadastro
    cpfStatus: { type: DataTypes.ENUM("verificado", "nao_verificado", "pendente"), allowNull: false, field: "cpf_status" },
    cpfFonte: { type: DataTypes.STRING(60), field: "cpf_fonte" },
    cpfVerificadoEm: { type: DataTypes.DATE, field: "cpf_verificado_em" },
  },
  opcoes("USUARIA_VERIFICACAO")
);

// Dados cadastrais da empresa vindos da consulta do CNPJ e o responsável
// pela conta. O CNAE é o da Receita, não a área de atuação escolhida no
// perfil da Bloom.
export const EmpresaCadastro = sequelize.define(
  "EmpresaCadastro",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_dados" },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "id_empresa",
      references: { model: "CADASTRO_EMPRESA", key: "id_empresa" },
    },
    razaoSocial: { type: DataTypes.STRING(200), allowNull: false, field: "razao_social" },
    nomeFantasia: { type: DataTypes.STRING(200), field: "nome_fantasia" },
    situacaoCadastral: { type: DataTypes.STRING(30), allowNull: false, field: "situacao_cadastral" },
    cnaePrincipal: { type: DataTypes.STRING(10), field: "cnae_principal" },
    cnaeDescricao: { type: DataTypes.STRING(255), field: "cnae_descricao" },
    municipio: { type: DataTypes.STRING(100) },
    uf: { type: DataTypes.STRING(2) },
    fonte: { type: DataTypes.STRING(80), allowNull: false },
    consultadoEm: { type: DataTypes.DATE, allowNull: false, field: "consultado_em" },
    responsavelNome: { type: DataTypes.STRING(100), allowNull: false, field: "responsavel_nome" },
    responsavelCargo: { type: DataTypes.STRING(80), field: "responsavel_cargo" },
    // O CNPJ confirma a empresa, não a pessoa. "pendente" até haver uma
    // verificação adicional do vínculo (ver docs/autenticacao.md).
    representanteStatus: {
      type: DataTypes.ENUM("pendente", "verificado"),
      allowNull: false,
      defaultValue: "pendente",
      field: "representante_status",
    },
    declarouRepresentacaoEm: { type: DataTypes.DATE, allowNull: false, field: "declarou_representacao_em" },
  },
  opcoes("EMPRESA_DADOS_CADASTRAIS")
);

// Pedidos de redefinição de senha. Só o hash (SHA-256) do token fica no
// banco; o token em si vai apenas no link enviado por e-mail.
export const RedefinicaoSenha = sequelize.define(
  "RedefinicaoSenha",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_redefinicao" },
    tipoConta: { type: DataTypes.ENUM("usuaria", "empresa"), allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true, field: "token_hash" },
    expiraEm: { type: DataTypes.DATE, allowNull: false, field: "expira_em" },
    usadoEm: { type: DataTypes.DATE, field: "usado_em" },
    criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criado_em" },
  },
  opcoes("REDEFINICAO_SENHA", { indexes: [{ fields: ["tipo_conta", "id_conta"] }] })
);

export async function prepararVerificacao() {
  for (const modelo of [UsuariaVerificacao, EmpresaCadastro, RedefinicaoSenha]) {
    await modelo.sync();
  }
}
