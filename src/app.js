import cors from "cors";
import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import denunciaRoutes from "./routes/denunciaRoutes.js";
import publicoRoutes from "./routes/publicoRoutes.js";
import comunidadeRoutes from "./routes/comunidadeRoutes.js";
import imagemRoutes from "./routes/imagemRoutes.js";
import candidataRoutes from "./routes/candidataRoutes.js";
import grupoRoutes from "./routes/grupoRoutes.js";
import mensagemDiretaRoutes from "./routes/mensagemDiretaRoutes.js";
import mensagemRoutes from "./routes/mensagemRoutes.js";
import notificacaoRoutes from "./routes/notificacaoRoutes.js";
import premiumRoutes from "./routes/premiumRoutes.js";
import pagamentoRoutes from "./routes/pagamentoRoutes.js";
import empresaRoutes from "./routes/empresaRoutes.js";
import vagaRoutes from "./routes/vagaRoutes.js";
import candidaturaRoutes from "./routes/candidaturaRoutes.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3006" }));
app.use("/api/imagens", imagemRoutes);
app.use("/api/candidata", candidataRoutes);
app.use("/api/comunidade", comunidadeRoutes);
app.use("/api/comunidades", grupoRoutes);
app.use("/api/mensagens/candidatas", mensagemDiretaRoutes);
app.use("/api/mensagens", mensagemRoutes);
app.use("/api/admin", adminRoutes);
app.use(express.json({ limit: "20kb" }));

app.get("/api/saude", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/empresa", empresaRoutes);
app.use("/api/vagas", vagaRoutes);
app.use("/api/candidaturas", candidaturaRoutes);
app.use("/api/notificacoes", notificacaoRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/pagamentos", pagamentoRoutes);
app.use("/api/denuncias", denunciaRoutes);
app.use("/api/publico", publicoRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

app.use((err, req, res, _next) => {
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
