import { Router } from "express";
import * as D from "../controllers/DenunciaController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
router.use(exigirLogin());
router.get("/motivos", D.motivos);
router.post("/", D.denunciar);

export default router;
