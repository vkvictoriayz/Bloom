import express, { Router } from "express";
import * as D from "../controllers/MensagemDiretaController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
router.use(exigirLogin(["usuaria"]));
router.get("/", D.listar);
router.post("/", express.json({ limit: "20kb" }), D.abrir);
router.get("/:id", D.ler);
router.post("/:id", express.json({ limit: "3mb" }), D.enviar);
router.put("/:id/bloqueio", D.bloquear);
router.delete("/:id/bloqueio", D.desbloquear);
router.delete("/:id/mensagens/:mensagemId", D.apagar);

export default router;
