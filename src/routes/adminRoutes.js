import express, { Router } from "express";
import * as A from "../controllers/AdminController.js";
import { exigirAdmin } from "../middlewares/autenticacao.js";
import { criarLimitador, limitarPorIp } from "../utils/limitador.js";

const router = Router();
router.use(express.json({ limit: "20kb" }));

const limiteLogin = limitarPorIp(criarLimitador({ janela: 60 * 1000, maximo: 10 }), "Muitas tentativas. Aguarde um minuto e tente de novo.");
router.post("/login", limiteLogin, A.login);
const limiteCodigo = limitarPorIp(criarLimitador({ janela: 60 * 1000, maximo: 20 }), "Muitas tentativas. Aguarde um minuto e tente de novo.");
router.post("/login/codigo", limiteCodigo, A.loginCodigo);

const admin = exigirAdmin();
const soSuper = exigirAdmin(["super"]);
const duranteTroca = exigirAdmin(undefined, { durantetroca: true });

router.get("/me", duranteTroca, A.me);
router.put("/senha", duranteTroca, A.alterarSenha);
router.post("/duas-etapas/iniciar", admin, A.iniciarDuasEtapas);
router.post("/duas-etapas/ativar", admin, A.ativarDuasEtapas);
router.post("/duas-etapas/desativar", admin, A.desativarDuasEtapas);
router.post("/duas-etapas/novos-codigos", admin, A.novosCodigos);
router.get("/dashboard", admin, A.dashboard);

router.get("/candidatas", admin, A.listarCandidatas);
router.get("/candidatas/:id", admin, A.verCandidata);
router.get("/empresas", admin, A.listarEmpresas);
router.get("/empresas/:id", admin, A.verEmpresa);
router.patch("/empresas/:id/representante", admin, A.definirRepresentante);
router.post("/:tipo(candidatas|empresas)/:id/suspender", admin, A.suspender);
router.post("/:tipo(candidatas|empresas)/:id/reativar", admin, A.reativar);
router.delete("/:tipo(candidatas|empresas)/:id", soSuper, A.excluirConta);
router.post("/:tipo(candidatas|empresas)/:id/redefinicao-senha", admin, A.enviarRedefinicao);

router.get("/vagas", admin, A.listarVagas);
router.patch("/vagas/:id/status", admin, A.moderarVaga);

router.get("/publicacoes", admin, A.listarPublicacoes);
router.get("/publicacoes/:id/comentarios", admin, A.listarComentarios);
router.delete("/publicacoes/:id", admin, A.removerPublicacao);
router.delete("/publicacoes-empresa/:id", admin, A.removerPublicacaoEmpresa);
router.delete("/comentarios/:id", admin, A.removerComentario);
router.get("/comunidades", admin, A.listarComunidades);
router.delete("/comunidades/:id", admin, A.removerComunidade);

router.get("/denuncias", admin, A.listarDenuncias);
router.patch("/denuncias/:id", admin, A.decidirDenuncia);

router.get("/pagamentos", admin, A.pagamentos);
router.get("/registro", admin, A.registro);

router.get("/comunicados", soSuper, A.listarComunicados);
router.post("/comunicados", soSuper, A.enviarComunicado);
router.get("/relatorios/:recurso", soSuper, A.relatorio);

router.get("/admins", soSuper, A.listarAdmins);
router.post("/admins", soSuper, A.criarAdmin);
router.patch("/admins/:id", soSuper, A.alterarAdmin);

export default router;
