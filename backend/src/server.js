import { criarApp } from "./app.js";
import { criarDb } from "./db.js";
import { criarAuthService } from "./services/auth.service.js";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 16) {
  console.error("Defina JWT_SECRET (mínimo 16 caracteres) no arquivo .env");
  process.exit(1);
}

const db = criarDb({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "BLOOM",
});

const auth = criarAuthService({
  db,
  jwtSecret,
  jwtExpiresHours: Number(process.env.JWT_EXPIRES_HOURS ?? 8),
});

const app = criarApp({
  auth,
  jwtSecret,
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
});

const porta = Number(process.env.PORT ?? 3001);
app.listen(porta, () => console.log(`API da Bloom rodando em http://localhost:${porta}`));
