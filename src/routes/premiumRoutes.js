import { Router } from "express";
import * as P from "../controllers/PremiumController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
const soEmpresa = exigirLogin(["empresa"]);
router.use(exigirLogin(["usuaria", "empresa"]));
router.get("/", P.visaoGeral);
router.post("/assinatura", P.assinar);
router.post("/assinatura/sincronizar", P.sincronizarAssinatura);
router.delete("/assinatura", P.cancelar);
router.post("/campanhas", soEmpresa, P.criarCampanha);
router.post("/campanhas/:id/sincronizar", soEmpresa, P.sincronizarCampanha);
router.delete("/campanhas/:id", soEmpresa, P.cancelarCampanha);

export default router;
