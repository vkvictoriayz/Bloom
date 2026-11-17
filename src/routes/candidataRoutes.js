import express, { Router } from "express";
import * as C from "../controllers/CandidataController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();
router.use(exigirLogin(["usuaria"]));
router.get("/perfil", C.perfil);
router.put("/perfil", express.json({ limit: "100kb" }), C.atualizarPerfil);
router.get("/projetos", C.listarProjetos);
router.post("/projetos", express.json({ limit: "700kb" }), C.criarProjeto);
router.put("/projetos/:id", express.json({ limit: "700kb" }), C.editarProjeto);
router.delete("/projetos/:id", C.excluirProjeto);
router.get("/salvas", C.listarSalvas);
router.put("/salvas/:vagaId", C.salvarVaga);
router.delete("/salvas/:vagaId", C.removerSalva);
router.get("/curriculo", C.curriculo);
router.put("/curriculo", express.json({ limit: "8mb" }), C.enviarCurriculo);
router.get("/curriculo/arquivo", C.baixarCurriculo);
router.delete("/curriculo", C.removerCurriculo);
router.get("/privacidade", C.privacidade);
router.put("/privacidade", express.json({ limit: "2kb" }), C.atualizarPrivacidade);

export default router;
