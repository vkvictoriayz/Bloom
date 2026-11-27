import { Router } from "express";
import * as AuthController from "../controllers/AuthController.js";
import * as OAuthController from "../controllers/OAuthController.js";
import { exigirLogin } from "../middlewares/autenticacao.js";
import { criarLimitador, limitarPorIp } from "../utils/limitador.js";

const router = Router();

const porMinuto = (maximo) => criarLimitador({ janela: 60 * 1000, maximo });
const porHora = (maximo) => criarLimitador({ janela: 60 * 60 * 1000, maximo });
const limiteLogin = limitarPorIp(porMinuto(20), "Muitas tentativas. Aguarde um minuto e tente de novo.");
const limiteCadastro = limitarPorIp(porHora(20), "Muitos cadastros a partir desta rede. Tente novamente mais tarde.");
const limiteCnpj = limitarPorIp(porMinuto(10), "Muitas consultas de CNPJ. Aguarde um minuto e tente de novo.");
const limiteSenha = limitarPorIp(porHora(10), "Muitos pedidos de redefinição. Tente novamente mais tarde.");
const limiteConfirmacao = limitarPorIp(porMinuto(20), "Muitas tentativas. Aguarde um minuto e tente de novo.");

router.post("/cadastro", limiteCadastro, AuthController.cadastrarUsuaria);
router.post("/login", limiteLogin, AuthController.loginUsuaria);

router.get("/empresa/cnpj/:cnpj", limiteCnpj, AuthController.consultarEmpresaPorCnpj);
router.post("/empresa/cadastro", limiteCadastro, AuthController.cadastrarEmpresa);
router.post("/empresa/login", limiteLogin, AuthController.loginEmpresa);

router.post("/senha/esqueci", limiteSenha, AuthController.esqueciSenha);
router.post("/senha/redefinir", limiteSenha, AuthController.redefinirSenha);

router.put("/senha", exigirLogin(), limiteSenha, AuthController.alterarSenha);
router.put("/email", exigirLogin(), limiteSenha, AuthController.alterarEmail);
router.post("/email/confirmar", limiteConfirmacao, AuthController.confirmarEmail);
router.post("/email/reenviar", exigirLogin(), AuthController.reenviarConfirmacao);

router.delete("/conta", exigirLogin(), limiteSenha, AuthController.excluirConta);

router.get("/me", exigirLogin(), AuthController.me);

router.get("/oauth/:provedor/iniciar", OAuthController.limitarLoginSocial, OAuthController.iniciar);
router.get("/oauth/:provedor/retorno", OAuthController.limitarLoginSocial, OAuthController.retorno);

export default router;
