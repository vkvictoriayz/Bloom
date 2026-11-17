import { Router } from "express";
import * as P from "../controllers/PublicoController.js";
import { criarLimitador, limitarPorIp } from "../utils/limitador.js";

const router = Router();
router.use(limitarPorIp(criarLimitador({ janela: 60 * 1000, maximo: 60 }), "Muitas consultas. Aguarde um minuto e tente de novo."));
router.get("/empresas", P.empresas);
router.get("/empresas/:id", P.empresa);
router.get("/resumo", P.resumo);

export default router;
