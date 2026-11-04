// Candidaturas da candidata: vêm do servidor (useCandidaturas, em
// hooks/useVagasReais.js). Aqui ficam só as funções de leitura e de
// exibição (etapas e status), usadas pelas telas.
//
// Versões antigas registravam neste navegador candidaturas a vagas de
// exemplo, que nunca chegavam a uma empresa. Esse registro foi apagado.
try {
  localStorage.removeItem('bloom-candidaturas')
} catch {
  // armazenamento indisponível: nada a limpar
}

// Ainda usados por páginas públicas antigas; sempre vazios.
export const EVENTO_CANDIDATURAS = 'bloom-candidaturas-atualizadas'
export const lerCandidaturas = () => []

export function candidaturaDaVaga(vagaId, lista = []) {
  return lista.find((item) => String(item.vagaId) === String(vagaId)) ?? null
}

export function buscarCandidatura(id, lista = []) {
  return lista.find((item) => String(item.id) === String(id)) ?? null
}

// Etapas reais do processo, alinhadas ao ENUM do banco.
export const ETAPAS = ['Candidatura enviada', 'Análise da empresa', 'Resultado']

// Como cada status aparece: grupo (para filtros/contagem), rótulo, cor do
// selo e quantas etapas estão confirmadas.
export function situacao(candidatura) {
  switch (candidatura.status) {
    case 'Em análise':
      return { grupo: 'andamento', rotulo: 'Em análise', variante: 'alerta', etapasConcluidas: 1, etapaAtual: 1 }
    case 'Aprovada':
      return { grupo: 'aprovada', rotulo: 'Aprovada', variante: 'sucesso', etapasConcluidas: 3, etapaAtual: null }
    case 'Reprovada':
      return { grupo: 'recusada', rotulo: 'Não selecionada', variante: 'erro', etapasConcluidas: 3, etapaAtual: null }
    case 'Encerrada':
      return { grupo: 'encerrada', rotulo: 'Vaga encerrada', variante: 'neutro', etapasConcluidas: 1, etapaAtual: null }
    default:
      return { grupo: 'andamento', rotulo: 'Enviada', variante: 'vinho', etapasConcluidas: 1, etapaAtual: 1 }
  }
}
