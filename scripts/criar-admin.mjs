// npm run admin:criar — cria um administrador da Bloom pelo terminal.
// Não existe cadastro público de administrador: o primeiro é criado aqui
// (com acesso total); os demais podem ser criados por ele no painel.
// A senha é digitada sem aparecer na tela e nunca fica em arquivo ou histórico.
import bcrypt from "bcrypt";
import { createInterface } from "node:readline/promises";
import { Op } from "sequelize";
import { sequelize } from "../src/config/database.js";
import { aplicarMigracoes } from "../src/database/migracoes.js";
import { Admin } from "../src/models/Admin.js";

if (!process.stdin.isTTY) {
  console.error("Rode este comando num terminal interativo (a senha é digitada na hora).");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const perguntar = async (texto) => (await rl.question(texto)).trim();

// Lê a senha sem mostrar o que é digitado (mostra * no lugar).
function perguntarSenha(texto) {
  return new Promise((ok) => {
    rl.pause();
    process.stdout.write(texto);
    const entrada = process.stdin;
    entrada.setRawMode(true);
    entrada.resume();
    let senha = "";
    const aoDigitar = (buf) => {
      for (const c of buf.toString("utf8")) {
        if (c === "\r" || c === "\n") {
          entrada.setRawMode(false);
          entrada.off("data", aoDigitar);
          process.stdout.write("\n");
          rl.resume();
          return ok(senha);
        }
        if (c === "\u0003") {
          process.stdout.write("\nCancelado.\n");
          process.exit(1);
        }
        if (c === "\u0008" || c === "\u007f") {
          if (senha.length) {
            senha = senha.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (c >= " ") {
          senha += c;
          process.stdout.write("*");
        }
      }
    };
    entrada.on("data", aoDigitar);
  });
}

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

  const senha = await perguntarSenha("Senha (mínimo 10 caracteres): ");
  if (senha.length < 10 || Buffer.byteLength(senha) > 72) throw new Error("A senha precisa ter de 10 a 72 caracteres.");
  if ((await perguntarSenha("Repita a senha: ")) !== senha) throw new Error("As senhas não são iguais.");

  await Admin.create({ nome, usuario, email, nivel: "super", ativo: true, senhaHash: await bcrypt.hash(senha, 12) });
  console.log(`\nPronto. Entre em http://localhost:3006/admin com o usuário "${usuario}".\n`);
} catch (e) {
  console.error(`\n${e.message}\n`);
  process.exitCode = 1;
} finally {
  rl.close();
  await sequelize.close();
}
