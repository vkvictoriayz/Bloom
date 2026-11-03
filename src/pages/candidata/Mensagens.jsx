import { useState } from 'react'
import { Link } from 'react-router-dom'

import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Avatar from '../../components/comunidade/Avatar'
import Botao from '../../components/ui/Botao'
import { Aviso, Entrada } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { tempoRelativo } from '../../services/comunidade'
import { DISPONIVEL, listarConversas } from '../../services/recursos'
import { cn } from '../../lib/cn'

// Lista de conversas. Sem API de mensagens, não mostra conversas de exemplo.
function Mensagens() {
  const r = useRecurso(DISPONIVEL.mensagens, listarConversas)
  const [busca, setBusca] = useState('')

  return (
    <>
      <TituloPagina titulo="Mensagens" descricao="Converse com outras profissionais e com empresas." />

      {r.estado === 'indisponivel' && (
        <RecursoIndisponivel
          icone="mensagem"
          titulo="Mensagens ainda não disponíveis"
          descricao="As conversas privadas dependem de uma API de mensagens. Enquanto isso, você pode comentar publicações no feed e seguir outras integrantes."
        >
          <Botao as={Link} to="/candidata/feed">
            Ir para o feed
          </Botao>
        </RecursoIndisponivel>
      )}
      {r.estado === 'carregando' && <Esqueleto className="h-64 rounded-xl" />}
      {r.estado === 'erro' && <Aviso tipo="erro">{r.erro}</Aviso>}
      {r.estado === 'pronto' &&
        (() => {
          const conversas = (r.dados.conversas ?? []).filter((c) => c.participante.nome.toLowerCase().includes(busca.trim().toLowerCase()))
          return (
            <div className="rounded-xl border border-linha bg-branco">
              <div className="border-b border-linha p-4">
                <Entrada type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conversa" aria-label="Buscar conversa" />
              </div>
              {conversas.length === 0 ? (
                <Vazio className="border-0">
                  <VazioTitulo>{busca ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</VazioTitulo>
                  <VazioDescricao>Suas conversas aparecem aqui.</VazioDescricao>
                </Vazio>
              ) : (
                <ul className="divide-y divide-linha">
                  {conversas.map((c) => (
                    <li key={c.id}>
                      <Link to={`/candidata/mensagens/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-papel">
                        <Avatar nome={c.participante.nome} foto={c.participante.foto} />
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate', c.naoLidas ? 'font-bold text-tinta' : 'font-semibold text-tinta-2')}>{c.participante.nome}</span>
                          <span className="block truncate text-sm text-suave">{c.ultimaMensagem}</span>
                        </span>
                        <span className="flex flex-col items-end gap-1">
                          <span className="text-xs text-suave">{tempoRelativo(c.atualizadaEm)}</span>
                          {c.naoLidas > 0 && <span className="rounded-full bg-vinho px-2 text-xs font-bold text-white">{c.naoLidas}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })()}
    </>
  )
}

export default Mensagens
