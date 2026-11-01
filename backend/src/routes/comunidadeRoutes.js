import { Router } from "express";
import * as C from "../controllers/ComunidadeController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";

const router = Router();

// Toda a comunidade exige login de usuária.
router.use(exigirLogin(["usuaria"]));

router.get("/feed", C.feed);
router.post("/publicacoes", C.publicar);
router.delete("/publicacoes/:id", C.excluir);
router.post("/publicacoes/:id/curtir", C.curtir);
router.get("/publicacoes/:id/comentarios", C.listarComentarios);
router.post("/publicacoes/:id/comentarios", C.comentar);

router.get("/perfis", C.perfis);
router.post("/perfis/:id/seguir", C.seguir);
router.get("/meu-perfil", C.meuPerfil);
router.put("/meu-perfil", C.atualizarPerfil);

export default router;
