import { Router } from "express";
import * as V from "../controllers/VagaController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
router.use(exigirLogin(["usuaria"]));
router.get("/", V.listar);
router.get("/empresas/:id", V.empresaPublica);
router.get("/:id", V.ver);

export default router;
