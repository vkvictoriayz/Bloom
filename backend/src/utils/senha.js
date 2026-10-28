import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const N = 16384; // custo do scrypt
const TAMANHO_CHAVE = 64;

// Formato salvo em senha_hash: scrypt$<N>$<salt em hex>$<hash em hex>
export async function gerarHash(senha) {
  const salt = randomBytes(16);
  const chave = await scryptAsync(senha, salt, TAMANHO_CHAVE, { N });
  return `scrypt$${N}$${salt.toString("hex")}$${chave.toString("hex")}`;
}

export async function conferirSenha(senha, hashSalvo) {
  const partes = String(hashSalvo ?? "").split("$");
  if (partes.length !== 4 || partes[0] !== "scrypt") return false;

  const [, custo, saltHex, hashHex] = partes;
  const esperado = Buffer.from(hashHex, "hex");
  const obtido = await scryptAsync(senha, Buffer.from(saltHex, "hex"), esperado.length, {
    N: Number(custo),
  });

  return esperado.length === obtido.length && timingSafeEqual(esperado, obtido);
}
