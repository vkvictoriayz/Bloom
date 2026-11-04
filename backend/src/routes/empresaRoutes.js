import { Router } from "express";
import * as E from "../controllers/EmpresaController.js";
import * as V from "../controllers/VagaController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

// /api/empresa — área privada da empresa (só contas do tipo "empresa").
export const empresaRoutes = Router();
empresaRoutes.use(exigirLogin(["empresa"]));

empresaRoutes.get("/perfil", E.perfil);
empresaRoutes.put("/perfil", E.atualizarPerfil);

empresaRoutes.get("/vagas", E.listarVagas);
empresaRoutes.post("/vagas", E.criarVaga);
empresaRoutes.get("/vagas/:id", E.verVaga);
empresaRoutes.put("/vagas/:id", E.editarVaga);
empresaRoutes.patch("/vagas/:id/status", E.mudarStatusVaga);
empresaRoutes.delete("/vagas/:id", E.excluirVaga);
empresaRoutes.get("/dashboard", E.dashboard);

empresaRoutes.get("/candidaturas", E.listarCandidaturas);
empresaRoutes.get("/candidaturas/:id", E.verCandidatura);
empresaRoutes.patch("/candidaturas/:id/status", E.mudarStatusCandidatura);

empresaRoutes.get("/publicacoes", E.listarPublicacoes);
empresaRoutes.post("/publicacoes", E.criarPublicacao);
empresaRoutes.put("/publicacoes/:id", E.editarPublicacao);
empresaRoutes.delete("/publicacoes/:id", E.excluirPublicacao);

empresaRoutes.get("/feed", E.feed);
empresaRoutes.get("/talentos", E.talentos);
empresaRoutes.get("/talentos/:id", E.talento);
empresaRoutes.post("/talentos/:id/convites", E.convidar);

// /api/vagas e /api/candidaturas — lado da candidata (só contas "usuaria").
export const vagaRoutes = Router();
vagaRoutes.use(exigirLogin(["usuaria"]));
vagaRoutes.get("/", V.listar);
vagaRoutes.get("/empresas/:id", V.empresaPublica);
vagaRoutes.get("/:id", V.ver);

export const candidaturaRoutes = Router();
candidaturaRoutes.use(exigirLogin(["usuaria"]));
candidaturaRoutes.post("/", V.candidatar);
candidaturaRoutes.get("/minhas", V.minhas);
