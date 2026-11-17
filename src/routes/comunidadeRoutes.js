import express, { Router } from "express";
import * as C from "../controllers/ComunidadeController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();

// Toda a comunidade exige login de usuária.
router.use(exigirLogin(["usuaria"]));

// Publicar e editar aceitam uma imagem (até 2 MB, em base64): limite próprio.
// app.js monta esta rota antes do limite geral de 20 kB.
export const corpoComImagem = express.json({ limit: "3mb" });

router.get("/feed", C.feed);
router.get("/em-alta", C.emAlta);
router.post("/publicacoes", corpoComImagem, C.publicar);
router.put("/publicacoes/:id", corpoComImagem, C.editar);
router.delete("/publicacoes/:id", C.excluir);
router.post("/publicacoes/:id/curtir", C.curtir);
router.get("/publicacoes/:id/comentarios", C.listarComentarios);
router.post("/publicacoes/:id/comentarios", express.json({ limit: "20kb" }), C.comentar);
router.delete("/comentarios/:id", C.excluirComentario);

router.get("/projetos", C.projetos);
router.get("/perfis", C.perfis);
router.get("/perfis/:id", C.perfilPublico);
router.get("/perfis/:id/seguidoras", C.seguidoras);
router.get("/perfis/:id/seguindo", C.seguindo);
router.put("/perfis/:id/seguir", C.seguir);
router.delete("/perfis/:id/seguir", C.deixarDeSeguir);
router.post("/perfis/:id/seguir", C.alternarSeguir);
router.get("/meu-perfil", C.meuPerfil);
router.put("/meu-perfil", express.json({ limit: "20kb" }), C.atualizarPerfil);

export default router;
