import { Comentario, Publicacao } from "../models/Comunidade.js";
import { Denuncia, ALVOS_DENUNCIA, MOTIVOS_DENUNCIA } from "../models/Denuncia.js";
import { PerfilEmpresa, PublicacaoEmpresa, Vaga } from "../models/Empresarial.js";
import { Comunidade } from "../models/Grupos.js";
import { Empresa, Usuaria } from "../models/index.js";
import { criarLimitador } from "../utils/limitador.js";

// Denúncias feitas por candidatas e empresas (/api/denuncias). A equipe
// analisa no painel (/api/admin/denuncias).

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const texto = (v) => (typeof v === "string" ? v.trim() : "");
const idParam = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);
const porConta = criarLimitador({ janela: 60 * 60 * 1000, maximo: 20 });

// Dono de cada alvo: ninguém denuncia o próprio conteúdo. Devolve
// { tipo, id } do dono, ou null se o alvo não existe.
async function donoDoAlvo(alvoTipo, alvoId) {
  switch (alvoTipo) {
    case "publicacao": {
      const p = await Publicacao.findByPk(alvoId);
      return p && { tipo: "usuaria", id: p.usuariaId };
    }
    case "comentario": {
      const c = await Comentario.findByPk(alvoId);
      return c && { tipo: "usuaria", id: c.usuariaId };
    }
    case "publicacao_empresa": {
      const p = await PublicacaoEmpresa.findByPk(alvoId);
      return p && { tipo: "empresa", id: p.empresaId };
    }
    case "perfil":
      return (await Usuaria.findByPk(alvoId)) ? { tipo: "usuaria", id: alvoId } : null;
    case "empresa":
      return (await Empresa.findByPk(alvoId)) ? { tipo: "empresa", id: alvoId } : null;
    case "vaga": {
      const v = await Vaga.findByPk(alvoId);
      const p = v && (await PerfilEmpresa.findByPk(v.perfilEmpresaId));
      return p && { tipo: "empresa", id: p.empresaId };
    }
    case "comunidade": {
      const c = await Comunidade.findByPk(alvoId);
      return c && { tipo: "usuaria", id: c.criadoraId };
    }
    default:
      return null;
  }
}

// POST /api/denuncias { alvoTipo, alvoId, motivo, descricao? }
export async function denunciar(req, res) {
  try {
    const alvoTipo = texto(req.body?.alvoTipo);
    const alvoId = idParam(req.body?.alvoId);
    const motivo = texto(req.body?.motivo);
    const descricao = texto(req.body?.descricao);
    if (!ALVOS_DENUNCIA.includes(alvoTipo) || !alvoId) return erro(res, 400, "O que você quer denunciar?");
    if (!MOTIVOS_DENUNCIA[motivo]) return erro(res, 400, "Escolha um motivo.", "motivo");
    if (descricao.length > 500) return erro(res, 400, "A explicação pode ter até 500 caracteres.", "descricao");
    if (motivo === "outro" && descricao.length < 5) return erro(res, 400, "Conte rapidamente o que aconteceu.", "descricao");

    const dono = await donoDoAlvo(alvoTipo, alvoId);
    if (!dono) return erro(res, 404, "Não encontramos o que você quer denunciar. Talvez já tenha sido removido.");
    if (dono.tipo === req.auth.tipo && dono.id === req.auth.sub) return erro(res, 400, "Você não pode denunciar o seu próprio conteúdo.");

    const chave = `${req.auth.tipo}:${req.auth.sub}`;
    if (porConta.bloqueado(chave)) return erro(res, 429, "Você enviou muitas denúncias em pouco tempo. Tente de novo mais tarde.");

    const onde = { tipoConta: req.auth.tipo, contaId: req.auth.sub, alvoTipo, alvoId };
    const existente = await Denuncia.findOne({ where: onde });
    if (existente?.status === "aberta") return res.json({ mensagem: "Você já denunciou isto. A equipe da Bloom está analisando." });
    porConta.registrar(chave);
    if (existente) {
      // Já analisada antes: volta para a fila com o motivo novo.
      await existente.update({ motivo, descricao: descricao || null, status: "aberta", criadaEm: new Date(), adminId: null, resolucao: null, resolvidaEm: null });
    } else {
      await Denuncia.create({ ...onde, motivo, descricao: descricao || null });
    }
    return res.status(201).json({ mensagem: "Denúncia enviada. A equipe da Bloom vai analisar, e você recebe um aviso quando terminar." });
  } catch (e) {
    console.error("Denúncia:", e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
}

// GET /api/denuncias/motivos — lista para o formulário.
export function motivos(req, res) {
  return res.json({ motivos: Object.entries(MOTIVOS_DENUNCIA).map(([id, rotulo]) => ({ id, rotulo })) });
}
