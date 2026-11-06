import { DataTypes, Op } from "sequelize";
import { sequelize } from "../config/database.js";

// Foto e capa de perfil (de integrantes e de empresas), guardadas no banco.
// Tabela nova: não altera CADASTRO_USUARIA, CADASTRO_EMPRESA nem PERFIL_EMPRESA.
// Cada envio gera uma "chave" aleatória nova, usada no endereço público da
// imagem (/api/imagens/<chave>); a chave só circula em respostas autenticadas.
export const ImagemPerfil = sequelize.define(
  "ImagemPerfil",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_imagem" },
    donoTipo: { type: DataTypes.ENUM("usuaria", "empresa"), allowNull: false, field: "dono_tipo" },
    donoId: { type: DataTypes.INTEGER, allowNull: false, field: "dono_id" },
    campo: { type: DataTypes.ENUM("foto", "capa"), allowNull: false },
    chave: { type: DataTypes.CHAR(32), allowNull: false, unique: true },
    mime: { type: DataTypes.STRING(20), allowNull: false },
    dados: { type: DataTypes.BLOB("medium"), allowNull: false },
    atualizadaEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "atualizada_em" },
  },
  {
    tableName: "IMAGEM_PERFIL",
    freezeTableName: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ["dono_tipo", "dono_id", "campo"] }],
  }
);

// Endereço (relativo à API) de uma imagem.
const caminho = (chave) => `/imagens/${chave}`;

// Foto e capa de várias contas de um tipo: Map(id -> { foto, capa }).
export async function imagensDe(tipo, ids) {
  const unicos = [...new Set(ids)].filter(Boolean);
  const mapa = new Map(unicos.map((id) => [id, { foto: null, capa: null }]));
  if (!unicos.length) return mapa;
  const linhas = await ImagemPerfil.findAll({
    attributes: ["donoId", "campo", "chave"],
    where: { donoTipo: tipo, donoId: { [Op.in]: unicos } },
  });
  for (const l of linhas) mapa.get(l.donoId)[l.campo] = caminho(l.chave);
  return mapa;
}

export async function prepararImagens() {
  await ImagemPerfil.sync();
}
