import { DataTypes, Op } from "sequelize";
import { sequelize } from "../config/database.js";

// Tabelas da migration 002 (backend/migrations/002_notificacoes_premium.sql):
// preferências de notificação, convites e Bloom Premium. São criadas pela
// migration, não por sync(): aqui só o mapeamento.

const opcoes = (tableName) => ({ tableName, freezeTableName: true, timestamps: false });
const TIPO_CONTA = DataTypes.ENUM("usuaria", "empresa");

export const PreferenciaNotificacao = sequelize.define(
  "PreferenciaNotificacao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_preferencia" },
    tipoConta: { type: TIPO_CONTA, allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    vagasCompativeis: { type: DataTypes.BOOLEAN, field: "vagas_compativeis" },
    candidaturas: { type: DataTypes.BOOLEAN },
    mensagens: { type: DataTypes.BOOLEAN },
    convites: { type: DataTypes.BOOLEAN },
    comunidade: { type: DataTypes.BOOLEAN },
    plataforma: { type: DataTypes.BOOLEAN },
    atualizadaEm: { type: DataTypes.DATE, field: "atualizada_em" },
  },
  opcoes("PREFERENCIA_NOTIFICACAO")
);

export const Convite = sequelize.define(
  "Convite",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_convite" },
    empresaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_empresa" },
    usuariaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_usuario" },
    vagaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_vaga" },
    mensagem: { type: DataTypes.STRING(500) },
    criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criado_em" },
  },
  opcoes("CONVITE")
);

export const Plano = sequelize.define(
  "Plano",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_plano" },
    codigo: { type: DataTypes.STRING(40), allowNull: false },
    nome: { type: DataTypes.STRING(80), allowNull: false },
    publico: { type: TIPO_CONTA, allowNull: false },
    tipo: { type: DataTypes.ENUM("assinatura", "avulso"), allowNull: false },
    preco: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    rotuloPreco: { type: DataTypes.STRING(30), allowNull: false, field: "rotulo_preco" },
    beneficios: { type: DataTypes.JSON, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
  },
  opcoes("PLANO")
);

export const Assinatura = sequelize.define(
  "Assinatura",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_assinatura" },
    tipoConta: { type: TIPO_CONTA, allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    planoId: { type: DataTypes.INTEGER, allowNull: false, field: "id_plano" },
    status: { type: DataTypes.ENUM("pendente", "ativa", "pausada", "cancelada", "falhou"), allowNull: false },
    provedor: { type: DataTypes.STRING(20), allowNull: false },
    idExterno: { type: DataTypes.STRING(80), field: "id_externo" },
    proximoPagamento: { type: DataTypes.DATE, field: "proximo_pagamento" },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    atualizadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "atualizada_em" },
    canceladaEm: { type: DataTypes.DATE, field: "cancelada_em" },
  },
  opcoes("ASSINATURA")
);

export const Campanha = sequelize.define(
  "Campanha",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_campanha" },
    empresaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_empresa" },
    planoId: { type: DataTypes.INTEGER, allowNull: false, field: "id_plano" },
    titulo: { type: DataTypes.STRING(100), allowNull: false },
    texto: { type: DataTypes.STRING(300), allowNull: false },
    link: { type: DataTypes.STRING(255) },
    status: { type: DataTypes.ENUM("aguardando_pagamento", "paga", "cancelada"), allowNull: false },
    criadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "criada_em" },
    pagaEm: { type: DataTypes.DATE, field: "paga_em" },
  },
  opcoes("CAMPANHA")
);

export const Pagamento = sequelize.define(
  "Pagamento",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_pagamento" },
    tipoConta: { type: TIPO_CONTA, allowNull: false, field: "tipo_conta" },
    contaId: { type: DataTypes.INTEGER, allowNull: false, field: "id_conta" },
    planoId: { type: DataTypes.INTEGER, allowNull: false, field: "id_plano" },
    assinaturaId: { type: DataTypes.INTEGER, field: "id_assinatura" },
    campanhaId: { type: DataTypes.INTEGER, field: "id_campanha" },
    provedor: { type: DataTypes.STRING(20), allowNull: false },
    idExterno: { type: DataTypes.STRING(80), allowNull: false, field: "id_externo" },
    status: { type: DataTypes.STRING(30), allowNull: false },
    valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    moeda: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: "BRL" },
    pagoEm: { type: DataTypes.DATE, field: "pago_em" },
    registradoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "registrado_em" },
  },
  opcoes("PAGAMENTO")
);

// Ids das contas de um tipo com assinatura Premium ativa (confirmada pelo provedor).
export async function contasPremium(tipoConta, ids) {
  const unicos = [...new Set(ids)].filter(Boolean);
  if (!unicos.length) return new Set();
  const ativas = await Assinatura.findAll({ attributes: ["contaId"], where: { tipoConta, status: "ativa", contaId: { [Op.in]: unicos } } });
  return new Set(ativas.map((a) => a.contaId));
}
