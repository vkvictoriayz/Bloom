import express, { Router } from "express";
import * as C from "../controllers/ImagemController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();

// Só esta rota aceita corpo grande (imagem de até 1 MB em base64); o resto
// da API continua com o limite de 20 kB definido em app.js.
const corpoImagem = express.json({ limit: "1500kb" });
const logada = exigirLogin(["usuaria", "empresa"]);

router.get("/minhas", logada, C.minhas);
router.put("/:campo", logada, corpoImagem, C.enviar);
router.delete("/:campo", logada, C.remover);
router.get("/:chave", C.servir);

export default router;
