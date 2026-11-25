import mysql from "mysql2/promise";

const destinoUrl = process.env.DESTINO_URL;
const substituir = process.argv.includes("--substituir");

if (!destinoUrl) {
  console.error('Informe o banco online em DESTINO_URL. Exemplo (PowerShell): $env:DESTINO_URL="mysql://usuario:senha@host:porta/banco"; npm run banco:copiar');
  process.exit(1);
}

const origemConfig = process.env.DATABASE_URL || process.env.MYSQL_URL
  ? { uri: process.env.DATABASE_URL || process.env.MYSQL_URL }
  : {
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "BLOOM",
    };

const ssl = process.env.DESTINO_SSL === "true" ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: process.env.DESTINO_SSL_ESTRITO !== "false" } } : {};
const origem = await mysql.createConnection({ ...origemConfig, supportBigNumbers: true, dateStrings: true });
const destino = await mysql.createConnection({ uri: destinoUrl, ...ssl, supportBigNumbers: true, dateStrings: true, multipleStatements: false });

if (destinoUrl === origemConfig.uri) {
  console.error("O destino é o mesmo banco de origem. Nada foi feito.");
  process.exit(1);
}

const [tabelas] = await origem.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
const nomes = tabelas.map((t) => Object.values(t)[0]);
const [existentes] = await destino.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");

if (existentes.length && !substituir) {
  console.error(`O banco de destino já tem ${existentes.length} tabelas. Para apagá-las e copiar tudo de novo, rode com --substituir.`);
  process.exit(1);
}

await destino.query("SET FOREIGN_KEY_CHECKS = 0");
if (substituir) {
  for (const t of existentes) await destino.query(`DROP TABLE IF EXISTS \`${Object.values(t)[0]}\``);
}

const LOTE = 200;
let totalLinhas = 0;
for (const nome of nomes) {
  const [[criacao]] = await origem.query(`SHOW CREATE TABLE \`${nome}\``);
  await destino.query(criacao["Create Table"]);
  const [[{ n }]] = await origem.query(`SELECT COUNT(*) n FROM \`${nome}\``);
  for (let inicio = 0; inicio < n; inicio += LOTE) {
    const [linhas] = await origem.query(`SELECT * FROM \`${nome}\` LIMIT ${LOTE} OFFSET ${inicio}`);
    if (!linhas.length) break;
    const colunas = Object.keys(linhas[0]);
    const valores = linhas.map((l) => colunas.map((c) => { const v = l[c]; return v !== null && typeof v === "object" && !Buffer.isBuffer(v) && !(v instanceof Date) ? JSON.stringify(v) : v; }));
    await destino.query(`INSERT INTO \`${nome}\` (${colunas.map((c) => `\`${c}\``).join(", ")}) VALUES ?`, [valores]);
  }
  totalLinhas += Number(n);
  console.log(`${nome}: ${n} linhas`);
}
await destino.query("SET FOREIGN_KEY_CHECKS = 1");

let divergencias = 0;
for (const nome of nomes) {
  const [[a]] = await origem.query(`SELECT COUNT(*) n FROM \`${nome}\``);
  const [[b]] = await destino.query(`SELECT COUNT(*) n FROM \`${nome}\``);
  if (Number(a.n) !== Number(b.n)) {
    divergencias += 1;
    console.error(`Divergência em ${nome}: origem ${a.n}, destino ${b.n}`);
  }
}

await origem.end();
await destino.end();
console.log(divergencias ? `Cópia terminou com ${divergencias} divergências.` : `Pronto: ${nomes.length} tabelas e ${totalLinhas} linhas copiadas e conferidas.`);
process.exit(divergencias ? 1 : 0);
