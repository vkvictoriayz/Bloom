import app from "./app.js";
import { sequelize } from "./config/database.js";
import { prepararComunidade } from "./models/Comunidade.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("Defina JWT_SECRET (mínimo 16 caracteres) no arquivo .env");
  process.exit(1);
}

try {
  await sequelize.authenticate();
  console.log("Conectado ao MySQL.");
  await prepararComunidade(); // cria as tabelas da comunidade, se ainda não existirem
} catch (e) {
  console.error("Não foi possível conectar ao MySQL. Confira o .env e se o banco BLOOM existe.");
  console.error(e.message);
  process.exit(1);
}

const porta = Number(process.env.PORT ?? 3001);
const servidor = app.listen(porta, () =>
  console.log(`API da Bloom rodando em http://localhost:${porta}`)
);

servidor.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? `A porta ${porta} já está em uso. Feche o outro programa ou mude PORT no .env (e o proxy no vite.config.js).`
      : e.message
  );
  process.exit(1);
});
