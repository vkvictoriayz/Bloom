// npm run admin:criar — cria um administrador da Bloom pelo terminal.
// Não existe cadastro público de administrador: o primeiro é criado aqui
// (com acesso total); os demais podem ser criados por ele no painel.
// A senha é digitada sem aparecer na tela e nunca fica em arquivo ou histórico.
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../src/config/database.js";
import { aplicarMigracoes } from "../src/database/migracoes.js";
import { Admin } from "../src/models/Admin.js";
import { exigirTerminal, pedirSenhaNova, perguntar } from "./terminal.mjs";

exigirTerminal();

try {
  await sequelize.authenticate();
  await aplicarMigracoes(); // garante as colunas novas da tabela ADMINS
  console.log("\nNovo administrador da Bloom (acesso total)\n");

  const nome = await perguntar("Nome: ");
  if (nome.length < 2) throw new Error("Informe o nome.");
  const usuario = (await perguntar("Usuário (para entrar no painel): ")).toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) throw new Error("Usuário: de 3 a 40 letras minúsculas, números, ponto, hífen ou sublinhado.");
  const email = (await perguntar("E-mail: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");
  if (await Admin.findOne({ where: { [Op.or]: [{ usuario }, { email }] } })) throw new Error("Já existe um administrador com esse usuário ou e-mail.");

  const senha = await pedirSenhaNova();
  await Admin.create({ nome, usuario, email, nivel: "super", ativo: true, senhaHash: await bcrypt.hash(senha, 12) });
  console.log(`\nPronto. Entre em http://localhost:3006/admin com o usuário "${usuario}".\n`);
} catch (e) {
  console.error(`\n${e.message}\n`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
