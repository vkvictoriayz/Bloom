import { Router } from "express";
import * as AuthController from "../controllers/AuthController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";
import { criarLimitador, limitarPorIp } from "../utils/limitador.js";

const router = Router();

// Limites por IP, contra robôs e consultas excessivas às APIs externas.
const porMinuto = (maximo) => criarLimitador({ janela: 60 * 1000, maximo });
const porHora = (maximo) => criarLimitador({ janela: 60 * 60 * 1000, maximo });
const limiteLogin = limitarPorIp(porMinuto(20), "Muitas tentativas. Aguarde um minuto e tente de novo.");
const limiteCadastro = limitarPorIp(porHora(20), "Muitos cadastros a partir desta rede. Tente novamente mais tarde.");
const limiteCnpj = limitarPorIp(porMinuto(10), "Muitas consultas de CNPJ. Aguarde um minuto e tente de novo.");
const limiteSenha = limitarPorIp(porHora(10), "Muitos pedidos de redefinição. Tente novamente mais tarde.");

// Usuária
router.post("/cadastro", limiteCadastro, AuthController.cadastrarUsuaria);
router.post("/login", limiteLogin, AuthController.loginUsuaria);

// Empresa
router.get("/empresa/cnpj/:cnpj", limiteCnpj, AuthController.consultarEmpresaPorCnpj);
router.post("/empresa/cadastro", limiteCadastro, AuthController.cadastrarEmpresa);
router.post("/empresa/login", limiteLogin, AuthController.loginEmpresa);

// Redefinição de senha (candidatas e empresas)
router.post("/senha/esqueci", limiteSenha, AuthController.esqueciSenha);
router.post("/senha/redefinir", limiteSenha, AuthController.redefinirSenha);

// Troca de senha de quem está logada
router.put("/senha", exigirLogin(), limiteSenha, AuthController.alterarSenha);

// Exclusão da própria conta
router.delete("/conta", exigirLogin(), limiteSenha, AuthController.excluirConta);

// Sessão atual
router.get("/me", exigirLogin(), AuthController.me);

export default router;
