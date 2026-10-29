import { Router } from "express";
import * as AuthController from "../controllers/AuthController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();

// Usuária
router.post("/cadastro", AuthController.cadastrarUsuaria);
router.post("/login", AuthController.loginUsuaria);

// Empresa
router.post("/empresa/cadastro", AuthController.cadastrarEmpresa);
router.post("/empresa/login", AuthController.loginEmpresa);

// Sessão atual
router.get("/me", exigirLogin(), AuthController.me);

export default router;
