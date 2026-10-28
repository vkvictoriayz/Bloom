import cors from "cors";
import express from "express";
import { ErroHttp } from "./services/auth.service.js";
import { criarAuthRouter } from "./routes/auth.routes.js";

export function criarApp({ auth, jwtSecret, frontendUrl }) {
  const app = express();

  app.use(cors({ origin: frontendUrl }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/saude", (req, res) => res.json({ ok: true }));
  app.use("/api/auth", criarAuthRouter(auth, jwtSecret));

  app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

  // eslint-disable-next-line no-unused-vars
  app.use((erro, req, res, next) => {
    if (erro instanceof ErroHttp) {
      return res.status(erro.status).json({ erro: erro.message, campo: erro.campo });
    }
    // JSON malformado no corpo da requisição
    if (erro.type === "entity.parse.failed") {
      return res.status(400).json({ erro: "Requisição inválida." });
    }
    console.error(erro);
    res.status(500).json({ erro: "Erro interno. Tente novamente mais tarde." });
  });

  return app;
}
