try {
  localStorage.removeItem('bloom-candidaturas')
} catch {
}

export const EVENTO_CANDIDATURAS = 'bloom-candidaturas-atualizadas'
export const lerCandidaturas = () => []

export function candidaturaDaVaga(vagaId, lista = []) {
  return lista.find((item) => String(item.vagaId) === String(vagaId)) ?? null
}

export function buscarCandidatura(id, lista = []) {
  return lista.find((item) => String(item.id) === String(id)) ?? null
}

export const ETAPAS = ['Candidatura enviada', 'Análise da empresa', 'Resultado']

export function situacao(candidatura) {
  switch (candidatura.status) {
    case 'Em análise':
      return { grupo: 'andamento', rotulo: 'Em análise', variante: 'alerta', etapasConcluidas: 1, etapaAtual: 1 }
    case 'Em entrevista':
      return { grupo: 'andamento', rotulo: 'Em entrevista', variante: 'alerta', etapasConcluidas: 1, etapaAtual: 1, detalheAtual: 'Em entrevista' }
    case 'Aprovada':
      return { grupo: 'aprovada', rotulo: 'Aprovada', variante: 'sucesso', etapasConcluidas: 3, etapaAtual: null }
    case 'Reprovada':
      return { grupo: 'recusada', rotulo: 'Não selecionada', variante: 'erro', etapasConcluidas: 3, etapaAtual: null }
    case 'Encerrada':
      return { grupo: 'encerrada', rotulo: 'Vaga encerrada', variante: 'neutro', etapasConcluidas: 1, etapaAtual: null }
    default:
      return { grupo: 'andamento', rotulo: 'Recebida', variante: 'vinho', etapasConcluidas: 1, etapaAtual: 1 }
  }
}
