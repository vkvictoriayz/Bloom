import express, { Router } from "express";
import * as C from "../controllers/CandidataController.js";
import * as G from "../controllers/GrupoController.js";
import * as I from "../controllers/InteracaoController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

// Área da candidata (só contas "usuaria"). O perfil completo e os projetos
// (com imagem) passam do limite geral de 20 kB, então estas rotas têm o
// próprio limite e são montadas antes dele em app.js.
export const candidataRoutes = Router();
candidataRoutes.use(exigirLogin(["usuaria"]));
candidataRoutes.get("/perfil", C.perfil);
candidataRoutes.put("/perfil", express.json({ limit: "100kb" }), C.atualizarPerfil);
candidataRoutes.get("/projetos", C.listarProjetos);
candidataRoutes.post("/projetos", express.json({ limit: "700kb" }), C.criarProjeto);
candidataRoutes.put("/projetos/:id", express.json({ limit: "700kb" }), C.editarProjeto);
candidataRoutes.delete("/projetos/:id", C.excluirProjeto);
candidataRoutes.get("/salvas", C.listarSalvas);
candidataRoutes.put("/salvas/:vagaId", C.salvarVaga);
candidataRoutes.delete("/salvas/:vagaId", C.removerSalva);
candidataRoutes.get("/privacidade", C.privacidade);
candidataRoutes.put("/privacidade", express.json({ limit: "2kb" }), C.atualizarPrivacidade);

// Notificações e mensagens: candidatas e empresas.
export const notificacaoRoutes = Router();
notificacaoRoutes.use(exigirLogin(["usuaria", "empresa"]));
notificacaoRoutes.get("/", I.listarNotificacoes);
notificacaoRoutes.post("/lidas", I.marcarTodas);
notificacaoRoutes.get("/preferencias", I.lerPreferencias);
notificacaoRoutes.put("/preferencias", I.salvarPreferencias);
notificacaoRoutes.post("/:id/lida", I.marcarLida);

export const mensagemRoutes = Router();
mensagemRoutes.use(exigirLogin(["usuaria", "empresa"]));
mensagemRoutes.get("/", I.listarConversas);
mensagemRoutes.post("/", I.abrirConversa);
mensagemRoutes.get("/:id", I.lerConversa);
mensagemRoutes.post("/:id", I.enviarMensagem);

// Comunidades temáticas: leitura para candidatas e empresas; o resto só candidatas.
export const grupoRoutes = Router();
const soCandidata = exigirLogin(["usuaria"]);
grupoRoutes.use(exigirLogin(["usuaria", "empresa"]));
grupoRoutes.get("/", G.listar);
grupoRoutes.post("/", soCandidata, G.criar);
grupoRoutes.get("/:id", G.ver);
grupoRoutes.delete("/:id", soCandidata, G.excluir);
grupoRoutes.post("/:id/participar", soCandidata, G.participar);
grupoRoutes.post("/:id/publicacoes", soCandidata, G.publicar);
