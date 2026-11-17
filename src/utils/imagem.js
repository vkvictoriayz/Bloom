import { randomBytes } from "node:crypto";

const ASSINATURAS = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
};

export function lerImagem(valor, limite) {
  const partes = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(valor ?? ""));
  if (!partes) return { erro: "Envie uma imagem JPG, PNG ou WebP." };
  const [, mime, base64] = partes;
  const dados = Buffer.from(base64, "base64");
  const mb = Math.round(limite / (1024 * 1024));
  if (!dados.length || dados.length > limite) return { erro: `A imagem deve ter até ${mb} MB.` };
  if (!ASSINATURAS[mime](dados)) return { erro: "O arquivo não é uma imagem válida." };
  return { mime, dados };
}

export const novaChave = () => randomBytes(16).toString("hex");
