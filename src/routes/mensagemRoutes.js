import express, { Router } from "express";
import * as I from "../controllers/InteracaoController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
router.use(exigirLogin(["usuaria", "empresa"]));
router.get("/", I.listarConversas);
router.get("/nao-lidas", I.naoLidasMensagens);
router.post("/", express.json({ limit: "20kb" }), I.abrirConversa);
router.get("/:id", I.lerConversa);
router.post("/:id", express.json({ limit: "3mb" }), I.enviarMensagem);
router.delete("/:id/mensagens/:mensagemId", I.apagarMensagem);

export default router;
