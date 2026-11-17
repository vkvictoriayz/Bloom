import { Router } from "express";
import * as P from "../controllers/PremiumController.js";

const router = Router();
router.post("/mercadopago/webhook", P.webhook);

export default router;
