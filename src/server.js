import { createServer } from "node:net";
import app from "./app.js";
import { sequelize } from "./config/database.js";
import { prepararComunidade } from "./models/Comunidade.js";
import { prepararEmpresarial } from "./models/Empresarial.js";
import { prepararImagens } from "./models/Imagem.js";
import { prepararVerificacao } from "./models/Verificacao.js";
import { prepararCandidata } from "./models/Candidata.js";
import { prepararInteracao } from "./models/Interacao.js";
import { prepararGrupos } from "./models/Grupos.js";
import { aplicarMigracoes } from "./database/migracoes.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("Defina JWT_SECRET (mínimo 16 caracteres) no arquivo .env");
  process.exit(1);
}

const porta = Number(process.env.PORT ?? 3001);

// Explica por que a porta está ocupada: outra API da Bloom (em outro
// terminal) ou outro programa.
async function avisarPortaOcupada() {
  const bloom = await fetch(`http://127.0.0.1:${porta}/api/saude`, { signal: AbortSignal.timeout(1500) })
    .then((r) => r.ok)
    .catch(() => false);
  console.error(
    bloom
      ? `A API da Bloom já está rodando em http://localhost:${porta} (em outro terminal). Use essa, ou feche o outro terminal (Ctrl+C) e rode "npm run server" de novo.`
      : `A porta ${porta} está em uso por outro programa. Feche esse programa ou mude PORT no .env.`
  );
  process.exit(1);
}

// Confere a porta antes de conectar no banco e aplicar migrations.
const portaLivre = await new Promise((ok) => {
  const teste = createServer()
    .once("error", () => ok(false))
    .once("listening", () => teste.close(() => ok(true)))
    .listen(porta);
});
if (!portaLivre) await avisarPortaOcupada();

try {
  await sequelize.authenticate();
  console.log("Conectado ao MySQL.");
  await prepararComunidade(); // cria as tabelas da comunidade, se ainda não existirem
  await prepararEmpresarial(); // idem para perfil da empresa, vagas e candidaturas
  await prepararImagens(); // idem para foto e capa de perfil
  await prepararVerificacao(); // verificação de CPF/CNPJ e redefinição de senha
  await prepararCandidata(); // perfil profissional, projetos e vagas salvas
  await prepararInteracao(); // notificações e mensagens
  await prepararGrupos(); // comunidades temáticas
  await aplicarMigracoes(); // src/database/migrations/*.sql (alterações de tabelas existentes)
} catch (e) {
  console.error("Não foi possível conectar ao MySQL. Confira o .env e se o banco BLOOM existe.");
  console.error(e.message);
  process.exit(1);
}

const servidor = app.listen(porta, () =>
  console.log(`API da Bloom rodando em http://localhost:${porta}`)
);

servidor.on("error", (e) => {
  if (e.code === "EADDRINUSE") return avisarPortaOcupada();
  console.error(e.message);
  process.exit(1);
});
