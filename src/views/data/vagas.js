import { areasTI } from './areas'

const NIVEIS_INICIANTES = ['Estágio', 'Assistente', 'Júnior', 'Trainee']

export const ehIniciante = (vaga) => NIVEIS_INICIANTES.includes(vaga.nivel)

export function formatarPublicacao(dias) {
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Há 1 dia'
  if (dias < 7) return `Há ${dias} dias`
  const semanas = Math.round(dias / 7)
  return semanas === 1 ? 'Há 1 semana' : `Há ${semanas} semanas`
}

export const opcoesFiltro = {
  areas: areasTI.map((a) => a.nome),
  modalidades: ['Presencial', 'Híbrido', 'Remoto'],
}

export function correspondeBusca(vaga, termo) {
  const alvo = termo.trim().toLowerCase()
  if (!alvo) return true
  return [
    vaga.titulo,
    vaga.dadosEmpresa?.nome,
    vaga.dadosEmpresa?.nomeCurto,
    vaga.area,
    vaga.local,
    vaga.nivel,
    ...vaga.competencias,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(alvo)
}

export function recomendarVagas(lista, tecnicas = [], limite = 3) {
  const minhas = tecnicas.map((t) => t.toLowerCase()).filter(Boolean)
  if (!minhas.length) return null
  return lista
    .map((vaga) => {
      const texto = [vaga.titulo, vaga.area, ...(vaga.requisitos ?? []), ...(vaga.competencias ?? [])].join(' ').toLowerCase()
      return { vaga, comuns: minhas.filter((t) => texto.includes(t)) }
    })
    .filter((item) => item.comuns.length > 0)
    .sort((a, b) => b.comuns.length - a.comuns.length || a.vaga.publicadaHaDias - b.vaga.publicadaHaDias)
    .slice(0, limite)
}
