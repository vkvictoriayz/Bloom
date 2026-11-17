import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { sequelize } from "../config/database.js";

const PASTA = fileURLToPath(new URL("./migrations/", import.meta.url));
const JA_EXISTE = new Set([1060, 1061]);

function comandos(sql) {
  return sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export async function aplicarMigracoes() {
  await sequelize.query(
    "CREATE TABLE IF NOT EXISTS SCHEMA_MIGRACAO (arquivo VARCHAR(100) PRIMARY KEY, aplicada_em DATETIME NOT NULL)"
  );
  const [feitas] = await sequelize.query("SELECT arquivo FROM SCHEMA_MIGRACAO");
  const aplicadas = new Set(feitas.map((f) => f.arquivo));
  const arquivos = (await readdir(PASTA)).filter((a) => /^\d{3}_.+\.sql$/.test(a)).sort();

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;
    const sql = await readFile(join(PASTA, arquivo), "utf8");
    for (const comando of comandos(sql)) {
      try {
        await sequelize.query(comando);
      } catch (e) {
        if (JA_EXISTE.has(e.original?.errno)) continue;
        throw new Error(`Migration ${arquivo} falhou em: ${comando.slice(0, 80)}… — ${e.message}`);
      }
    }
    await sequelize.query("INSERT INTO SCHEMA_MIGRACAO (arquivo, aplicada_em) VALUES (?, NOW())", { replacements: [arquivo] });
    console.log(`Migration aplicada: ${arquivo}`);
  }
}
