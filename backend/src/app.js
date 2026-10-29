import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/saude", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// JSON malformado e erros inesperados
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "Requisição inválida." });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno. Tente novamente mais tarde." });
});

export default app;
