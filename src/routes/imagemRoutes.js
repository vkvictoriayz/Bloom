import express, { Router } from "express";
import * as C from "../controllers/ImagemController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();

const corpoImagem = express.json({ limit: "1500kb" });
const logada = exigirLogin(["usuaria", "empresa"]);

router.get("/minhas", logada, C.minhas);
router.put("/icone", logada, express.json({ limit: "2kb" }), C.escolherIcone);
router.delete("/icone", logada, C.removerIcone);
router.put("/:campo", logada, corpoImagem, C.enviar);
router.delete("/:campo", logada, C.remover);
router.get("/:chave", C.servir);

export default router;
