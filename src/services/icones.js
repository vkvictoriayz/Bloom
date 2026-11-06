// Ícones predefinidos da Bloom: alternativa à foto de perfil (candidatas e
// empresas) e imagem das comunidades. Guardados como "icone:<nome>:<cor>".
// Os desenhos ficam no front (src/views/components/IconePerfil.jsx); aqui só
// a lista do que é aceito.

const TECNOLOGIA = ["codigo", "terminal", "dados", "nuvem", "chip", "robo", "celular", "escudo"];
const CARREIRA = ["foguete", "lampada", "grafico", "trofeu", "livro", "estrela", "paleta", "globo"];
const REDE = ["rede", "grupo", "broto", "coracao"];
const EMPRESA = ["predio", "maleta"];

export const ICONES = {
  usuaria: [...TECNOLOGIA, ...CARREIRA, ...REDE],
  empresa: [...EMPRESA, ...TECNOLOGIA, ...CARREIRA, "rede", "broto"],
  comunidade: [...TECNOLOGIA, ...CARREIRA, ...REDE],
};
export const CORES = ["vinho", "ameixa", "rosa", "blush", "musgo", "mel"];

// "icone:codigo:vinho" válido para o público ("usuaria" | "empresa" | "comunidade")?
export function iconeValido(valor, publico) {
  const partes = /^icone:([a-z]+):([a-z]+)$/.exec(String(valor ?? ""));
  return Boolean(partes && ICONES[publico]?.includes(partes[1]) && CORES.includes(partes[2]));
}
