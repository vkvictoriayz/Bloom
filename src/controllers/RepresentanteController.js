import { notificar } from "../services/notificacoes.js";
import { situacaoRepresentante } from "../services/representante.js";

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

const resposta = ({ cadastro: _cadastro, ...situacao }) => situacao;

export const ver = comTratamento(async (req, res) => {
  const situacao = await situacaoRepresentante(req.auth.sub);
  if (!situacao) return erro(res, 404, "Esta conta não tem dados de cadastro da Receita.");
  return res.json(resposta(situacao));
});

export const verificar = comTratamento(async (req, res) => {
  const situacao = await situacaoRepresentante(req.auth.sub);
  if (!situacao) return erro(res, 404, "Esta conta não tem dados de cadastro da Receita.");
  if (situacao.representante === "verificado") return res.json(resposta(situacao));
  const faltando = situacao.requisitos.filter((r) => !r.ok);
  if (faltando.length) {
    return res.status(400).json({ erro: "Ainda não dá para verificar automaticamente.", faltando: faltando.map((r) => r.id), ...resposta(situacao) });
  }
  await situacao.cadastro.update({ representanteStatus: "verificado", representanteMetodo: "dominio", representanteVerificadoEm: new Date() });
  await notificar({
    tipoConta: "empresa",
    contaId: req.auth.sub,
    tipo: "plataforma",
    texto: "Empresa verificada: o e-mail da conta está no mesmo domínio do site da empresa. O selo de verificada já aparece no seu perfil.",
    link: "/empresa/configuracoes",
  });
  return res.json(resposta(await situacaoRepresentante(req.auth.sub)));
});
