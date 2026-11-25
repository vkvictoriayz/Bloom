const BLOOM = [
  ['borboleta', 'Borboleta Bloom'],
  ['contorno', 'Contorno da borboleta'],
  ['voo', 'Voo'],
  ['duas', 'Duas borboletas'],
  ['padrao', 'Padrão Bloom'],
  ['flor', 'Flor'],
  ['petala', 'Pétala'],
  ['botao', 'Botão de flor'],
  ['ramo', 'Ramo'],
  ['monograma', 'Monograma B'],
]

export const GRUPOS_ICONES = {
  usuaria: [['Símbolos Bloom', BLOOM]],
  empresa: [['Símbolos Bloom', BLOOM]],
  comunidade: [['Símbolos Bloom', BLOOM]],
}

export const CORES_ICONE = {
  vinho: { nome: 'Vinho', fundo: '#85243d', traco: '#ffffff', gradiente: 'linear-gradient(140deg, #a3324f 0%, #85243d 45%, #4e1226 100%)' },
  ameixa: { nome: 'Ameixa', fundo: '#4e1226', traco: '#f4e4e9', gradiente: 'linear-gradient(140deg, #6b2238 0%, #4e1226 50%, #2a0a15 100%)' },
  rosa: { nome: 'Rosa', fundo: '#9c4a63', traco: '#ffffff', gradiente: 'linear-gradient(140deg, #c27a90 0%, #9c4a63 55%, #85243d 100%)' },
  blush: { nome: 'Blush', fundo: '#f4e4e9', traco: '#85243d', gradiente: 'linear-gradient(140deg, #ffffff 0%, #f4e4e9 55%, #e7c3cf 100%)' },
  musgo: { nome: 'Musgo', fundo: '#2b6a4c', traco: '#ffffff', gradiente: 'linear-gradient(140deg, #3f8a5a 0%, #2b6a4c 55%, #1b4632 100%)' },
  mel: { nome: 'Mel', fundo: '#87570a', traco: '#ffffff', gradiente: 'linear-gradient(140deg, #c88f2e 0%, #a36d14 55%, #87570a 100%)' },
}

export const ehIcone = (valor) => typeof valor === 'string' && valor.startsWith('icone:')

export function lerIcone(valor) {
  const [, nome, cor] = String(valor ?? '').split(':')
  return { nome, cor: CORES_ICONE[cor] ? cor : 'vinho' }
}
