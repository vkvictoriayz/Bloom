import { ImagemPerfil, imagensDe } from "../models/Imagem.js";
import { ComunidadeCapa } from "../models/Grupos.js";
import { IconePerfil, PublicacaoImagem } from "../models/RedeSocial.js";
import { iconeValido } from "../services/icones.js";
import { lerImagem, novaChave } from "../utils/imagem.js";

const LIMITE = 1024 * 1024; // 1 MB, o mesmo limite da tela
const CAMPOS = ["foto", "capa"];

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const dono = (req) => ({ donoTipo: req.auth.tipo, donoId: req.auth.sub });
const minhasImagens = async (req) => (await imagensDe(req.auth.tipo, [req.auth.sub])).get(req.auth.sub);

const comTratamento = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error(e);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
};

// PUT /api/imagens/:campo { imagem: "data:image/png;base64,..." }
export const enviar = comTratamento(async (req, res) => {
  const { campo } = req.params;
  if (!CAMPOS.includes(campo)) return erro(res, 404, "Rota não encontrada.");

  const lida = lerImagem(req.body?.imagem, LIMITE);
  if (lida.erro) return erro(res, 400, lida.erro, campo);

  const valores = { mime: lida.mime, dados: lida.dados, chave: novaChave(), atualizadaEm: new Date() };
  const existente = await ImagemPerfil.findOne({ where: { ...dono(req), campo } });
  if (existente) await existente.update(valores);
  else await ImagemPerfil.create({ ...dono(req), campo, ...valores });
  // Foto enviada substitui o ícone escolhido antes.
  if (campo === "foto") await IconePerfil.destroy({ where: dono(req) });

  return res.json({ imagens: await minhasImagens(req) });
});

// DELETE /api/imagens/:campo
export const remover = comTratamento(async (req, res) => {
  const { campo } = req.params;
  if (!CAMPOS.includes(campo)) return erro(res, 404, "Rota não encontrada.");
  await ImagemPerfil.destroy({ where: { ...dono(req), campo } });
  return res.json({ imagens: await minhasImagens(req) });
});

// PUT /api/imagens/icone { icone: "icone:codigo:vinho" } — ícone predefinido
// no lugar da foto. A foto enviada (se houver) sai, para o ícone aparecer;
// dá para voltar a enviar uma foto quando quiser.
export const escolherIcone = comTratamento(async (req, res) => {
  const icone = String(req.body?.icone ?? "");
  if (!iconeValido(icone, req.auth.tipo)) return erro(res, 400, "Escolha um dos ícones da lista.", "icone");
  const existente = await IconePerfil.findOne({ where: dono(req) });
  if (existente) await existente.update({ icone, atualizadoEm: new Date() });
  else await IconePerfil.create({ ...dono(req), icone });
  await ImagemPerfil.destroy({ where: { ...dono(req), campo: "foto" } });
  return res.json({ imagens: await minhasImagens(req) });
});

// DELETE /api/imagens/icone — volta às iniciais (ou ao logo, para empresas).
export const removerIcone = comTratamento(async (req, res) => {
  await IconePerfil.destroy({ where: dono(req) });
  return res.json({ imagens: await minhasImagens(req) });
});

// GET /api/imagens/minhas
export const minhas = comTratamento(async (req, res) => {
  return res.json({ imagens: await minhasImagens(req) });
});

// GET /api/imagens/:chave — aberta, para funcionar em <img src>. Serve foto,
// capa e imagens de publicações. A chave é aleatória e muda a cada envio, por
// isso a resposta pode ficar em cache.
export const servir = comTratamento(async (req, res) => {
  const { chave } = req.params;
  if (!/^[0-9a-f]{32}$/.test(chave)) return erro(res, 404, "Imagem não encontrada.");
  const imagem =
    (await ImagemPerfil.findOne({ attributes: ["mime", "dados"], where: { chave } })) ??
    (await PublicacaoImagem.findOne({ attributes: ["mime", "dados"], where: { chave } })) ??
    (await ComunidadeCapa.findOne({ attributes: ["mime", "dados"], where: { chave } }));
  if (!imagem) return erro(res, 404, "Imagem não encontrada.");
  res.set({
    "Content-Type": imagem.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'",
  });
  return res.send(imagem.dados);
});
