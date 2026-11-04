import { Router } from "express";
import * as P from "../controllers/PremiumController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

// Bloom Premium: candidatas e empresas (cada conta só vê o que é dela).
export const premiumRoutes = Router();
premiumRoutes.use(exigirLogin(["usuaria", "empresa"]));
premiumRoutes.get("/", P.visaoGeral);
premiumRoutes.post("/assinatura", P.assinar);
premiumRoutes.post("/assinatura/sincronizar", P.sincronizarAssinatura);
premiumRoutes.delete("/assinatura", P.cancelar);
// Publicidade: só empresas.
premiumRoutes.post("/campanhas", exigirLogin(["empresa"]), P.criarCampanha);
premiumRoutes.post("/campanhas/:id/sincronizar", exigirLogin(["empresa"]), P.sincronizarCampanha);
premiumRoutes.delete("/campanhas/:id", exigirLogin(["empresa"]), P.cancelarCampanha);

// Aviso do Mercado Pago: público (sem login), conferido pela assinatura do
// webhook e relendo cada registro na API do Mercado Pago.
export const pagamentoRoutes = Router();
pagamentoRoutes.post("/mercadopago/webhook", P.webhook);
