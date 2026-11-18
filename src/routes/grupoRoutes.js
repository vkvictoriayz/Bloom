import express, { Router } from "express";
import * as G from "../controllers/GrupoController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
const soCandidata = exigirLogin(["usuaria"]);
const corpo = express.json({ limit: "20kb" });
router.use(exigirLogin(["usuaria"]));
router.get("/", G.listar);
router.post("/", soCandidata, corpo, G.criar);
router.get("/:id", G.ver);
router.put("/:id", soCandidata, corpo, G.atualizar);
router.delete("/:id", soCandidata, G.excluir);
router.post("/:id/participar", soCandidata, G.participar);
router.post("/:id/publicacoes", soCandidata, express.json({ limit: "3mb" }), G.publicar);
router.delete("/:id/publicacoes/:publicacaoId", soCandidata, G.tirarPublicacao);
router.put("/:id/capa", soCandidata, express.json({ limit: "1500kb" }), G.enviarCapa);
router.delete("/:id/capa", soCandidata, G.removerCapa);

export default router;
