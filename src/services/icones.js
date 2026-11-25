const BLOOM = ["borboleta", "contorno", "voo", "duas", "padrao", "flor", "petala", "botao", "ramo", "monograma"];

export const ICONES = {
  usuaria: BLOOM,
  empresa: BLOOM,
  comunidade: BLOOM,
};
export const CORES = ["vinho", "ameixa", "rosa", "blush", "musgo", "mel"];

export function iconeValido(valor, publico) {
  const partes = /^icone:([a-z]+):([a-z]+)$/.exec(String(valor ?? ""));
  return Boolean(partes && ICONES[publico]?.includes(partes[1]) && CORES.includes(partes[2]));
}
