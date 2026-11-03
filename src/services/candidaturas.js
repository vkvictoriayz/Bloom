import { gravarJSON, lerLista } from './armazenamento'

// Candidaturas da usuária.
//
// A tabela CANDIDATURAS existe no banco (status: Pendente, Em análise,
// Aprovada, Reprovada), mas ainda não há rota no backend. Por isso a
// candidatura é registrada neste navegador. Uma candidatura local nunca
// avança de etapa sozinha: só um status vindo do servidor
// (confirmadaPeloServidor) pode marcar análise ou resultado.

export const CHAVE_CANDIDATURAS = 'bloom-candidaturas'
export const EVENTO_CANDIDATURAS = 'bloom-candidaturas-atualizadas'

const STATUS_SERVIDOR = ['Pendente', 'Em análise', 'Aprovada', 'Reprovada', 'Encerrada']

function normalizar(candidatura) {
  const doServidor = candidatura.confirmadaPeloServidor === true
  const status = doServidor && STATUS_SERVIDOR.includes(candidatura.status) ? candidatura.status : 'Pendente'
  return { ...candidatura, status, confirmadaPeloServidor: doServidor }
}

export function lerCandidaturas() {
  return lerLista(CHAVE_CANDIDATURAS).map(normalizar)
}

export function candidaturaDaVaga(vagaId, lista = lerCandidaturas()) {
  return lista.find((item) => String(item.vagaId) === String(vagaId)) ?? null
}

export function buscarCandidatura(id, lista = lerCandidaturas()) {
  return lista.find((item) => String(item.id) === String(id)) ?? null
}

// Registra a candidatura; não duplica se já existir.
// "extras" guarda o que a candidata enviou (apresentação, links).
// Retorna { ok, jaExistia, candidatura }.
export function candidatar(vaga, extras = {}) {
  const atuais = lerCandidaturas()
  const existente = candidaturaDaVaga(vaga.id, atuais)
  if (existente) return { ok: true, jaExistia: true, candidatura: existente }

  const agora = new Date()
  const nova = {
    id: `${vaga.id}-${agora.getTime()}`,
    vagaId: vaga.id,
    cargo: vaga.titulo,
    empresa: vaga.dadosEmpresa?.nomeCurto ?? vaga.empresa,
    empresaSlug: vaga.empresa,
    local: vaga.local,
    modalidade: vaga.modalidade,
    data: agora.toLocaleDateString('pt-BR'),
    enviadaEm: agora.toISOString(),
    status: 'Pendente',
    confirmadaPeloServidor: false,
    enviado: {
      apresentacao: extras.apresentacao ?? '',
      links: extras.links ?? [],
      perfil: extras.perfil ?? null,
    },
  }

  const ok = gravarJSON(CHAVE_CANDIDATURAS, [...atuais, nova], EVENTO_CANDIDATURAS)
  return { ok, jaExistia: false, candidatura: ok ? nova : null }
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
