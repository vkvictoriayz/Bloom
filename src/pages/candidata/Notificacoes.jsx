import { useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { tempoRelativo } from '../../services/comunidade'
import { DISPONIVEL, listarNotificacoes, marcarComoLida } from '../../services/recursos'
import { cn } from '../../lib/cn'

const ICONES = { mensagem: 'mensagem', curtida: 'coracao', comentario: 'mensagem', publicacao: 'inicio', candidatura: 'candidaturas', vaga: 'maleta', conexao: 'perfil' }

function Notificacoes() {
  const r = useRecurso(DISPONIVEL.notificacoes, listarNotificacoes)
  const [lidas, setLidas] = useState([])
  const [erro, setErro] = useState('')

  async function marcar(id) {
    setErro('')
    try {
      await marcarComoLida(id)
      setLidas((l) => [...l, id])
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <>
      <TituloPagina titulo="Notificações" descricao="Mensagens, curtidas, comentários, candidaturas e novas oportunidades." />

      {r.estado === 'indisponivel' && (
        <RecursoIndisponivel
          icone="sino"
          titulo="Notificações ainda não disponíveis"
          descricao="Os avisos de curtidas, comentários, mensagens e candidaturas dependem de uma API de notificações. Por enquanto, acompanhe as interações no feed e o status em Minhas candidaturas."
        >
          <Botao as={Link} to="/candidata/candidaturas" variante="secundario">
            Minhas candidaturas
          </Botao>
        </RecursoIndisponivel>
      )}
      {r.estado === 'carregando' && <Esqueleto className="h-64 rounded-xl" />}
      {(r.estado === 'erro' || erro) && <Aviso tipo="erro">{r.erro ?? erro}</Aviso>}
      {r.estado === 'pronto' &&
        (r.dados.notificacoes?.length ? (
          <ul className="overflow-hidden rounded-xl border border-linha bg-branco">
            {r.dados.notificacoes.map((n) => {
              const lida = n.lida || lidas.includes(n.id)
              return (
                <li key={n.id} className={cn('flex items-start gap-3 border-b border-linha p-4 last:border-b-0', !lida && 'bg-blush/40')}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
                    <Icone nome={ICONES[n.tipo] ?? 'sino'} tamanho={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', lida ? 'text-tinta-2' : 'font-semibold text-tinta')}>{n.texto}</p>
                    <p className="text-xs text-suave">{tempoRelativo(n.criadaEm)}</p>
                  </div>
                  {!lida && (
                    <Botao variante="fantasma" tamanho="sm" onClick={() => marcar(n.id)}>
                      Marcar como lida
                    </Botao>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <Vazio className="bg-branco">
            <VazioTitulo>Nenhuma notificação</VazioTitulo>
            <VazioDescricao>Quando algo acontecer, você verá aqui.</VazioDescricao>
          </Vazio>
        ))}
    </>
  )
}

export default Notificacoes
