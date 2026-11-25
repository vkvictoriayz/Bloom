import { sequelize } from "../config/database.js";

export async function padronizarNomesTabelas() {
  const [[{ modo }]] = await sequelize.query("SELECT @@lower_case_table_names AS modo");
  if (Number(modo) !== 0) return;

  const [linhas] = await sequelize.query(
    "SELECT TABLE_NAME AS nome FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
  );
  const existentes = new Set(linhas.map((l) => l.nome));
  const minusculas = [...existentes].filter((nome) => nome !== nome.toUpperCase());
  if (!minusculas.length) return;

  await sequelize.transaction(async (transaction) => {
    const q = (sql) => sequelize.query(sql, { transaction });
    await q("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const nome of minusculas) {
        const novo = nome.toUpperCase();
        if (existentes.has(novo)) {
          const [[{ total }]] = await q(`SELECT COUNT(*) AS total FROM \`${novo}\``);
          if (Number(total) > 0) {
            console.warn(`Tabela ${nome} mantida: ${novo} já existe com dados.`);
            continue;
          }
          await q(`DROP TABLE \`${novo}\``);
        }
        await q(`RENAME TABLE \`${nome}\` TO \`${novo}\``);
      }
    } finally {
      await q("SET FOREIGN_KEY_CHECKS = 1");
    }
  });
  console.log(`Nomes de tabelas padronizados: ${minusculas.length}.`);
}
