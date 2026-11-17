import { createHmac, timingSafeEqual } from "node:crypto";

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

function assinar(conteudo, segredo) {
  return createHmac("sha256", segredo).update(conteudo).digest("base64url");
}

export function criarToken(payload, segredo, expiraEmSegundos) {
  const agora = Math.floor(Date.now() / 1000);
  const corpo = { ...payload, iat: agora, exp: agora + expiraEmSegundos };
  const conteudo = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(corpo)}`;
  return `${conteudo}.${assinar(conteudo, segredo)}`;
}

export function verificarToken(token, segredo) {
  if (typeof token !== "string") return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;

  const [cabecalho, corpo, assinatura] = partes;

  const esperada = Buffer.from(assinar(`${cabecalho}.${corpo}`, segredo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) {
    return null;
  }

  try {
    const head = JSON.parse(Buffer.from(cabecalho, "base64url").toString());
    if (head.alg !== "HS256") return null;

    const payload = JSON.parse(Buffer.from(corpo, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
