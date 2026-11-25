import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Icone from '../../components/Icone'
import { IlustracaoCrescimento } from '../../components/ilustracoes/Ilustracoes'
import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { tempoRelativo } from '../../services/comunidade'
import { DISPONIVEL, EVENTO_NOTIFICACOES, listarNotificacoes, marcarComoLida, marcarTodasComoLidas } from '../../services/recursos'
import { cn } from '../../lib/cn'

const ICONES = { mensagem: 'mensagem', curtida: 'coracao', comentario: 'mensagem', publicacao: 'inicio', candidatura: 'candidaturas', vaga: 'maleta', conexao: 'perfil', convite: 'email', comunidade: 'grupo', plataforma: 'borboleta' }
const TONS = {
  mensagem: 'bg-[#efe8f6] text-[#7b55b0]',
  comentario: 'bg-[#efe8f6] text-[#7b55b0]',
  curtida: 'bg-blush text-vinho',
  conexao: 'bg-blush text-vinho',
  comunidade: 'bg-sucesso-claro text-sucesso',
  candidatura: 'bg-alerta-claro text-alerta',
  vaga: 'bg-alerta-claro text-alerta',
  convite: 'bg-sucesso-claro text-sucesso',
  plataforma: 'bg-vinho text-white',
}

function grupoDe(data) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  const dias = Math.round((hoje - d) / 864e5)
  if (dias <= 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 7) return 'Nesta semana'
  return 'Anteriores'
}

function agrupar(lista) {
  const grupos = []
  for (const n of lista) {
    const g = grupoDe(n.criadaEm)
    const atual = grupos.at(-1)
    if (atual && atual.titulo === g) atual.itens.push(n)
    else grupos.push({ titulo: g, itens: [n] })
  }
  return grupos
}

function Notificacoes({ descricao = 'Mensagens, curtidas, comentários, novas seguidoras e mudanças nas suas candidaturas.' }) {
  const r = useRecurso(DISPONIVEL.notificacoes, listarNotificacoes)
  const [lidas, setLidas] = useState([])
  const [todasLidas, setTodasLidas] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  async function abrir(n) {
    if (!n.lida && !lidas.includes(n.id)) {
      setLidas((l) => [...l, n.id])
      marcarComoLida(n.id)
        .then(() => window.dispatchEvent(new Event(EVENTO_NOTIFICACOES)))
        .catch(() => {})
    }
    if (n.link) navigate(n.link)
  }

  async function marcarTodas() {
    setErro('')
    try {
      await marcarTodasComoLidas()
      setTodasLidas(true)
      window.dispatchEvent(new Event(EVENTO_NOTIFICACOES))
    } catch (e) {
      setErro(e.message)
    }
  }

  async function marcar(id) {
    setErro('')
    try {
      await marcarComoLida(id)
      setLidas((l) => [...l, id])
      window.dispatchEvent(new Event(EVENTO_NOTIFICACOES))
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <>
      <TituloPagina
        titulo="Notificações"
        descricao={descricao}
        acoes={
          r.estado === 'pronto' &&
          !todasLidas &&
          r.dados.notificacoes?.some((n) => !n.lida && !lidas.includes(n.id)) && (
            <Botao variante="secundario" onClick={marcarTodas}>
              Marcar todas como lidas
            </Botao>
          )
        }
      />

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
          <div className="flex flex-col gap-6">
            {agrupar(r.dados.notificacoes).map((g) => (
              <section key={g.titulo} aria-label={g.titulo}>
                <h2 className="mb-2 text-xs font-bold tracking-[0.14em] text-suave uppercase">{g.titulo}</h2>
                <ul className="animar-lista overflow-hidden rounded-2xl border border-linha bg-branco">
                  {g.itens.map((n) => {
                    const lida = n.lida || todasLidas || lidas.includes(n.id)
                    return (
                      <li key={n.id} className={cn('relative flex items-start gap-3 border-b border-linha p-4 transition-colors last:border-b-0', !lida && 'bg-blush/30')}>
                        {!lida && <span aria-hidden="true" className="absolute top-1/2 left-1.5 size-1.5 -translate-y-1/2 rounded-full bg-vinho" />}
                        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', TONS[n.tipo] ?? 'bg-blush text-vinho')} aria-hidden="true">
                          <Icone nome={ICONES[n.tipo] ?? 'sino'} tamanho={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          {n.link ? (
                            <button type="button" onClick={() => abrir(n)} className={cn('text-left text-sm hover:text-vinho hover:underline', lida ? 'text-tinta-2' : 'font-semibold text-tinta')}>
                              {n.texto}
                            </button>
                          ) : (
                            <p className={cn('text-sm', lida ? 'text-tinta-2' : 'font-semibold text-tinta')}>{n.texto}</p>
                          )}
                          <p className="mt-0.5 text-xs text-suave">{tempoRelativo(n.criadaEm)}</p>
                        </div>
                        {!lida && (
                          <Botao variante="fantasma" tamanho="sm" onClick={() => marcar(n.id)} className="shrink-0">
                            <Icone nome="check" tamanho={14} /> <span className="max-sm:sr-only">Marcar como lida</span>
                          </Botao>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <Vazio className="bg-branco">
            <IlustracaoCrescimento className="max-w-[200px]" />
            <VazioTitulo>Nenhuma notificação</VazioTitulo>
            <VazioDescricao>Quando algo acontecer, você verá aqui.</VazioDescricao>
          </Vazio>
        ))}
    </>
  )
}

export default Notificacoes
