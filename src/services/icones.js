const BLOOM = ["borboleta", "contorno", "voo", "flor", "petala", "botao", "monograma"];
const TECNOLOGIA = ["codigo", "terminal", "dados", "nuvem", "chip", "robo", "celular", "escudo"];
const CARREIRA = ["foguete", "lampada", "grafico", "trofeu", "livro", "estrela", "paleta", "globo"];
const REDE = ["rede", "grupo", "broto", "coracao"];
const EMPRESA = ["predio", "maleta"];

export const ICONES = {
  usuaria: [...BLOOM, ...TECNOLOGIA, ...CARREIRA, ...REDE],
  empresa: [...BLOOM, ...EMPRESA, ...TECNOLOGIA, ...CARREIRA, "rede", "broto"],
  comunidade: [...BLOOM, ...TECNOLOGIA, ...CARREIRA, ...REDE],
};
export const CORES = ["vinho", "ameixa", "rosa", "blush", "musgo", "mel"];

export function iconeValido(valor, publico) {
  const partes = /^icone:([a-z]+):([a-z]+)$/.exec(String(valor ?? ""));
  return Boolean(partes && ICONES[publico]?.includes(partes[1]) && CORES.includes(partes[2]));
}
