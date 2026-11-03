import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { dataCurta, listarCandidaturasEmpresa } from '../../services/empresa'

// Notificações da empresa. Ainda não há API de notificações, então esta
// página mostra o único aviso que pode ser montado com dados reais: as
// candidaturas novas (status "Pendente") às vagas da empresa. Elas saem da
// lista quando a empresa muda o status — não há "marcar como lida".
function Notificacoes() {
  const r = useCarregar(() => listarCandidaturasEmpresa({ status: 'Pendente' }))

  return (
    <>
      <TituloPagina titulo="Notificações" descricao="Candidaturas novas aguardando análise." />
      {r.tipo === 'carregando' && <Carregando />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (r.dados.candidaturas.length === 0 ? (
          <Vazio className="bg-branco">
            <IlustracaoConexoes className="max-w-[220px]" />
            <VazioTitulo>Tudo em dia</VazioTitulo>
            <VazioDescricao>Não há candidaturas novas aguardando análise.</VazioDescricao>
          </Vazio>
        ) : (
          <ul className="cartao divide-y divide-linha overflow-hidden">
            {r.dados.candidaturas.map((c) => (
              <li key={c.id}>
                <Link to={`/empresa/candidaturas/${c.id}`} className="flex items-start gap-3 bg-blush/30 p-4 hover:bg-blush/60">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
                    <Icone nome="candidaturas" tamanho={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-tinta">
                      Nova candidatura de {c.candidata.nome} para {c.vaga.titulo}
                    </span>
                    <span className="block text-xs text-suave">{dataCurta(c.data)} · aguardando análise</span>
                  </span>
                  <Icone nome="seta" tamanho={16} className="mt-1 text-suave" />
                </Link>
              </li>
            ))}
          </ul>
        ))}
      <p className="mt-6 flex items-start gap-2 text-xs text-suave">
        <Icone nome="info" tamanho={16} className="mt-px shrink-0" />
        Avisos de mensagens, interações em publicações e atividades de comunidades dependem de uma API de notificações que ainda não existe.
      </p>
    </>
  )
}

export default Notificacoes
