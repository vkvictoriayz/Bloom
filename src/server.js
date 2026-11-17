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
import { registrarFotoDoDia } from "./controllers/AdminController.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("Defina JWT_SECRET (mínimo 16 caracteres) no arquivo .env");
  process.exit(1);
}

const porta = Number(process.env.PORT ?? 3001);

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
  await prepararComunidade();
  await prepararEmpresarial();
  await prepararImagens();
  await prepararVerificacao();
  await prepararCandidata();
  await prepararInteracao();
  await prepararGrupos();
  await aplicarMigracoes();
} catch (e) {
  console.error("Não foi possível conectar ao MySQL. Confira o .env e se o banco BLOOM existe.");
  console.error(e.message);
  process.exit(1);
}

const servidor = app.listen(porta, () =>
  console.log(`API da Bloom rodando em http://localhost:${porta}`)
);

const fotoDoDia = () => registrarFotoDoDia().catch((e) => console.error("Painel:", e.message));
fotoDoDia();
setInterval(fotoDoDia, 6 * 60 * 60 * 1000).unref();

servidor.on("error", (e) => {
  if (e.code === "EADDRINUSE") return avisarPortaOcupada();
  console.error(e.message);
  process.exit(1);
});
