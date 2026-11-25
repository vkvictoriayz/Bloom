const BLOOM = [
  ['borboleta', 'Borboleta Bloom'],
  ['contorno', 'Contorno da borboleta'],
  ['voo', 'Voo'],
  ['flor', 'Flor'],
  ['petala', 'Pétala'],
  ['botao', 'Botão de flor'],
  ['monograma', 'Monograma B'],
]
const TECNOLOGIA = [
  ['codigo', 'Código'],
  ['terminal', 'Terminal'],
  ['dados', 'Dados'],
  ['nuvem', 'Nuvem'],
  ['chip', 'Hardware'],
  ['robo', 'IA e automação'],
  ['celular', 'Mobile'],
  ['escudo', 'Segurança'],
]
const CARREIRA = [
  ['foguete', 'Crescimento'],
  ['lampada', 'Ideias'],
  ['grafico', 'Resultados'],
  ['trofeu', 'Conquistas'],
  ['livro', 'Estudos'],
  ['estrela', 'Destaque'],
  ['paleta', 'Design'],
  ['globo', 'Global'],
]
const REDE = [
  ['rede', 'Networking'],
  ['grupo', 'Comunidade'],
  ['broto', 'Broto'],
  ['coracao', 'Apoio'],
]
const EMPRESA = [
  ['predio', 'Empresa'],
  ['maleta', 'Negócios'],
]

export const GRUPOS_ICONES = {
  usuaria: [
    ['Bloom', BLOOM],
    ['Tecnologia', TECNOLOGIA],
    ['Carreira', CARREIRA],
    ['Rede', REDE],
  ],
  empresa: [
    ['Bloom', BLOOM],
    ['Empresa', [...EMPRESA, ['rede', 'Networking'], ['broto', 'Broto']]],
    ['Tecnologia', TECNOLOGIA],
    ['Carreira', CARREIRA],
  ],
  comunidade: [
    ['Bloom', BLOOM],
    ['Tecnologia', TECNOLOGIA],
    ['Carreira', CARREIRA],
    ['Rede', REDE],
  ],
}

export const CORES_ICONE = {
  vinho: { nome: 'Vinho', fundo: '#85243d', traco: '#ffffff' },
  ameixa: { nome: 'Ameixa', fundo: '#4e1226', traco: '#f4e4e9' },
  rosa: { nome: 'Rosa', fundo: '#9c4a63', traco: '#ffffff' },
  blush: { nome: 'Blush', fundo: '#f4e4e9', traco: '#85243d' },
  musgo: { nome: 'Musgo', fundo: '#2b6a4c', traco: '#ffffff' },
  mel: { nome: 'Mel', fundo: '#87570a', traco: '#ffffff' },
}

export const ehIcone = (valor) => typeof valor === 'string' && valor.startsWith('icone:')

export function lerIcone(valor) {
  const [, nome, cor] = String(valor ?? '').split(':')
  return { nome, cor: CORES_ICONE[cor] ? cor : 'vinho' }
}

