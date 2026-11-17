export const FORMATOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp']
export const ACEITAR_IMAGEM = FORMATOS_IMAGEM.join(',')
const LIMITE_ARQUIVO = 10 * 1024 * 1024
const LIMITE_ENVIO = 2 * 1024 * 1024
const LADO_MAXIMO = 1600

const lerComoDataUrl = (blob) =>
  new Promise((ok, falha) => {
    const leitor = new FileReader()
    leitor.onload = () => ok(leitor.result)
    leitor.onerror = () => falha(new Error('Não foi possível ler a imagem.'))
    leitor.readAsDataURL(blob)
  })

const carregar = (url) =>
  new Promise((ok, falha) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = () => falha(new Error('O arquivo não é uma imagem válida.'))
    img.src = url
  })

const paraBlob = (canvas, tipo, qualidade) => new Promise((ok) => canvas.toBlob(ok, tipo, qualidade))

export async function prepararImagem(arquivo) {
  if (!arquivo) throw new Error('Escolha uma imagem.')
  if (!FORMATOS_IMAGEM.includes(arquivo.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.')
  if (arquivo.size > LIMITE_ARQUIVO) throw new Error('A imagem deve ter até 10 MB.')

  const url = URL.createObjectURL(arquivo)
  try {
    const img = await carregar(url)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight))
    const largura = Math.max(1, Math.round(img.naturalWidth * escala))
    const altura = Math.max(1, Math.round(img.naturalHeight * escala))

    if (escala === 1 && arquivo.size <= LIMITE_ENVIO) return { dataUrl: await lerComoDataUrl(arquivo), largura, altura }

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    canvas.getContext('2d').drawImage(img, 0, 0, largura, altura)
    for (const qualidade of [0.85, 0.75, 0.6]) {
      const blob = (await paraBlob(canvas, 'image/webp', qualidade)) ?? (await paraBlob(canvas, 'image/jpeg', qualidade))
      if (blob && FORMATOS_IMAGEM.includes(blob.type) && blob.size <= LIMITE_ENVIO) {
        return { dataUrl: await lerComoDataUrl(blob), largura, altura }
      }
    }
    throw new Error('Não foi possível reduzir a imagem para até 2 MB. Tente outra.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
