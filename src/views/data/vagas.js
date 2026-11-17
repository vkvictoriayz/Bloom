import { areasTI } from './areas'

// Ajudantes das vagas (as vagas em si vêm da API: services/vagasApi.js).

// Níveis considerados porta de entrada na carreira.
const NIVEIS_INICIANTES = ['Estágio', 'Assistente', 'Júnior', 'Trainee']

export const ehIniciante = (vaga) => NIVEIS_INICIANTES.includes(vaga.nivel)

export function formatarPublicacao(dias) {
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Há 1 dia'
  if (dias < 7) return `Há ${dias} dias`
  const semanas = Math.round(dias / 7)
  return semanas === 1 ? 'Há 1 semana' : `Há ${semanas} semanas`
}

// Opções dos formulários (vaga da empresa e preferências da candidata): o
// catálogo de áreas da Bloom (data/areas.js) e as modalidades de trabalho.
// Os filtros da lista de vagas usam só os valores das vagas publicadas.
export const opcoesFiltro = {
  areas: areasTI.map((a) => a.nome),
  modalidades: ['Presencial', 'Híbrido', 'Remoto'],
}

// Busca textual em cargo, empresa, área, local e tecnologias.
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

// Recomendação pela sobreposição real entre as competências técnicas do
// perfil e as tecnologias da vaga. Sem competências no perfil, devolve null.
// Vagas de "lista" que citam competências técnicas da candidata no título,
// na área, nos requisitos ou nas competências da vaga.
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
