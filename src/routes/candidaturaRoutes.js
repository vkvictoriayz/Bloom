import { Router } from "express";
import * as V from "../controllers/VagaController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
router.use(exigirLogin(["usuaria"]));
router.post("/", V.candidatar);
router.get("/minhas", V.minhas);
router.delete("/:id", V.retirar);

export default router;
