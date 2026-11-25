import { Sequelize } from "sequelize";

const comSsl = process.env.DB_SSL === "true";
const opcoes = {
  dialect: "mysql",
  logging: false,
  ...(comSsl ? { dialectOptions: { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: process.env.DB_SSL_ESTRITO !== "false" } } } : {}),
};

const endereco = process.env.DATABASE_URL || process.env.MYSQL_URL;

export const sequelize = endereco
  ? new Sequelize(endereco, opcoes)
  : new Sequelize(process.env.DB_NAME ?? "BLOOM", process.env.DB_USER ?? "root", process.env.DB_PASSWORD ?? "", {
      ...opcoes,
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 3306),
    });
