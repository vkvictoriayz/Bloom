import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import comunidadeRoutes from "./routes/comunidadeRoutes.js";
import imagemRoutes from "./routes/imagemRoutes.js";
import { candidataRoutes, grupoRoutes, mensagemRoutes, notificacaoRoutes } from "./routes/candidataRoutes.js";
import { candidaturaRoutes, empresaRoutes, vagaRoutes } from "./routes/empresaRoutes.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
// Foto e capa vêm antes do limite geral: essa rota aceita até 1 MB de imagem.
app.use("/api/imagens", imagemRoutes);
// Perfil completo e projetos com imagem: limites próprios (ver candidataRoutes.js).
app.use("/api/candidata", candidataRoutes);
app.use(express.json({ limit: "20kb" }));

app.get("/api/saude", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/comunidade", comunidadeRoutes);
app.use("/api/empresa", empresaRoutes);
app.use("/api/vagas", vagaRoutes);
app.use("/api/candidaturas", candidaturaRoutes);
app.use("/api/notificacoes", notificacaoRoutes);
app.use("/api/mensagens", mensagemRoutes);
app.use("/api/comunidades", grupoRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// JSON malformado e erros inesperados
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "Requisição inválida." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ erro: "O conteúdo enviado é grande demais." });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno. Tente novamente mais tarde." });
});

export default app;
