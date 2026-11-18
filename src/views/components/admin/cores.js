export const CORES = ['#b03a57', '#c88f2e', '#3f8a5a', '#7b55b0']

const diaCurto = (iso) => {
  const [, m, d] = String(iso).split('-')
  return `${d}/${m}`
}

export function agruparSemanas(dias, valores) {
  if (dias.length <= 14) return { rotulos: dias.map(diaCurto), valores, titulos: dias.map(diaCurto) }
  const rotulos = []
  const titulos = []
  const somas = valores.map(() => [])
  for (let i = 0; i < dias.length; i += 7) {
    const fim = Math.min(i + 7, dias.length)
    rotulos.push(diaCurto(dias[i]))
    titulos.push(`${diaCurto(dias[i])} a ${diaCurto(dias[fim - 1])}`)
    valores.forEach((serie, s) => somas[s].push(serie.slice(i, fim).reduce((a, b) => a + b, 0)))
  }
  return { rotulos, valores: somas, titulos }
}
