// npm run admin:senha — define uma senha nova para um administrador que a
// esqueceu (e o reativa, se estiver desativado). Só quem tem acesso ao
// servidor e ao .env consegue rodar; a ação fica no registro do painel.
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../src/config/database.js";
import { aplicarMigracoes } from "../src/database/migracoes.js";
import { Admin, registrarAcao } from "../src/models/Admin.js";
import { exigirTerminal, pedirSenhaNova, perguntar } from "./terminal.mjs";

exigirTerminal();

try {
  await sequelize.authenticate();
  await aplicarMigracoes();
  console.log("\nNova senha de administrador da Bloom\n");

  const quem = (await perguntar("Usuário ou e-mail do administrador: ")).toLowerCase();
  const admin = await Admin.findOne({ where: { [Op.or]: [{ usuario: quem }, { email: quem }] } });
  if (!admin) throw new Error("Nenhum administrador com esse usuário ou e-mail.");
  console.log(`Administrador: ${admin.nome} (${admin.usuario})${admin.ativo ? "" : " — está desativado e será reativado"}`);

  const senha = await pedirSenhaNova();
  const mudancas = { senhaHash: await bcrypt.hash(senha, 12), ativo: true, deveTrocarSenha: false };
  // Perdeu o celular? Desliga a verificação em duas etapas para configurar de novo no painel.
  let desligou = false;
  if (admin.totpAtivo) {
    const r = (await perguntar("A verificação em duas etapas está ligada. Desligar (celular perdido)? [s/N]: ", { permitirVazio: true })).toLowerCase();
    if (r === "s" || r === "sim") {
      Object.assign(mudancas, { totpAtivo: false, totpSegredo: null, totpUltimoPasso: null, codigosRecuperacao: null });
      desligou = true;
    }
  }
  await admin.update(mudancas);
  await registrarAcao(admin.id, desligou ? "Senha redefinida e duas etapas desligadas pelo terminal" : "Senha redefinida pelo terminal", "ADMINS", admin.id);
  console.log(`\nPronto. Entre em http://localhost:3006/admin com o usuário "${admin.usuario}".\n`);
} catch (e) {
  console.error(`\n${e.message}\n`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
