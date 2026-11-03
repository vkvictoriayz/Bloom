import { randomBytes } from "node:crypto";
import { ImagemPerfil, imagensDe } from "../models/Imagem.js";

const LIMITE = 1024 * 1024; // 1 MB, o mesmo limite da tela
const CAMPOS = ["foto", "capa"];

// Confere o conteúdo pelos primeiros bytes, não só pelo que o navegador diz.
const ASSINATURAS = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
};

const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });
const dono = (req) => ({ donoTipo: req.auth.tipo, donoId: req.auth.sub });

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

  const partes = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.imagem ?? ""));
  if (!partes) return erro(res, 400, "Envie uma imagem JPG, PNG ou WebP.", campo);
  const [, mime, base64] = partes;
  const dados = Buffer.from(base64, "base64");
  if (!dados.length || dados.length > LIMITE) return erro(res, 400, "A imagem deve ter até 1 MB.", campo);
  if (!ASSINATURAS[mime](dados)) return erro(res, 400, "O arquivo não é uma imagem válida.", campo);

  const valores = { mime, dados, chave: randomBytes(16).toString("hex"), atualizadaEm: new Date() };
  const existente = await ImagemPerfil.findOne({ where: { ...dono(req), campo } });
  if (existente) await existente.update(valores);
  else await ImagemPerfil.create({ ...dono(req), campo, ...valores });

  const mapa = await imagensDe(req.auth.tipo, [req.auth.sub]);
  return res.json({ imagens: mapa.get(req.auth.sub) });
});

// DELETE /api/imagens/:campo
export const remover = comTratamento(async (req, res) => {
  const { campo } = req.params;
  if (!CAMPOS.includes(campo)) return erro(res, 404, "Rota não encontrada.");
  await ImagemPerfil.destroy({ where: { ...dono(req), campo } });
  const mapa = await imagensDe(req.auth.tipo, [req.auth.sub]);
  return res.json({ imagens: mapa.get(req.auth.sub) });
});

// GET /api/imagens/minhas
export const minhas = comTratamento(async (req, res) => {
  const mapa = await imagensDe(req.auth.tipo, [req.auth.sub]);
  return res.json({ imagens: mapa.get(req.auth.sub) });
});

// GET /api/imagens/:chave — aberta, para funcionar em <img src>. A chave é
// aleatória e muda a cada envio, por isso a resposta pode ficar em cache.
export const servir = comTratamento(async (req, res) => {
  const { chave } = req.params;
  if (!/^[0-9a-f]{32}$/.test(chave)) return erro(res, 404, "Imagem não encontrada.");
  const imagem = await ImagemPerfil.findOne({ attributes: ["mime", "dados"], where: { chave } });
  if (!imagem) return erro(res, 404, "Imagem não encontrada.");
  res.set({
    "Content-Type": imagem.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'",
  });
  return res.send(imagem.dados);
});
