import { Router } from "express";
import * as I from "../controllers/InteracaoController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
router.use(exigirLogin(["usuaria", "empresa"]));
router.get("/", I.listarNotificacoes);
router.post("/lidas", I.marcarTodas);
router.get("/preferencias", I.lerPreferencias);
router.put("/preferencias", I.salvarPreferencias);
router.post("/:id/lida", I.marcarLida);

export default router;
