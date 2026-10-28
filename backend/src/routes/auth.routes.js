import { Router } from "express";
import { exigirLogin } from "../middlewares/autenticacao.js";

// Repassa erros de funções async para o tratador de erros do Express.
const assincrono = (fn) => (req, res, next) => fn(req, res).catch(next);

export function criarAuthRouter(auth, jwtSecret) {
  const router = Router();

  // Usuária
  router.post("/cadastro", assincrono(async (req, res) => {
    res.status(201).json(await auth.cadastrarUsuaria(req.body));
  }));

  router.post("/login", assincrono(async (req, res) => {
    res.json(await auth.loginUsuaria(req.body));
  }));

  // Empresa
  router.post("/empresa/cadastro", assincrono(async (req, res) => {
    res.status(201).json(await auth.cadastrarEmpresa(req.body));
  }));

  router.post("/empresa/login", assincrono(async (req, res) => {
    res.json(await auth.loginEmpresa(req.body));
  }));

  // Quem está logada (usado pelo front para validar o token salvo)
  router.get("/me", exigirLogin(jwtSecret), assincrono(async (req, res) => {
    res.json({ usuario: await auth.buscarConta(req.auth.tipo, req.auth.sub) });
  }));

  return router;
}
