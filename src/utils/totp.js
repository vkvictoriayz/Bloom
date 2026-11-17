import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Verificação em duas etapas (TOTP, RFC 6238): o mesmo código de 6 dígitos que
// apps como Google Authenticator e Microsoft Authenticator mostram a cada 30 s.
// Sem biblioteca externa: só node:crypto.

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PASSO = 30; // segundos

function base32(buf) {
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let saida = "";
  for (let i = 0; i < bits.length; i += 5) saida += ALFABETO[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return saida;
}

function deBase32(texto) {
  const limpo = String(texto).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of limpo) bits += ALFABETO.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export const novoSegredo = () => base32(randomBytes(20));

function codigoDoPasso(segredo, passo) {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(passo));
  const h = createHmac("sha1", deBase32(segredo)).update(contador).digest();
  const o = h[h.length - 1] & 0x0f;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

export const passoAtual = (agora = Date.now()) => Math.floor(agora / 1000 / PASSO);
export const codigoAtual = (segredo, agora = Date.now()) => codigoDoPasso(segredo, passoAtual(agora));

// Confere o código aceitando 30 s de diferença no relógio do celular.
// Devolve o passo usado (para não aceitar o mesmo código duas vezes) ou null.
export function conferirCodigo(segredo, codigo, ultimoPasso = null, agora = Date.now()) {
  const c = String(codigo ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  const atual = passoAtual(agora);
  for (const p of [atual - 1, atual, atual + 1]) {
    if (ultimoPasso !== null && p <= ultimoPasso) continue;
    const esperado = Buffer.from(codigoDoPasso(segredo, p));
    if (timingSafeEqual(esperado, Buffer.from(c))) return p;
  }
  return null;
}

// Endereço que os apps autenticadores entendem (também vira QR code).
export const enderecoOtp = (segredo, conta) =>
  `otpauth://totp/${encodeURIComponent(`Bloom Admin:${conta}`)}?secret=${segredo}&issuer=${encodeURIComponent("Bloom Admin")}&digits=6&period=${PASSO}`;

// O segredo fica cifrado no banco (AES-256-GCM, chave derivada do JWT_SECRET).
// Se o JWT_SECRET mudar, é preciso configurar a verificação de novo.
const chave = () => createHash("sha256").update(`${process.env.JWT_SECRET}:bloom-totp`).digest();

export function cifrar(texto) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), dados].map((b) => b.toString("base64")).join(".");
}

export function decifrar(guardado) {
  const [iv, tag, dados] = String(guardado).split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", chave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(dados), d.final()]).toString("utf8");
}

// Códigos de recuperação (uso único) para quando o celular se perde.
const hashRecuperacao = (c) => createHash("sha256").update(String(c).toUpperCase().replace(/[^A-Z0-9]/g, "")).digest("hex");

export function novosCodigosRecuperacao(qtd = 8) {
  const codigos = Array.from({ length: qtd }, () => {
    const t = base32(randomBytes(5)).slice(0, 8);
    return `${t.slice(0, 4)}-${t.slice(4)}`;
  });
  return { codigos, hashes: codigos.map(hashRecuperacao) };
}

// Se o código for um de recuperação válido, devolve a lista sem ele; senão null.
export function usarCodigoRecuperacao(hashesJson, codigo) {
  let hashes;
  try {
    hashes = JSON.parse(hashesJson ?? "[]");
  } catch {
    return null;
  }
  const h = hashRecuperacao(codigo);
  if (!hashes.includes(h)) return null;
  return hashes.filter((x) => x !== h);
}
